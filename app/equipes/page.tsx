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

export default function EquipesPage() {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const itensPorPagina = 8;

  useEffect(() => {
    const equipesSalvas = localStorage.getItem("equipes");
    if (equipesSalvas) {
      try {
        const lista = JSON.parse(equipesSalvas);
        setEquipes(Array.isArray(lista) ? lista : []);
      } catch {
        setEquipes([]);
      }
    }
  }, []);

  const equipesFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    if (!termo) return equipes;

    return equipes.filter((equipe) => {
      return (
        equipe.nome?.toLowerCase().includes(termo) ||
        equipe.pais?.toLowerCase().includes(termo) ||
        equipe.plataforma?.toLowerCase().includes(termo) ||
        equipe.instagram?.toLowerCase().includes(termo)
      );
    });
  }, [equipes, busca]);

  const totalPaginas = Math.max(1, Math.ceil(equipesFiltradas.length / itensPorPagina));

  const equipesPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return equipesFiltradas.slice(inicio, inicio + itensPorPagina);
  }, [equipesFiltradas, paginaAtual]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca]);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
        padding: "24px",
      }}
    >
      <Link
        href="/"
        style={{
          color: "#ff4fd8",
          textDecoration: "none",
          fontWeight: 700,
          display: "inline-block",
          marginBottom: 20,
        }}
      >
        ← Voltar para dashboard
      </Link>

      <div
        style={{
          background: "#050505",
          border: "1px solid #111",
          borderRadius: 20,
          padding: 20,
        }}
      >
        <h1
          style={{
            color: "#fff",
            marginTop: 0,
            marginBottom: 16,
            fontSize: 28,
          }}
        >
          Lista de Equipes
        </h1>

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <input
            type="text"
            placeholder="Pesquisar por nome, país, plataforma ou instagram"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              flex: 1,
              minWidth: 260,
              background: "#0b0b0b",
              border: "1px solid #1c1c1c",
              color: "#fff",
              borderRadius: 12,
              padding: "12px 14px",
              outline: "none",
            }}
          />

          <span style={{ color: "#aaa", fontSize: 14 }}>
            {equipesFiltradas.length} clube(s)
          </span>
        </div>

        {equipes.length === 0 ? (
          <p style={{ color: "#aaa" }}>Nenhuma equipe cadastrada.</p>
        ) : equipesPaginadas.length === 0 ? (
          <p style={{ color: "#aaa" }}>Nenhuma equipe encontrada.</p>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {equipesPaginadas.map((equipe) => (
                <div
                  key={equipe.id}
                  style={{
                    background: "#050505",
                    border: "1px solid #141414",
                    borderRadius: 18,
                    overflow: "hidden",
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.02) inset",
                  }}
                >
                  <img
                    src={equipe.imagem || "/team.png"}
                    alt={equipe.nome}
                    style={{
                      width: "100%",
                      height: 150,
                      objectFit: "cover",
                      display: "block",
                      background: "#111",
                    }}
                  />

                  <div style={{ padding: 14 }}>
                    <h2
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: 18,
                        color: "#fff",
                      }}
                    >
                      {equipe.nome}
                    </h2>

                    <p style={{ color: "#bbb", margin: "4px 0", fontSize: 14 }}>
                      {equipe.pais} • {equipe.plataforma}
                    </p>

                    <p style={{ color: "#bbb", margin: "4px 0", fontSize: 14 }}>
                      V: {equipe.vitorias || 0} | E: {equipe.empates || 0} | D: {equipe.derrotas || 0}
                    </p>

                    <p style={{ color: "#bbb", margin: "4px 0 14px", fontSize: 14 }}>
                      Títulos: {equipe.titulos || 0}
                    </p>

                    <Link
                      href={`/equipes/${equipe.id}`}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "center",
                        background: "#ff4fd8",
                        color: "#fff",
                        borderRadius: 12,
                        padding: "12px 14px",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      Visualizar clube
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
                marginTop: 22,
              }}
            >
              <button
                onClick={() => setPaginaAtual((prev) => Math.max(1, prev - 1))}
                disabled={paginaAtual === 1}
                style={{
                  background: paginaAtual === 1 ? "#1b1b1b" : "#111",
                  color: paginaAtual === 1 ? "#666" : "#fff",
                  border: "1px solid #222",
                  borderRadius: 10,
                  padding: "10px 14px",
                  cursor: paginaAtual === 1 ? "not-allowed" : "pointer",
                }}
              >
                Anterior
              </button>

              <span style={{ color: "#fff", fontWeight: 700 }}>
                Página {paginaAtual} de {totalPaginas}
              </span>

              <button
                onClick={() =>
                  setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1))
                }
                disabled={paginaAtual === totalPaginas}
                style={{
                  background: paginaAtual === totalPaginas ? "#1b1b1b" : "#ff4fd8",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 14px",
                  cursor: paginaAtual === totalPaginas ? "not-allowed" : "pointer",
                  fontWeight: 700,
                }}
              >
                Próxima
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}