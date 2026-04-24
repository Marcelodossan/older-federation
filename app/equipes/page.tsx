"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createClient } from "@/lib/supabase/client";

type Team = {
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

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 8;

  useEffect(() => {
    async function loadTeams() {
      try {
        setLoading(true);

        const supabase = createClient();

        const { data, error } = await supabase
          .from("equipes")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error(error);
          setTeams([]);
          return;
        }

        const normalizedList: Team[] = Array.isArray(data)
          ? data.map((item: any) => ({
              id: String(item.id),
              nome: item.nome || "Club",
              pais: item.pais || "Brazil",
              plataforma: item.plataforma || "PC",
              imagem: item.imagem || "",
              instagram: item.instagram || "",
              vitorias: Number(item.vitorias || 0),
              empates: Number(item.empates || 0),
              derrotas: Number(item.derrotas || 0),
              titulos: Number(item.titulos || 0),
            }))
          : [];

        setTeams(normalizedList);
      } catch (error) {
        console.error(error);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, []);

  const filteredTeams = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return teams;

    return teams.filter((team) => {
      return (
        String(team.nome || "").toLowerCase().includes(term) ||
        String(team.pais || "").toLowerCase().includes(term) ||
        String(team.plataforma || "").toLowerCase().includes(term) ||
        String(team.instagram || "").toLowerCase().includes(term)
      );
    });
  }, [teams, search]);

  const totalPages = Math.max(1, Math.ceil(filteredTeams.length / itemsPerPage));

  const paginatedTeams = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTeams.slice(start, start + itemsPerPage);
  }, [filteredTeams, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <Link href="/dashboard" style={backLinkStyle}>
          ← Back to Dashboard
        </Link>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={eyebrowStyle}>EUROPA LEAGUE CLUB DIRECTORY</div>
              <h1 style={titleStyle}>Teams List</h1>
            </div>

            <span style={countBadgeStyle}>
              {filteredTeams.length} club{filteredTeams.length === 1 ? "" : "s"}
            </span>
          </div>

          <div style={searchRowStyle}>
            <input
              type="text"
              placeholder="Search by name, country, platform or Instagram"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={inputStyle}
            />
          </div>

          {loading ? (
            <div style={emptyStateStyle}>Loading teams...</div>
          ) : teams.length === 0 ? (
            <div style={emptyStateStyle}>No teams registered yet.</div>
          ) : filteredTeams.length === 0 ? (
            <div style={emptyStateStyle}>No teams found.</div>
          ) : (
            <>
              <div style={gridStyle}>
                {paginatedTeams.map((team) => (
                  <article key={team.id} style={cardStyle}>
                    <div style={imageWrapStyle}>
                      <img
                        src={team.imagem || "/team.png"}
                        alt={team.nome}
                        onError={(e) => {
                          e.currentTarget.src = "/team.png";
                        }}
                        style={imageStyle}
                      />
                    </div>

                    <div style={cardBodyStyle}>
                      <h2 style={teamNameStyle}>{team.nome}</h2>

                      <p style={mutedStyle}>
                        {team.pais} • {team.plataforma}
                      </p>

                      <div style={statsGridStyle}>
                        <div style={statBoxStyle}>
                          <strong>{team.vitorias || 0}</strong>
                          <span>Wins</span>
                        </div>

                        <div style={statBoxStyle}>
                          <strong>{team.empates || 0}</strong>
                          <span>Draws</span>
                        </div>

                        <div style={statBoxStyle}>
                          <strong>{team.derrotas || 0}</strong>
                          <span>Losses</span>
                        </div>

                        <div style={statBoxStyle}>
                          <strong>{team.titulos || 0}</strong>
                          <span>Titles</span>
                        </div>
                      </div>

                      <Link href={`/equipes/${team.id}`} style={viewButtonStyle}>
                        View Club
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              <div style={paginationStyle}>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={paginationButtonStyle(currentPage === 1)}
                >
                  Previous
                </button>

                <span style={pageTextStyle}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  style={paginationButtonStyle(currentPage === totalPages)}
                >
                  Next
                </button>
              </div>
            </>
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
  maxWidth: 1180,
  margin: "0 auto",
};

const backLinkStyle: CSSProperties = {
  color: ORANGE,
  textDecoration: "none",
  fontWeight: 900,
  display: "inline-block",
  marginBottom: 18,
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
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 20,
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

const countBadgeStyle: CSSProperties = {
  border: "1px solid rgba(255,105,0,0.55)",
  color: ORANGE,
  borderRadius: 999,
  padding: "8px 13px",
  fontWeight: 900,
  fontSize: 12,
  textTransform: "uppercase",
};

const searchRowStyle: CSSProperties = {
  marginBottom: 20,
};

const inputStyle: CSSProperties = {
  width: "100%",
  background: "#09090b",
  border: "1px solid #2d2826",
  color: "#fff",
  borderRadius: 14,
  padding: "13px 15px",
  outline: "none",
  boxSizing: "border-box",
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
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
};

const cardStyle: CSSProperties = {
  background: PANEL,
  border: `1px solid ${LINE}`,
  borderRadius: 22,
  overflow: "hidden",
  boxShadow: "0 12px 34px rgba(0,0,0,0.28)",
};

const imageWrapStyle: CSSProperties = {
  width: "100%",
  height: 155,
  background: "#111",
  borderBottom: "1px solid rgba(255,105,0,0.18)",
};

const imageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const cardBodyStyle: CSSProperties = {
  padding: 16,
};

const teamNameStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 20,
  color: "#fff",
};

const mutedStyle: CSSProperties = {
  color: MUTED,
  margin: "0 0 14px",
  fontSize: 14,
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 8,
  marginBottom: 15,
};

const statBoxStyle: CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,105,0,0.18)",
  borderRadius: 13,
  padding: "9px 6px",
  textAlign: "center",
  display: "grid",
  gap: 3,
  color: MUTED,
  fontSize: 11,
};

const viewButtonStyle: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "center",
  background: ORANGE,
  color: "#080808",
  borderRadius: 13,
  padding: "12px 14px",
  fontWeight: 900,
  textDecoration: "none",
  boxSizing: "border-box",
};

const paginationStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 10,
  marginTop: 24,
  flexWrap: "wrap",
};

function paginationButtonStyle(disabled: boolean): CSSProperties {
  return {
    background: disabled ? "#151515" : ORANGE,
    color: disabled ? "#666" : "#080808",
    border: disabled ? "1px solid #252525" : "none",
    borderRadius: 12,
    padding: "10px 14px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 900,
  };
}

const pageTextStyle: CSSProperties = {
  color: "#fff",
  fontWeight: 900,
};