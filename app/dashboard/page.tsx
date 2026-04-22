"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "marcelo.dos.santos.filho03@gmail.com";

type Usuario = {
  id?: string;
  nome: string;
  email: string;
  senha?: string;
  foto?: string | null;
  imagem?: string | null;
  isAdmin?: boolean;
};

type JogadorUI = {
  id?: string;
  idOnline: string;
  nomeCompleto: string;
  imagem?: string | null;
  valor: number;
  overall: number;
  posicao?: string;
  numero?: string;
};

type EquipeUI = {
  id?: string;
  nome: string;
  pais: string;
  plataforma: string;
  imagem?: string | null;
  instagram?: string;
  vitorias: number;
  empates: number;
  derrotas: number;
  titulos: number;
  elenco: any[];
  original: any;
};

type Campeonato = {
  id: string;
  titulo: string;
  imagem?: string;
};

function normalizarJogador(jogador: any): JogadorUI {
  const nomeCompleto =
    jogador?.nomeCompleto ||
    [jogador?.nome, jogador?.sobrenome].filter(Boolean).join(" ").trim() ||
    jogador?.nome ||
    jogador?.idOnline ||
    "Jogador";

  return {
    id: jogador?.id,
    idOnline: jogador?.idOnline || jogador?.nome || "Sem ID",
    nomeCompleto,
    imagem: jogador?.imagem || jogador?.foto || null,
    valor: Number(jogador?.valor || 0),
    overall: Number(jogador?.overall || 55),
    posicao: jogador?.posicao || "",
    numero: jogador?.numero || "",
  };
}

function normalizarEquipe(equipe: any): EquipeUI {
  return {
    id: equipe?.id,
    nome: equipe?.nome || equipe?.nomeClube || "Clube",
    pais: equipe?.pais || equipe?.nacionalidade || "Brasil",
    plataforma: equipe?.plataforma || "PC",
    imagem: equipe?.imagem || equipe?.emblema || null,
    instagram: equipe?.instagram || "",
    vitorias: Number(equipe?.vitorias || 0),
    empates: Number(equipe?.empates || 0),
    derrotas: Number(equipe?.derrotas || 0),
    titulos: Number(equipe?.titulos || 0),
    elenco: Array.isArray(equipe?.elenco)
      ? equipe.elenco
      : Array.isArray(equipe?.plantel)
      ? equipe.plantel
      : [],
    original: equipe,
  };
}

