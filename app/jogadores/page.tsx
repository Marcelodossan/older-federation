"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateOverall, formatMoney, parseMoney } from "@/lib/ranking";

type Player = {
  id?: string;
  nome: string;
  nomeCompleto?: string;
  idOnline?: string;
  pais?: string;
  valor?: number | string;
  imagem?: string;
  clubeAtualId?: string;
};

const PLAYERS_PER_PAGE = 12;

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlayers() {
      try {
        setLoading(true);

        const supabase = createClient();

        const { data, error } = await supabase
          .from("jogadores")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error(error);
          setPlayers([]);
          return;
        }

        const normalizedList: Player[] = Array.isArray(data)
          ? data
              .filter(
                (item: any) =>
                  item.clubeAtualId && String(item.clubeAtualId).trim() !== ""
              )
              .map((item: any) => ({
                id: item.id,
                nome: item.nome || "Player",
                nomeCompleto: item.nomeCompleto || item.nome || "Player",
                idOnline: item.idOnline || "",
                pais: item.pais || "",
                valor: item.valor || 0,
                imagem: item.imagem || "",
                clubeAtualId: item.clubeAtualId || "",
              }))
          : [];

        setPlayers(normalizedList);
      } catch (error) {
        console.error(error);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    }

    loadPlayers();
  }, []);

  const sortedPlayers = useMemo(() => {
    return [...players].sort(
      (a, b) => parseMoney(b.valor ?? 0) - parseMoney(a.valor ?? 0)
    );
  }, [players]);

  const filteredPlayers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return sortedPlayers;

    return sortedPlayers.filter((player) => {
      const name = String(player.nome || "").toLowerCase();
      const fullName = String(player.nomeCompleto || "").toLowerCase();
      const onlineId = String(player.idOnline || "").toLowerCase();
      const country = String(player.pais || "").toLowerCase();

      return (
        name.includes(term) ||
        fullName.includes(term) ||
        onlineId.includes(term) ||
        country.includes(term)
      );
    });
  }, [sortedPlayers, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPlayers.length / PLAYERS_PER_PAGE)
  );

  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * PLAYERS_PER_PAGE;
    const end = start + PLAYERS_PER_PAGE;
    return filteredPlayers.slice(start, end);
  }, [filteredPlayers, currentPage]);

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
              <div style={eyebrowStyle}>EUROPA LEAGUE PLAYER MARKET</div>
              <h1 style={titleStyle}>Players List</h1>
            </div>

            <span style={countBadgeStyle}>
              {filteredPlayers.length} player
              {filteredPlayers.length === 1 ? "" : "s"}
            </span>
          </div>

          <div style={searchGridStyle}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, full name, online ID or country"
              style={inputStyle}
            />
          </div>

          {loading ? (
            <div style={emptyStateStyle}>Loading players...</div>
          ) : (
            <>
              {filteredPlayers.length === 0 ? (
                <div style={emptyStateStyle}>No players found.</div>
              ) : (
                <div style={playersGridStyle}>
                  {paginatedPlayers.map((player, index) => {
                    const overall = calculateOverall(player.valor ?? 0);

                    return (
                      <article
                        key={player.id ?? `${player.nome}-${index}`}
                        style={playerCardStyle}
                      >
                        <div style={imageBoxStyle}>
                          <img
                            src={player.imagem || "/user.png"}
                            alt={player.nome}
                            onError={(e) => {
                              e.currentTarget.src = "/user.png";
                            }}
                            style={imageStyle}
                          />
                        </div>

                        <div style={cardBodyStyle}>
                          <div style={playerNameStyle}>
                            {player.nomeCompleto || player.nome}
                          </div>

                          <div style={overallBoxStyle}>
                            <div style={overallNumberStyle}>{overall}</div>
                            <div style={overallLabelStyle}>overall</div>
                          </div>

                          <div style={metaStyle}>
                            Online ID:{" "}
                            <span style={highlightStyle}>
                              {player.idOnline || "-"}
                            </span>
                          </div>

                          <div style={metaStyle}>
                            Country: {player.pais || "-"}
                          </div>

                          <div style={metaStyle}>
                            Value: R$ {formatMoney(parseMoney(player.valor ?? 0))}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {filteredPlayers.length > 0 && (
                <div style={paginationStyle}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={paginationButtonStyle(currentPage === 1)}
                  >
                    Previous
                  </button>

                  <div style={pageTextStyle}>
                    Page {currentPage} of {totalPages}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    style={paginationButtonStyle(currentPage === totalPages)}
                  >
                    Next
                  </button>
                </div>
              )}
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
  maxWidth: 1280,
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

const searchGridStyle: CSSProperties = {
  marginBottom: 22,
};

const inputStyle: CSSProperties = {
  width: "100%",
  background: "#09090b",
  color: "#fff",
  border: "1px solid #2d2826",
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

const playersGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 18,
};

const playerCardStyle: CSSProperties = {
  background: PANEL,
  border: `1px solid ${LINE}`,
  borderRadius: 22,
  padding: 14,
  boxShadow: "0 12px 34px rgba(0,0,0,0.28)",
};

const imageBoxStyle: CSSProperties = {
  width: "100%",
  height: 185,
  borderRadius: 16,
  overflow: "hidden",
  background: "#111",
  border: "1px solid rgba(255,105,0,0.18)",
  marginBottom: 12,
};

const imageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const cardBodyStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

const playerNameStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 900,
  minHeight: 38,
};

const overallBoxStyle: CSSProperties = {
  textAlign: "center",
  background: "rgba(255,105,0,0.10)",
  border: "1px solid rgba(255,105,0,0.25)",
  borderRadius: 16,
  padding: "10px 8px",
  margin: "2px 0 4px",
};

const overallNumberStyle: CSSProperties = {
  fontSize: 34,
  lineHeight: 1,
  fontWeight: 900,
  color: ORANGE,
};

const overallLabelStyle: CSSProperties = {
  color: MUTED,
  fontSize: 13,
  textTransform: "uppercase",
  marginTop: 4,
};

const metaStyle: CSSProperties = {
  color: MUTED,
  fontSize: 14,
};

const highlightStyle: CSSProperties = {
  color: ORANGE,
  fontWeight: 800,
};

const paginationStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 12,
  marginTop: 26,
  flexWrap: "wrap",
};

function paginationButtonStyle(disabled: boolean): CSSProperties {
  return {
    background: disabled ? "#151515" : ORANGE,
    color: disabled ? "#666" : "#080808",
    border: disabled ? "1px solid #252525" : "none",
    borderRadius: 12,
    padding: "10px 16px",
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

const pageTextStyle: CSSProperties = {
  color: "#fff",
  fontWeight: 900,
  minWidth: 120,
  textAlign: "center",
};