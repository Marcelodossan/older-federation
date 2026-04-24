"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "marcelo.dos.santos.filho03@gmail.com";

type Campeonato = {
  id: string;
  titulo: string;
  imagem?: string;
  numeroParticipantes?: number;
  formato?:
    | "eliminatorias"
    | "pontos-corridos"
    | "pontos-corridos-eliminatorias";
  criadoPor?: string;
  dataCriacao?: string;
};

type UsuarioLogado = {
  id?: string;
  nome?: string;
  email?: string;
  isAdmin?: boolean;
};

function formatarFormato(formato?: string) {
  if (!formato) return "Format not informed";
  if (formato === "eliminatorias") return "Knockout";
  if (formato === "pontos-corridos") return "League Format";
  if (formato === "pontos-corridos-eliminatorias") return "League + Knockout";
  return formato;
}

export default function CampeonatosPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarPagina() {
      try {
        setCarregando(true);

        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) console.error(authError);

        setUsuario(
          user
            ? {
                id: user.id,
                nome: user.user_metadata?.nome || user.email || "User",
                email: user.email || "",
                isAdmin:
                  String(user.email || "").toLowerCase().trim() ===
                  ADMIN_EMAIL.toLowerCase(),
              }
            : null
        );

        const { data, error } = await supabase
          .from("campeonatos")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error(error);
          setCampeonatos([]);
          return;
        }

        const lista: Campeonato[] = Array.isArray(data)
          ? data.map((item: any) => ({
              id: String(item.id),
              titulo: item.titulo || "Tournament",
              imagem: item.imagem || "",
              numeroParticipantes: Number(item.numeroparticipantes || 0),
              formato: item.formato,
              criadoPor: item.criadopor || "",
              dataCriacao: item.datacriacao || item.created_at || "",
            }))
          : [];

        setCampeonatos(lista);
      } catch (error) {
        console.error(error);
        setCampeonatos([]);
      } finally {
        setCarregando(false);
      }
    }

    carregarPagina();
  }, []);

  const campeonatosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return campeonatos;

    return campeonatos.filter((camp) => {
      return (
        String(camp.titulo || "").toLowerCase().includes(termo) ||
        String(camp.formato || "").toLowerCase().includes(termo)
      );
    });
  }, [campeonatos, busca]);

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div style={topBarStyle}>
          <Link href="/dashboard" style={backLinkStyle}>
            ← Back to Dashboard
          </Link>

          {usuario?.isAdmin && (
            <Link href="/criar-campeonato" style={createButtonStyle}>
              Create Tournament
            </Link>
          )}
        </div>

        <section style={sectionStyle}>
          <div style={headerStyle}>
            <div>
              <div style={eyebrowStyle}>EUROPA LEAGUE TOURNAMENT CENTER</div>
              <h1 style={titleStyle}>Tournament List</h1>
            </div>

            <input
              type="text"
              placeholder="Search tournament"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={inputStyle}
            />
          </div>

          {carregando ? (
            <div style={emptyStateStyle}>Loading tournaments...</div>
          ) : campeonatosFiltrados.length === 0 ? (
            <div style={emptyStateStyle}>No tournaments registered yet.</div>
          ) : (
            <div style={gridStyle}>
              {campeonatosFiltrados.map((campeonato) => (
                <Link
                  key={campeonato.id}
                  href={`/campeonatos/${campeonato.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <article style={cardStyle}>
                    <div style={imageBoxStyle}>
                      {campeonato.imagem ? (
                        <img
                          src={campeonato.imagem}
                          alt={campeonato.titulo}
                          style={imageStyle}
                        />
                      ) : (
                        <span style={mutedStyle}>No image</span>
                      )}
                    </div>

                    <div style={cardBodyStyle}>
                      <h2 style={cardTitleStyle}>{campeonato.titulo}</h2>

                      <div style={cardMetaStyle}>
                        {formatarFormato(campeonato.formato)}
                      </div>

                      <div style={cardMetaStyle}>
                        Participants: {campeonato.numeroParticipantes || 0}
                      </div>

                      <div style={openButtonStyle}>Open Tournament</div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
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
  maxWidth: 1280,
  margin: "0 auto",
};

const topBarStyle: CSSProperties = {
  marginBottom: 20,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const backLinkStyle: CSSProperties = {
  color: ORANGE,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 900,
};

const createButtonStyle: CSSProperties = {
  background: ORANGE,
  color: "#080808",
  textDecoration: "none",
  padding: "11px 15px",
  borderRadius: 13,
  fontWeight: 900,
};

const sectionStyle: CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(255,105,0,0.18), rgba(5,5,5,0.98) 36%, rgba(15,15,18,1))",
  border: "1px solid rgba(255,105,0,0.35)",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 24px 80px rgba(255,105,0,0.12)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 22,
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
  fontSize: "clamp(32px, 5vw, 52px)",
  lineHeight: 1,
};

const inputStyle: CSSProperties = {
  minWidth: 260,
  background: "#09090b",
  border: "1px solid #2d2826",
  color: "#fff",
  borderRadius: 14,
  padding: "13px 15px",
  outline: "none",
};

const emptyStateStyle: CSSProperties = {
  color: MUTED,
  background: "rgba(255,255,255,0.03)",
  border: "1px dashed rgba(255,105,0,0.25)",
  borderRadius: 16,
  padding: 18,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 18,
};

const cardStyle: CSSProperties = {
  minHeight: 260,
  background: PANEL,
  borderRadius: 22,
  border: `1px solid ${LINE}`,
  overflow: "hidden",
  boxShadow: "0 12px 34px rgba(0,0,0,0.28)",
};

const imageBoxStyle: CSSProperties = {
  width: "100%",
  height: 155,
  background: "#111",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderBottom: "1px solid rgba(255,105,0,0.18)",
};

const imageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const cardBodyStyle: CSSProperties = {
  padding: 15,
};

const cardTitleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: "#fff",
  margin: "0 0 10px",
};

const cardMetaStyle: CSSProperties = {
  color: MUTED,
  fontSize: 14,
  marginBottom: 7,
};

const openButtonStyle: CSSProperties = {
  display: "inline-block",
  background: ORANGE,
  color: "#080808",
  borderRadius: 12,
  padding: "9px 12px",
  fontWeight: 900,
  fontSize: 13,
  marginTop: 6,
};

const mutedStyle: CSSProperties = {
  color: MUTED,
  fontSize: 12,
};