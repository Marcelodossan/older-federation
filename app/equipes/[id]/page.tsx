"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  id?: string;
  nome: string;
  numero?: number | string;
  posicao?: string;
  overall?: number | string;
  imagem?: string;
  clubeId?: string;
  equipeId?: string;
  timeId?: string;
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
    const equipesSalvas = localStorage.getItem("equipes");
    const jogadoresSalvos = localStorage.getItem("jogadores");

    let listaEquipes: Equipe[] = [];
    let listaJogadores: Jogador[] = [];

    try {
      listaEquipes = equipesSalvas ? JSON.parse(equipesSalvas) : [];
    } catch {
      listaEquipes = [];
    }

    try {
      listaJogadores = jogadoresSalvos ? JSON.parse(jogadoresSalvos) : [];
    } catch {
      listaJogadores = [];
    }

    const equipeEncontrada =
      listaEquipes.find((item) => String(item.id) === String(params.id)) || null;

    setEquipe(equipeEncontrada);
    setJogadores(Array.isArray(listaJogadores) ? listaJogadores : []);
    setCarregado(true);
  }, [params.id]);

  const jogadoresDoClube = useMemo(() => {
    if (!equipe) return [];

    return jogadores.filter((jogador) => {
      return (
        String(jogador.clubeId) === String(equipe.id) ||
        String(jogador.equipeId) === String(equipe.id) ||
        String(jogador.timeId) === String(equipe.id)
      );
    });
  }, [equipe, jogadores]);

  if (!carregado) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#000",
          color: "#fff",
          padding: 24,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <p>Carregando...</p>
      </main>
    );
  }

  if (!equipe) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#000",
          color: "#fff",
          padding: 24,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <Link
          href="/equipes"
          style={{
            color: "#ff4fd8",
            textDecoration: "none",
            fontWeight: 700,
            display: "inline-block",
            marginBottom: 20,
          }}
        >
          ← Voltar para equipes
        </Link>

        <p style={{ color: "#aaa" }}>Clube não encontrado.</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        <Link
          href="/equipes"
          style={{
            color: "#ff4fd8",
            textDecoration: "none",
            fontWeight: 700,
            display: "inline-block",
            marginBottom: 20,
          }}
        >
          ← Voltar para equipes
        </Link>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "340px 1fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "#050505",
              border: "1px solid #1a1a1a",
              borderRadius: 20,
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 14,
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <img
                src={equipe.imagem || "/team.png"}
                alt={equipe.nome}
                style={{
                  width: 72,
                  height: 72,
                  objectFit: "cover",
                  borderRadius: 14,
                  border: "1px solid #222",
                }}
              />

              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 28,
                    color: "#fff",
                  }}
                >
                  {equipe.nome}
                </h1>
                <p style={{ margin: "4px 0 0", color: "#bbb" }}>
                  {equipe.pais} • {equipe.plataforma}
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: "#aaa",
                    marginBottom: 6,
                  }}
                >
                  Nome do clube
                </label>
                <input
                  value={equipe.nome || ""}
                  readOnly
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: "#aaa",
                    marginBottom: 6,
                  }}
                >
                  País
                </label>
                <input
                  value={equipe.pais || ""}
                  readOnly
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: "#aaa",
                    marginBottom: 6,
                  }}
                >
                  Plataforma
                </label>
                <input
                  value={equipe.plataforma || ""}
                  readOnly
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: "#aaa",
                    marginBottom: 6,
                  }}
                >
                  Instagram
                </label>
                <input
                  value={equipe.instagram || ""}
                  readOnly
                  style={inputStyle}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginTop: 6,
                }}
              >
                <div style={statBoxStyle}>
                  <span style={statLabelStyle}>Vitórias</span>
                  <strong style={statValueStyle}>{equipe.vitorias || 0}</strong>
                </div>

                <div style={statBoxStyle}>
                  <span style={statLabelStyle}>Empates</span>
                  <strong style={statValueStyle}>{equipe.empates || 0}</strong>
                </div>

                <div style={statBoxStyle}>
                  <span style={statLabelStyle}>Derrotas</span>
                  <strong style={statValueStyle}>{equipe.derrotas || 0}</strong>
                </div>

                <div style={statBoxStyle}>
                  <span style={statLabelStyle}>Títulos</span>
                  <strong style={statValueStyle}>{equipe.titulos || 0}</strong>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <section
              style={{
                background: "#050505",
                border: "1px solid #1a1a1a",
                borderRadius: 20,
                padding: 18,
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: 16 }}>
                Elenco {jogadoresDoClube.length}/60 Jogadores
              </h2>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 600,
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1b1b1b" }}>
                      <th style={thStyle}>Pos</th>
                      <th style={thStyle}>Nome</th>
                      <th style={thStyle}>Nº</th>
                      <th style={thStyle}>Overall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jogadoresDoClube.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            padding: "18px 10px",
                            color: "#888",
                            textAlign: "center",
                          }}
                        >
                          Nenhum jogador vinculado a este clube.
                        </td>
                      </tr>
                    ) : (
                      jogadoresDoClube.map((jogador, index) => (
                        <tr
                          key={jogador.id || `${jogador.nome}-${index}`}
                          style={{ borderBottom: "1px solid #101010" }}
                        >
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

            <section
              style={{
                background: "#050505",
                border: "1px solid #1a1a1a",
                borderRadius: 20,
                padding: 18,
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Jogadores do clube</h3>

              {jogadoresDoClube.length === 0 ? (
                <p style={{ color: "#888", margin: 0 }}>
                  Nenhum jogador cadastrado neste clube.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 14,
                  }}
                >
                  {jogadoresDoClube.map((jogador, index) => (
                    <div
                      key={jogador.id || `${jogador.nome}-${index}-card`}
                      style={{
                        background: "#0a0a0a",
                        border: "1px solid #1a1a1a",
                        borderRadius: 14,
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={jogador.imagem || "/player.png"}
                        alt={jogador.nome}
                        style={{
                          width: "100%",
                          height: 150,
                          objectFit: "cover",
                          display: "block",
                          background: "#111",
                        }}
                      />

                      <div style={{ padding: 10, textAlign: "center" }}>
                        <strong
                          style={{
                            display: "block",
                            fontSize: 14,
                            marginBottom: 6,
                          }}
                        >
                          {jogador.nome}
                        </strong>

                        <span
                          style={{
                            display: "block",
                            color: "#bbb",
                            fontSize: 12,
                            marginBottom: 3,
                          }}
                        >
                          {jogador.posicao || "-"} • #{jogador.numero || "-"}
                        </span>

                        <span
                          style={{
                            display: "block",
                            color: "#bbb",
                            fontSize: 12,
                          }}
                        >
                          Overall {jogador.overall || 55}
                        </span>
                      </div>
                    </div>
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0a0a0a",
  border: "1px solid #222",
  color: "#fff",
  borderRadius: 10,
  padding: "12px 12px",
  outline: "none",
};

const statBoxStyle: React.CSSProperties = {
  background: "#0a0a0a",
  border: "1px solid #202020",
  borderRadius: 12,
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const statLabelStyle: React.CSSProperties = {
  color: "#999",
  fontSize: 12,
};

const statValueStyle: React.CSSProperties = {
  color: "#fff",
  fontSize: 18,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  color: "#999",
  fontSize: 12,
  fontWeight: 700,
  padding: "12px 10px",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 10px",
  color: "#fff",
  fontSize: 14,
};