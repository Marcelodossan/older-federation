"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Usuario = {
  nome: string;
  email: string;
  senha?: string;
  foto?: string | null;
  isAdmin?: boolean;
};

type JogadorAntigo = {
  idOnline: string;
  email?: string;
  nome: string;
  sobrenome?: string;
  dataNascimento?: string;
  whatsapp?: string;
  pais?: string;
  idioma?: string;
  foto?: string | null;
  valor?: number;
};

type JogadorNovo = {
  id?: string;
  idOnline: string;
  nome: string;
  posicao?: string;
  numero?: string;
  imagem?: string;
  foto?: string | null;
  overall?: number;
  valor?: number;
  pais?: string;
};

type JogadorUI = {
  idOnline: string;
  nomeCompleto: string;
  imagem?: string | null;
  valor: number;
  overall: number;
  posicao?: string;
  numero?: string;
};

type EquipeAntiga = {
  nomeClube: string;
  nomeClubeAbreviado?: string;
  nacionalidade: string;
  plataforma: string;
  instagram?: string;
  emblema?: string | null;
  plantel?: any[];
  campeonatos?: any[];
};

type EquipeNova = {
  id: string;
  nome: string;
  pais: string;
  plataforma: string;
  imagem: string;
  instagram?: string;
  vitorias?: number;
  empates?: number;
  derrotas?: number;
  titulos?: number;
  elenco?: any[];
  criadoPor?: string;
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
    jogador?.idOnline ||
    "Jogador";

  return {
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
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [jogador, setJogador] = useState<JogadorUI | null>(null);
  const [equipe, setEquipe] = useState<EquipeUI | null>(null);
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const logado = localStorage.getItem("logado");
    const usuarioLogado = localStorage.getItem("usuarioLogado");

    if (logado !== "true" || !usuarioLogado) {
      window.location.href = "/login";
      return;
    }

    const usuarioAtual: Usuario = JSON.parse(usuarioLogado);
    setUsuario(usuarioAtual);

    const jogadoresSalvos = JSON.parse(localStorage.getItem("jogadores") || "[]");
    const equipesSalvas = JSON.parse(localStorage.getItem("equipes") || "[]");
    const campeonatosSalvos = JSON.parse(localStorage.getItem("campeonatos") || "[]");

    if (Array.isArray(jogadoresSalvos) && jogadoresSalvos.length > 0) {
      setJogador(normalizarJogador(jogadoresSalvos[0]));
    }

    if (Array.isArray(equipesSalvas) && equipesSalvas.length > 0) {
      const equipeNormalizada = normalizarEquipe(equipesSalvas[0]);
      setEquipe(equipeNormalizada);
    }

    if (Array.isArray(campeonatosSalvos)) {
      setCampeonatos(campeonatosSalvos);
    }
  }, []);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  function handleLogout() {
    localStorage.removeItem("logado");
    localStorage.removeItem("usuarioLogado");
    window.location.href = "/login";
  }

  function handleEditarClube() {
    if (!equipe) return;
    localStorage.setItem("equipeEmEdicao", JSON.stringify(equipe.original));
    window.location.href = "/criar-equipe";
  }

  const cardsCampeonatos = useMemo(() => {
    if (campeonatos.length > 0) return campeonatos;
    return [];
  }, [campeonatos]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          padding: "22px 18px 14px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "28px",
              flexWrap: "wrap",
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
                gap: "28px",
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

                      <Link
                        href="/editar-jogador"
                        style={{
                          display: "block",
                          padding: "12px 14px",
                          color: "white",
                          textDecoration: "none",
                          borderBottom: "1px solid #222",
                          fontWeight: 700,
                          fontSize: "16px",
                        }}
                      >
                        Editar jogador
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/criar-jogador"
                      style={{
                        display: "block",
                        padding: "12px 14px",
                        color: "white",
                        textDecoration: "none",
                        borderBottom: "1px solid #222",
                      }}
                    >
                      Criar jogador
                    </Link>
                  )}

                  {equipe ? (
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
          padding: "14px 16px 28px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid #1f1f1f",
            borderRadius: "18px",
            padding: "12px",
          }}
        >
          <div
            style={{
              background: "#050505",
              border: "1px solid #262626",
              borderRadius: "14px",
              padding: "18px 14px 22px 14px",
              minHeight: "180px",
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
                  display: "flex",
                  gap: "18px",
                  flexWrap: "wrap",
                  paddingLeft: "8px",
                }}
              >
                {cardsCampeonatos.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      width: "130px",
                      minHeight: "182px",
                      background: "#0b0b0b",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid #1f1f1f",
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
                        <span style={{ color: "#777", fontSize: 12 }}>Sem imagem</span>
                      )}
                    </div>

                    <div style={{ padding: 10, fontSize: 13, fontWeight: 700 }}>
                      {item.titulo}
                    </div>
                  </div>
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
          }}
        >
          <div
            style={{
              background: "#050505",
              border: "1px solid #262626",
              borderRadius: "14px",
              padding: "18px 14px 16px 14px",
              minHeight: "260px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "28px",
              }}
            >
              <div>
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
                    maxWidth: "420px",
                    minHeight: "120px",
                    background: "#0b0b0b",
                    marginLeft: "8px",
                    borderRadius: "10px",
                    padding: "14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    border: "1px solid #1f1f1f",
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
                          <span style={{ color: "#ff4fd8", fontSize: "12px" }}>Foto</span>
                        )}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "white",
                          }}
                        >
                          {jogador.idOnline}
                        </div>

                        <div style={{ color: "#bdbdbd", fontSize: "14px" }}>
                          {jogador.posicao || "Jogador"}
                          {jogador.numero ? ` • #${jogador.numero}` : ""}
                        </div>
                      </div>

                      <div style={{ marginLeft: "auto", textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>{jogador.overall}</div>
                        <div style={{ fontSize: 12, color: "#bdbdbd" }}>Overall</div>
                      </div>
                    </>
                  ) : (
                    <span style={{ color: "#777" }}>Nenhum jogador criado</span>
                  )}
                </div>
              </div>

              <div>
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
                    maxWidth: "420px",
                    minHeight: "120px",
                    background: "#0b0b0b",
                    borderRadius: "10px",
                    padding: "14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    border: "1px solid #1f1f1f",
                  }}
                >
                  {equipe ? (
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
                        {equipe.imagem ? (
                          <img
                            src={equipe.imagem}
                            alt={equipe.nome}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              padding: "4px",
                            }}
                          />
                        ) : (
                          <span style={{ color: "#ff4fd8", fontSize: "12px" }}>Escudo</span>
                        )}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "white",
                          }}
                        >
                          {equipe.nome}
                        </div>

                        <div style={{ color: "#bdbdbd", fontSize: "14px" }}>
                          {equipe.pais} • {equipe.plataforma}
                        </div>
                      </div>

                      <div
                        style={{
                          marginLeft: "auto",
                          display: "grid",
                          gridTemplateColumns: "repeat(4, 1fr)",
                          gap: 12,
                          textAlign: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800 }}>{equipe.vitorias}</div>
                          <div style={{ fontSize: 12, color: "#bdbdbd" }}>V</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800 }}>{equipe.empates}</div>
                          <div style={{ fontSize: 12, color: "#bdbdbd" }}>E</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800 }}>{equipe.derrotas}</div>
                          <div style={{ fontSize: 12, color: "#bdbdbd" }}>D</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800 }}>{equipe.titulos}</div>
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