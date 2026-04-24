"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createClient } from "@/lib/supabase/client";

type Equipe = {
  id: string;
  nome: string;
  pais: string;
  plataforma: string;
  imagem: string;
  instagram: string;
  vitorias: number;
  empates: number;
  derrotas: number;
  titulos: number;
};

type Jogador = {
  id: string;
  nome: string;
  numero?: number | string;
  posicao?: string;
  overall?: number | string;
  imagem?: string;
  clubeAtualId?: string;
};

export default function VisualizarEquipePage({
  params,
}: {
  params: { id: string };
}) {
  const [equipe, setEquipe] = useState<Equipe | null>(null);
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregado(false);

        const supabase = createClient();
        const equipeId = String(params.id);

        const { data: equipeBanco, error: erroEquipe } = await supabase
          .from("equipes")
          .select("*")
          .eq("id", equipeId)
          .maybeSingle();

        if (erroEquipe || !equipeBanco) {
          console.error(erroEquipe);
          setEquipe(null);
          setJogadores([]);
          return;
        }

        const equipeNormalizada: Equipe = {
          id: String(equipeBanco.id),
          nome: equipeBanco.nome || "Club",
          pais: equipeBanco.pais || "Brazil",
          plataforma: equipeBanco.plataforma || "PC",
          imagem: equipeBanco.imagem || "",
          instagram: equipeBanco.instagram || "",
          vitorias: Number(equipeBanco.vitorias || 0),
          empates: Number(equipeBanco.empates || 0),
          derrotas: Number(equipeBanco.derrotas || 0),
          titulos: Number(equipeBanco.titulos || 0),
        };

        setEquipe(equipeNormalizada);

        const { data: jogadoresBanco, error: erroJogadores } = await supabase
          .from("jogadores")
          .select("*")
          .eq("clubeAtualId", equipeId)
          .order("created_at", { ascending: false });

        if (erroJogadores) {
          console.error(erroJogadores);
          setJogadores([]);
          return;
        }

        const listaNormalizada: Jogador[] = Array.isArray(jogadoresBanco)
          ? jogadoresBanco.map((item: any) => ({
              id: String(item.id),
              nome: item.nome || "Player",
              numero: item.numero || "",
              posicao: item.posicao || "",
              overall: Number(item.overall || 55),
              imagem: item.imagem || "",
              clubeAtualId: item.clubeAtualId ? String(item.clubeAtualId) : "",
            }))
          : [];

        setJogadores(listaNormalizada);
      } catch (error) {
        console.error(error);
        setEquipe(null);
        setJogadores([]);
      } finally {
        setCarregado(true);
      }
    }

    carregarDados();
  }, [params.id]);

  const jogadoresDoClube = useMemo(() => {
    if (!equipe) return [];

    return jogadores.filter(
      (jogador) => String(jogador.clubeAtualId || "") === String(equipe.id)
    );
  }, [equipe, jogadores]);

  if (!carregado) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={emptyStateStyle}>Loading club...</div>
        </div>
      </main>
    );
  }

  if (!equipe) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <Link href="/equipes" style={backLinkStyle}>
            ← Back to Teams
          </Link>

          <div style={emptyStateStyle}>Club not found.</div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <Link href="/equipes" style={backLinkStyle}>
          ← Back to Teams
        </Link>

        <section style={heroStyle}>
          <div style={clubHeaderStyle}>
            <div style={badgeBoxStyle}>
              <img
                src={equipe.imagem || "/team.png"}
                alt={equipe.nome}
                onError={(e) => {
                  e.currentTarget.src = "/team.png";
                }}
                style={badgeImgStyle}
              />
            </div>

            <div>
              <div style={eyebrowStyle}>EUROPA LEAGUE CLUB PROFILE</div>
              <h1 style={titleStyle}>{equipe.nome}</h1>
              <p style={mutedStyle}>
                {equipe.pais} • {equipe.plataforma}
              </p>
            </div>
          </div>

          <div style={statsGridStyle}>
            <div style={statBoxStyle}>
              <span>Wins</span>
              <strong>{equipe.vitorias || 0}</strong>
            </div>

            <div style={statBoxStyle}>
              <span>Draws</span>
              <strong>{equipe.empates || 0}</strong>
            </div>

            <div style={statBoxStyle}>
              <span>Losses</span>
              <strong>{equipe.derrotas || 0}</strong>
            </div>

            <div style={statBoxStyle}>
              <span>Titles</span>
              <strong>{equipe.titulos || 0}</strong>
            </div>
          </div>
        </section>

        <div style={contentGridStyle}>
          <aside style={panelStyle}>
            <h2 style={panelTitleStyle}>Club Information</h2>

            <div style={formGridStyle}>
              <div>
                <label style={labelStyle}>Club Name</label>
                <input value={equipe.nome || ""} readOnly style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Country</label>
                <input value={equipe.pais || ""} readOnly style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Platform</label>
                <input value={equipe.plataforma || ""} readOnly style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Instagram</label>
                <input value={equipe.instagram || ""} readOnly style={inputStyle} />
              </div>
            </div>
          </aside>

          <div style={{ display: "grid", gap: 18 }}>
            <section style={panelStyle}>
              <div style={sectionHeaderStyle}>
                <h2 style={panelTitleStyle}>
                  Squad {jogadoresDoClube.length}/60 Players
                </h2>
              </div>

              <div style={tableWrapStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeadRowStyle}>
                      <th style={thStyle}>Pos</th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>No.</th>
                      <th style={thStyle}>Overall</th>
                    </tr>
                  </thead>

                  <tbody>
                    {jogadoresDoClube.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={emptyTableStyle}>
                          No players linked to this club.
                        </td>
                      </tr>
                    ) : (
                      jogadoresDoClube.map((jogador, index) => (
                        <tr key={jogador.id || `${jogador.nome}-${index}`}>
                          <td style={tdStyle}>{jogador.posicao || "-"}</td>
                          <td style={tdStyle}>{jogador.nome || "-"}</td>
                          <td style={tdStyle}>{jogador.numero || "-"}</td>
                          <td style={tdStyle}>{jogador.overall || 55}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section style={panelStyle}>
              <h2 style={panelTitleStyle}>Club Players</h2>

              {jogadoresDoClube.length === 0 ? (
                <div style={emptyStateStyle}>No players registered in this club.</div>
              ) : (
                <div style={playersGridStyle}>
                  {jogadoresDoClube.map((jogador, index) => (
                    <article
                      key={jogador.id || `${jogador.nome}-${index}-card`}
                      style={playerCardStyle}
                    >
                      <div style={playerImageBoxStyle}>
                        <img
                          src={jogador.imagem || "/player.png"}
                          alt={jogador.nome}
                          onError={(e) => {
                            e.currentTarget.src = "/player.png";
                          }}
                          style={playerImageStyle}
                        />
                      </div>

                      <div style={playerBodyStyle}>
                        <strong style={playerNameStyle}>{jogador.nome}</strong>

                        <span style={playerMetaStyle}>
                          {jogador.posicao || "-"} • #{jogador.numero || "-"}
                        </span>

                        <span style={overallStyle}>
                          Overall {jogador.overall || 55}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
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
  padding: "24px 12px 40px",
};

const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1300,
  margin: "0 auto",
};

const backLinkStyle: CSSProperties = {
  color: ORANGE,
  textDecoration: "none",
  fontWeight: 900,
  display: "inline-block",
  marginBottom: 18,
};

const heroStyle: CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(255,105,0,0.18), rgba(5,5,5,0.98) 36%, rgba(15,15,18,1))",
  border: "1px solid rgba(255,105,0,0.35)",
  borderRadius: 28,
  padding: 22,
  marginBottom: 20,
  boxShadow: "0 24px 80px rgba(255,105,0,0.12)",
};

const clubHeaderStyle: CSSProperties = {
  display: "flex",
  gap: 18,
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 18,
};

const badgeBoxStyle: CSSProperties = {
  width: 92,
  height: 92,
  borderRadius: 22,
  background: "#111",
  overflow: "hidden",
  border: "1px solid rgba(255,105,0,0.35)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
};

const badgeImgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const eyebrowStyle: CSSProperties = {
  color: ORANGE,
  fontWeight: 900,
  letterSpacing: "0.14em",
  fontSize: 12,
  marginBottom: 8,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 5vw, 56px)",
  lineHeight: 1,
};

const mutedStyle: CSSProperties = {
  color: MUTED,
  margin: "8px 0 0",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: 10,
};

const statBoxStyle: CSSProperties = {
  background: "rgba(0,0,0,0.25)",
  border: "1px solid rgba(255,105,0,0.22)",
  borderRadius: 16,
  padding: 14,
  display: "grid",
  gap: 6,
  color: MUTED,
};

const contentGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 340px) 1fr",
  gap: 18,
  alignItems: "start",
};

const panelStyle: CSSProperties = {
  background: PANEL,
  border: `1px solid ${LINE}`,
  borderRadius: 24,
  padding: 18,
};

const panelTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 16,
  fontSize: 22,
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gap: 12,
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  color: MUTED,
  marginBottom: 7,
  fontWeight: 800,
};