function formatarValor(valor?: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [jogador, setJogador] = useState<JogadorUI | null>(null);
  const [minhaEquipe, setMinhaEquipe] = useState<EquipeUI | null>(null);
  const [topEquipe, setTopEquipe] = useState<EquipeUI | null>(null);
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function carregarDashboard() {
      try {
        setCarregando(true);

        const supabase = createClient();

        const {
          data: { user },
          error: sessionError,
        } = await supabase.auth.getUser();

        if (sessionError) {
          console.error(sessionError);
          router.push("/login");
          return;
        }

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: perfil, error: perfilError } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (perfilError) {
          console.error(perfilError);
        }

        const usuarioAtual: Usuario = {
          id: user.id,
          nome:
            perfil?.nome ||
            user.user_metadata?.nome ||
            user.email?.split("@")[0] ||
            "Usuário",
          email: user.email || "",
          foto:
            perfil?.foto ||
            perfil?.imagem ||
            user.user_metadata?.imagem ||
            null,
          imagem: perfil?.imagem || user.user_metadata?.imagem || null,
          isAdmin:
            String(user.email || "").toLowerCase().trim() ===
            ADMIN_EMAIL.toLowerCase(),
        };

        setUsuario(usuarioAtual);

        const { data: jogadoresBanco, error: jogadoresError } = await supabase
          .from("jogadores")
          .select("*")
          .eq("criadoPor", user.id)
          .order("created_at", { ascending: false });

        if (jogadoresError) {
          console.error(jogadoresError);
        }

        if (Array.isArray(jogadoresBanco) && jogadoresBanco.length > 0) {
          setJogador(normalizarJogador(jogadoresBanco[0]));
        } else {
          setJogador(null);
        }

        const { data: minhasEquipesBanco, error: minhasEquipesError } =
          await supabase
            .from("equipes")
            .select("*")
            .eq("criadoPor", user.id)
            .order("created_at", { ascending: false });

        if (minhasEquipesError) {
          console.error(minhasEquipesError);
        }

        if (Array.isArray(minhasEquipesBanco) && minhasEquipesBanco.length > 0) {
          setMinhaEquipe(normalizarEquipe(minhasEquipesBanco[0]));
        } else {
          setMinhaEquipe(null);
        }

        const { data: todasEquipesBanco, error: todasEquipesError } =
          await supabase
            .from("equipes")
            .select("*")
            .order("created_at", { ascending: false });

        if (todasEquipesError) {
          console.error(todasEquipesError);
        }

        if (Array.isArray(todasEquipesBanco) && todasEquipesBanco.length > 0) {
          setTopEquipe(normalizarEquipe(todasEquipesBanco[0]));
        } else {
          setTopEquipe(null);
        }

        const { data: campeonatosBanco, error: campeonatosError } =
          await supabase
            .from("campeonatos")
            .select("id, titulo, imagem")
            .order("created_at", { ascending: false });

        if (campeonatosError) {
          console.error(campeonatosError);
          setCampeonatos([]);
        } else {
          setCampeonatos((campeonatosBanco || []) as Campeonato[]);
        }
      } catch (error) {
        console.error(error);
        router.push("/login");
      } finally {
        setCarregando(false);
      }
    }

    carregarDashboard();
  }, [router]);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  async function handleLogout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error(error);
    } finally {
      router.push("/login");
    }
  }

  function handleEditarClube() {
    if (!minhaEquipe?.id) return;
    router.push("/criar-equipe");
  }

  const cardsCampeonatos = useMemo(() => {
    if (campeonatos.length > 0) return campeonatos;
    return [];
  }, [campeonatos]);

  if (carregando) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#000",
          color: "white",
          fontFamily: "Arial, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          boxSizing: "border-box",
        }}
      >
        Carregando dashboard...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "white",
        fontFamily: "Arial, sans-serif",
        overflowX: "hidden",
      }}
    >
      <header
        style={{
          padding: "22px 18px 14px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1280px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
            flexWrap: "wrap",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "28px",
              flexWrap: "wrap",
              minWidth: 0,
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  color: "#ff4fd8",
                  fontSize: "18px",
                  fontWeight: 700,
                }}
              >
                Older Federation
              </h1>

              <p
                style={{
                  margin: "4px 0 0 0",
                  color: "#d8d8d8",
                  fontSize: "14px",
                }}
              >
                Bem-vindo, {usuario?.nome || "Usuário"}
              </p>
            </div>

            <nav
              style={{
                display: "flex",
                gap: "20px",
                marginTop: "10px",
                fontSize: "14px",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/campeonatos"
                style={{ color: "#9a9a9a", textDecoration: "none" }}
              >
                Campeonatos
              </Link>

              <Link
                href="/equipes"
                style={{ color: "#9a9a9a", textDecoration: "none" }}
              >
                Equipes
              </Link>

              <Link
                href="/jogadores"
                style={{ color: "#9a9a9a", textDecoration: "none" }}
              >
                Jogadores
              </Link>

              {usuario?.isAdmin && (
                <Link
                  href="/criar-campeonato"
                  style={{
                    color: "#ff4fd8",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  Criar campeonato
                </Link>
              )}
            </nav>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              marginTop: "2px",
              flexWrap: "wrap",
            }}
          >
            <div
              ref={menuRef}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setMenuAberto((prev) => !prev)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span>Minha conta</span>

                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    border: "1px solid #2a2a2a",
                    overflow: "hidden",
                    background: "#111",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {usuario?.foto ? (
                    <img
                      src={usuario.foto}
                      alt="Foto do usuário"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "12px" }}>👤</span>
                  )}
                </div>
              </button>

              {menuAberto && (
                <div
                  style={{
                    position: "absolute",
                    top: "40px",
                    right: 0,
                    background: "#111",
                    border: "1px solid #2a2a2a",
                    borderRadius: "12px",
                    minWidth: "220px",
                    maxWidth: "90vw",
                    overflow: "hidden",
                    zIndex: 20,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                  }}
                >
                  {jogador ? (
                    <>
                      <div
                        style={{
                          padding: "12px 12px 2px 12px",
                          color: "white",
                          fontWeight: 700,
                          fontSize: "18px",
                        }}
                      >
                        {formatarValor(jogador.valor)}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: "0 12px 12px 12px",
                          color: "#cfcfcf",
                          fontSize: "12px",
                          borderBottom: "1px solid #222",
                        }}
                      >
                        <span>Valor do jogador</span>
                        <span style={{ color: "#fff", fontWeight: 700 }}>
                          {jogador.overall}
                        </span>
                      </div>
                    </>
                  ) : null}

                  {minhaEquipe ? (
                    <button
                      onClick={handleEditarClube}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "12px 14px",
                        color: "white",
                        background: "transparent",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "16px",
                        fontWeight: 700,
                      }}
                    >
                      Editar clube
                    </button>
                  ) : (
                    <Link
                      href="/criar-equipe"
                      style={{
                        display: "block",
                        padding: "12px 14px",
                        color: "white",
                        textDecoration: "none",
                      }}
                    >
                      Criar equipe
                    </Link>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              style={{
                padding: "10px 16px",
                borderRadius: "10px",
                border: "none",
                background: "#2a2a2a",
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <section
        style={{
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "14px 16px 28px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid #1f1f1f",
            borderRadius: "18px",
            padding: "12px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: "#050505",
              border: "1px solid #262626",
              borderRadius: "14px",
              padding: "18px 14px 22px 14px",
              minHeight: "180px",
              boxSizing: "border-box",
            }}
          >
            <h2
              style={{
                margin: "0 0 18px 8px",
                fontSize: "24px",
                fontWeight: 500,
                color: "#d3d3d3",
              }}
            >
              Campeonatos
            </h2>

            {cardsCampeonatos.length === 0 ? (
              <div
                style={{
                  marginLeft: 8,
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid #1f1f1f",
                  background: "#0b0b0b",
                  color: "#888",
                }}
              >
                Nenhum campeonato cadastrado ainda.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "18px",
                  paddingLeft: "8px",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {cardsCampeonatos.map((item) => (
                  <Link
                    key={item.id}
                    href={`/campeonatos/${item.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div
                      style={{
                        width: "100%",
                        minHeight: "182px",
                        background: "#0b0b0b",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid #1f1f1f",
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: 130,
                          background: "#111",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {item.imagem ? (
                          <img
                            src={item.imagem}
                            alt={item.titulo}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <span style={{ color: "#777", fontSize: 12 }}>
                            Sem imagem
                          </span>
                        )}
                      </div>

                      <div style={{ padding: 10, fontSize: 13, fontWeight: 700 }}>
                        {item.titulo}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid #1f1f1f",
            borderRadius: "18px",
            padding: "12px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: "#050505",
              border: "1px solid #262626",
              borderRadius: "14px",
              padding: "18px 14px 16px 14px",
              minHeight: "260px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "28px",
                alignItems: "start",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <h2
                  style={{
                    margin: "0 0 12px 8px",
                    fontSize: "22px",
                    fontWeight: 500,
                    color: "#ffffff",
                  }}
                >
                  Top Players
                </h2>

                <div
                  style={{
                    width: "100%",
                    minHeight: "120px",
                    background: "#0b0b0b",
                    marginLeft: "8px",
                    borderRadius: "10px",
                    padding: "14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    border: "1px solid #1f1f1f",
                    boxSizing: "border-box",
                    flexWrap: "wrap",
                  }}
                >
                  {jogador ? (
                    <>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "10px",
                          overflow: "hidden",
                          background: "#111",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid #222",
                        }}
                      >
                        {jogador.imagem ? (
                          <img
                            src={jogador.imagem}
                            alt={jogador.nomeCompleto}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <span style={{ color: "#ff4fd8", fontSize: "12px" }}>
                            Foto
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "white",
                            wordBreak: "break-word",
                          }}
                        >
                          {jogador.idOnline}
                        </div>

                        <div style={{ color: "#bdbdbd", fontSize: "14px" }}>
                          {jogador.posicao || "Jogador"}
                          {jogador.numero ? ` • #${jogador.numero}` : ""}
                        </div>
                      </div>

                      <div
                        style={{
                          marginLeft: "auto",
                          textAlign: "right",
                        }}
                      >
                        <div style={{ fontSize: 16, fontWeight: 800 }}>
                          {jogador.overall}
                        </div>
                        <div style={{ fontSize: 12, color: "#bdbdbd" }}>
                          Overall
                        </div>
                      </div>
                    </>
                  ) : (
                    <span style={{ color: "#777" }}>Nenhum jogador criado</span>
                  )}
                </div>
              </div>

              <div style={{ minWidth: 0 }}>
                <h2
                  style={{
                    margin: "0 0 12px 8px",
                    fontSize: "22px",
                    fontWeight: 500,
                    color: "#ffffff",
                    textTransform: "uppercase",
                  }}
                >
                  Top Teams
                </h2>

                <div
                  style={{
                    width: "100%",
                    minHeight: "120px",
                    background: "#0b0b0b",
                    borderRadius: "10px",
                    padding: "14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    border: "1px solid #1f1f1f",
                    boxSizing: "border-box",
                    flexWrap: "wrap",
                  }}
                >
                  {topEquipe ? (
                    <>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "10px",
                          overflow: "hidden",
                          background: "#111",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid #222",
                        }}
                      >
                        {topEquipe.imagem ? (
                          <img
                            src={topEquipe.imagem}
                            alt={topEquipe.nome}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              padding: "4px",
                            }}
                          />
                        ) : (
                          <span style={{ color: "#ff4fd8", fontSize: "12px" }}>
                            Escudo
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "white",
                            wordBreak: "break-word",
                          }}
                        >
                          {topEquipe.nome}
                        </div>

                        <div style={{ color: "#bdbdbd", fontSize: "14px" }}>
                          {topEquipe.pais} • {topEquipe.plataforma}
                        </div>
                      </div>

                      <div
                        style={{
                          marginLeft: "auto",
                          display: "grid",
                          gridTemplateColumns: "repeat(4, minmax(18px, 1fr))",
                          gap: 12,
                          textAlign: "center",
                          minWidth: "fit-content",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800 }}>
                            {topEquipe.vitorias}
                          </div>
                          <div style={{ fontSize: 12, color: "#bdbdbd" }}>V</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800 }}>
                            {topEquipe.empates}
                          </div>
                          <div style={{ fontSize: 12, color: "#bdbdbd" }}>E</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800 }}>
                            {topEquipe.derrotas}
                          </div>
                          <div style={{ fontSize: 12, color: "#bdbdbd" }}>D</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800 }}>
                            {topEquipe.titulos}
                          </div>
                          <div style={{ fontSize: 12, color: "#bdbdbd" }}>T</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <span style={{ color: "#777" }}>Nenhum clube criado</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}