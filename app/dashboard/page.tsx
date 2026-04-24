"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "marcelo.dos.santos.filho03@gmail.com";

type Usuario = {
  id?: string;
  nome: string;
  email: string;
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
    "Player";

  return {
    id: jogador?.id,
    idOnline: jogador?.idOnline || jogador?.nome || "No ID",
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
    nome: equipe?.nome || equipe?.nomeClube || "Club",
    pais: equipe?.pais || equipe?.nacionalidade || "Brazil",
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
  return Number(valor || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "EUR",
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

        if (sessionError || !user) {
          router.push("/login");
          return;
        }

        const { data: perfil } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        const usuarioAtual: Usuario = {
          id: user.id,
          nome:
            perfil?.nome ||
            user.user_metadata?.nome ||
            user.email?.split("@")[0] ||
            "User",
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

        const { data: jogadoresBanco } = await supabase
          .from("jogadores")
          .select("*")
          .eq("criadoPor", user.id)
          .order("created_at", { ascending: false });

        setJogador(
          Array.isArray(jogadoresBanco) && jogadoresBanco.length > 0
            ? normalizarJogador(jogadoresBanco[0])
            : null
        );

        const { data: minhasEquipesBanco } = await supabase
          .from("equipes")
          .select("*")
          .eq("criadoPor", user.id)
          .order("created_at", { ascending: false });

        setMinhaEquipe(
          Array.isArray(minhasEquipesBanco) && minhasEquipesBanco.length > 0
            ? normalizarEquipe(minhasEquipesBanco[0])
            : null
        );

        const { data: todasEquipesBanco } = await supabase
          .from("equipes")
          .select("*")
          .order("created_at", { ascending: false });

        setTopEquipe(
          Array.isArray(todasEquipesBanco) && todasEquipesBanco.length > 0
            ? normalizarEquipe(todasEquipesBanco[0])
            : null
        );

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
    router.push("/criar-equipe");
  }

  const cardsCampeonatos = useMemo(() => campeonatos, [campeonatos]);

  if (carregando) {
    return (
      <main style={pageStyle}>
        <div style={loadingStyle}>Loading dashboard...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <div style={brandAreaStyle}>
            <div>
              <h1 style={brandTitleStyle}>Euro Cup</h1>
              <p style={brandSubtitleStyle}>Welcome, {usuario?.nome || "User"}</p>
            </div>

            <nav style={navStyle}>
              <Link href="/campeonatos" style={navLinkStyle}>Tournaments</Link>
              <Link href="/equipes" style={navLinkStyle}>Teams</Link>
              <Link href="/jogadores" style={navLinkStyle}>Players</Link>

              {usuario?.isAdmin && (
                <Link href="/criar-campeonato" style={navHighlightStyle}>
                  Create Tournament
                </Link>
              )}
            </nav>
          </div>

          <div style={accountAreaStyle}>
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setMenuAberto((prev) => !prev)}
                style={accountButtonStyle}
              >
                <span>My Account</span>

                <div style={userIconStyle}>
                  {usuario?.foto ? (
                    <img src={usuario.foto} alt="User photo" style={imageCoverStyle} />
                  ) : (
                    <span style={{ fontSize: 12 }}>👤</span>
                  )}
                </div>
              </button>

              {menuAberto && (
                <div style={dropdownStyle}>
                  {jogador && (
                    <>
                      <div style={dropdownValueStyle}>
                        {formatarValor(jogador.valor)}
                      </div>

                      <div style={dropdownMetaStyle}>
                        <span>Player Value</span>
                        <strong>{jogador.overall}</strong>
                      </div>
                    </>
                  )}

                  <button onClick={handleEditarClube} style={dropdownButtonStyle}>
                    {minhaEquipe ? "Edit Club" : "Create Team"}
                  </button>
                </div>
              )}
            </div>

            <button onClick={handleLogout} style={logoutButtonStyle}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <section style={contentStyle}>
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={eyebrowStyle}>EUROPA LEAGUE HUB</div>
              <h2 style={sectionTitleStyle}>Tournaments</h2>
            </div>
          </div>

          {cardsCampeonatos.length === 0 ? (
            <div style={emptyStateStyle}>No tournaments registered yet.</div>
          ) : (
            <div style={tournamentGridStyle}>
              {cardsCampeonatos.map((item) => (
                <Link
                  key={item.id}
                  href={`/campeonatos/${item.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <article style={tournamentCardStyle}>
                    <div style={tournamentImageStyle}>
                      {item.imagem ? (
                        <img src={item.imagem} alt={item.titulo} style={imageCoverStyle} />
                      ) : (
                        <span style={mutedTextStyle}>No image</span>
                      )}
                    </div>

                    <div style={tournamentTitleStyle}>{item.titulo}</div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section style={sectionStyle}>
          <div style={rankingGridStyle}>
            <div>
              <h2 style={smallTitleStyle}>Top Player</h2>

              <div style={rankingCardStyle}>
                {jogador ? (
                  <>
                    <div style={avatarBoxStyle}>
                      {jogador.imagem ? (
                        <img src={jogador.imagem} alt={jogador.nomeCompleto} style={imageCoverStyle} />
                      ) : (
                        <span style={mutedTextStyle}>Photo</span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={rankingNameStyle}>{jogador.idOnline}</div>
                      <div style={rankingMetaStyle}>
                        {jogador.posicao || "Player"}
                        {jogador.numero ? ` • #${jogador.numero}` : ""}
                      </div>
                    </div>

                    <div style={overallStyle}>
                      <strong>{jogador.overall}</strong>
                      <span>Overall</span>
                    </div>
                  </>
                ) : (
                  <span style={mutedTextStyle}>No player created yet.</span>
                )}
              </div>
            </div>

            <div>
              <h2 style={smallTitleStyle}>Top Team</h2>

              <div style={rankingCardStyle}>
                {topEquipe ? (
                  <>
                    <div style={avatarBoxStyle}>
                      {topEquipe.imagem ? (
                        <img src={topEquipe.imagem} alt={topEquipe.nome} style={imageContainStyle} />
                      ) : (
                        <span style={mutedTextStyle}>Badge</span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={rankingNameStyle}>{topEquipe.nome}</div>
                      <div style={rankingMetaStyle}>
                        {topEquipe.pais} • {topEquipe.plataforma}
                      </div>
                    </div>

                    <div style={teamStatsStyle}>
                      <div><strong>{topEquipe.vitorias}</strong><span>W</span></div>
                      <div><strong>{topEquipe.empates}</strong><span>D</span></div>
                      <div><strong>{topEquipe.derrotas}</strong><span>L</span></div>
                      <div><strong>{topEquipe.titulos}</strong><span>T</span></div>
                    </div>
                  </>
                ) : (
                  <span style={mutedTextStyle}>No club created yet.</span>
                )}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

const ORANGE = "#ff6900";
const PANEL = "#0b0b0f";
const LINE = "#242024";
const MUTED = "#bdb6b1";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(255,105,0,0.24), transparent 34%), radial-gradient(circle at top right, rgba(255,105,0,0.12), transparent 28%), #000",
  color: "#fff",
  fontFamily: "Arial, sans-serif",
  overflowX: "hidden",
};

const loadingStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: MUTED,
};

const headerStyle: CSSProperties = {
  borderBottom: "1px solid rgba(255,105,0,0.25)",
  background: "rgba(5,5,5,0.82)",
  backdropFilter: "blur(14px)",
  padding: "18px 14px",
};

const headerInnerStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1280,
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap",
};

const brandAreaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 28,
  flexWrap: "wrap",
};

const brandTitleStyle: CSSProperties = {
  margin: 0,
  color: ORANGE,
  fontSize: 22,
  fontWeight: 900,
};

const brandSubtitleStyle: CSSProperties = {
  margin: "4px 0 0",
  color: MUTED,
  fontSize: 13,
};

const navStyle: CSSProperties = {
  display: "flex",
  gap: 18,
  flexWrap: "wrap",
};

const navLinkStyle: CSSProperties = {
  color: MUTED,
  textDecoration: "none",
  fontWeight: 800,
  fontSize: 14,
};

const navHighlightStyle: CSSProperties = {
  color: ORANGE,
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 14,
};

const accountAreaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const accountButtonStyle: CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontWeight: 800,
};

const userIconStyle: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 10,
  border: "1px solid rgba(255,105,0,0.4)",
  background: "#111",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const dropdownStyle: CSSProperties = {
  position: "absolute",
  top: 44,
  right: 0,
  width: 250,
  maxWidth: "90vw",
  background: PANEL,
  border: "1px solid rgba(255,105,0,0.28)",
  borderRadius: 14,
  overflow: "hidden",
  zIndex: 30,
  boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
};

const dropdownValueStyle: CSSProperties = {
  padding: "14px 14px 4px",
  fontWeight: 900,
  fontSize: 18,
};

const dropdownMetaStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "0 14px 14px",
  color: MUTED,
  fontSize: 12,
  borderBottom: `1px solid ${LINE}`,
};

const dropdownButtonStyle: CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  background: "transparent",
  border: "none",
  color: "#fff",
  textAlign: "left",
  cursor: "pointer",
  fontWeight: 900,
};

const logoutButtonStyle: CSSProperties = {
  background: ORANGE,
  color: "#080808",
  border: "none",
  borderRadius: 12,
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 900,
};

const contentStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1280,
  margin: "0 auto",
  padding: "22px 12px 40px",
  display: "grid",
  gap: 20,
  boxSizing: "border-box",
};

const sectionStyle: CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(255,105,0,0.18), rgba(5,5,5,0.98) 36%, rgba(15,15,18,1))",
  border: "1px solid rgba(255,105,0,0.35)",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 24px 80px rgba(255,105,0,0.12)",
};