const inputStyle: CSSProperties = {
  width: "100%",
  background: "#09090b",
  border: "1px solid #2d2826",
  color: "#fff",
  borderRadius: 13,
  padding: "12px 14px",
  outline: "none",
  boxSizing: "border-box",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const tableWrapStyle: CSSProperties = {
  width: "100%",
  overflowX: "auto",
  borderRadius: 16,
  border: `1px solid ${LINE}`,
  background: "#070707",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 600,
};

const tableHeadRowStyle: CSSProperties = {
  background: "linear-gradient(90deg, rgba(255,105,0,0.22), rgba(12,12,12,1))",
};

const thStyle: CSSProperties = {
  textAlign: "left",
  color: "#f2e8e0",
  fontSize: 13,
  fontWeight: 900,
  padding: "14px 12px",
  borderBottom: "1px solid #272020",
};

const tdStyle: CSSProperties = {
  padding: "14px 12px",
  color: "#fff",
  fontSize: 14,
  borderBottom: "1px solid #171316",
};

const emptyTableStyle: CSSProperties = {
  padding: "18px 12px",
  color: MUTED,
  textAlign: "center",
};

const emptyStateStyle: CSSProperties = {
  color: MUTED,
  background: "rgba(255,255,255,0.03)",
  border: "1px dashed rgba(255,105,0,0.25)",
  borderRadius: 16,
  padding: 18,
};

const playersGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
};

const playerCardStyle: CSSProperties = {
  background: "#08080b",
  border: `1px solid ${LINE}`,
  borderRadius: 18,
  overflow: "hidden",
};

const playerImageBoxStyle: CSSProperties = {
  width: "100%",
  height: 155,
  background: "#111",
  borderBottom: "1px solid rgba(255,105,0,0.18)",
};

const playerImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const playerBodyStyle: CSSProperties = {
  padding: 12,
  textAlign: "center",
};

const playerNameStyle: CSSProperties = {
  display: "block",
  fontSize: 14,
  marginBottom: 6,
};

const playerMetaStyle: CSSProperties = {
  display: "block",
  color: MUTED,
  fontSize: 12,
  marginBottom: 5,
};

const overallStyle: CSSProperties = {
  display: "block",
  color: ORANGE,
  fontSize: 12,
  fontWeight: 900,
};