const sectionHeaderStyle: CSSProperties = {
  marginBottom: 18,
};

const eyebrowStyle: CSSProperties = {
  color: ORANGE,
  fontWeight: 900,
  letterSpacing: "0.14em",
  fontSize: 12,
  marginBottom: 8,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 30,
};

const tournamentGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 16,
};

const tournamentCardStyle: CSSProperties = {
  background: PANEL,
  border: `1px solid ${LINE}`,
  borderRadius: 20,
  overflow: "hidden",
};

const tournamentImageStyle: CSSProperties = {
  width: "100%",
  height: 145,
  background: "#111",
  borderBottom: "1px solid rgba(255,105,0,0.18)",
};

const tournamentTitleStyle: CSSProperties = {
  padding: 14,
  fontWeight: 900,
};

const rankingGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 22,
};

const smallTitleStyle: CSSProperties = {
  margin: "0 0 12px",
  fontSize: 24,
};

const rankingCardStyle: CSSProperties = {
  background: PANEL,
  border: `1px solid ${LINE}`,
  borderRadius: 20,
  padding: 16,
  minHeight: 98,
  display: "flex",
  alignItems: "center",
  gap: 14,
  flexWrap: "wrap",
};

const avatarBoxStyle: CSSProperties = {
  width: 54,
  height: 54,
  borderRadius: 14,
  background: "#111",
  border: "1px solid rgba(255,105,0,0.22)",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const rankingNameStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
};

const rankingMetaStyle: CSSProperties = {
  color: MUTED,
  fontSize: 14,
  marginTop: 4,
};

const overallStyle: CSSProperties = {
  marginLeft: "auto",
  textAlign: "right",
  display: "grid",
  gap: 2,
  color: MUTED,
  fontSize: 12,
};

const teamStatsStyle: CSSProperties = {
  marginLeft: "auto",
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 12,
  textAlign: "center",
  color: MUTED,
  fontSize: 12,
};

const emptyStateStyle: CSSProperties = {
  color: MUTED,
  background: "rgba(255,255,255,0.03)",
  border: "1px dashed rgba(255,105,0,0.25)",
  borderRadius: 16,
  padding: 18,
};

const mutedTextStyle: CSSProperties = {
  color: MUTED,
  fontSize: 13,
};

const imageCoverStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const imageContainStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  padding: 5,
};