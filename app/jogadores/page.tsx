"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateOverall, formatMoney, parseMoney } from "@/lib/ranking";

type Jogador = {
  id?: string;
  nome: string;
  nomeCompleto?: string;
  idOnline?: string;
  pais?: string;
  valor?: number | string;
  imagem?: string;
};

const JOGADORES_POR_PAGINA = 12;

export default function JogadoresPage() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarJogadores() {
      try {
        setCarregando(true);

        const supabase = createClient();

        const { data, error } = await supabase
          .from("jogadores")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error(error);
          setJogadores([]);
          return;
        }

        const listaNormalizada: Jogador[] = Array.isArray(data)
          ? data.map((item: any) => ({
              id: item.id,
              nome: item.nome || "Jogador",
              nomeCompleto: item.nomeCompleto || item.nome || "Jogador",
              idOnline: item.idOnline || "",
              pais: item.pais || "",
              valor: item.valor || 0,
              imagem: item.imagem || "",
            }))
          : [];

        setJogadores(listaNormalizada);
      } catch (error) {
        console.error(error);
        setJogadores([]);
      } finally {
        setCarregando(false);
      }
    }

    carregarJogadores();
  }, []);

  const jogadoresOrdenados = useMemo(() => {
    return [...jogadores].sort(
      (a, b) => parseMoney(b.valor ?? 0) - parseMoney(a.valor ?? 0)
    );
  }, [jogadores]);

  const jogadoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return jogadoresOrdenados;

    return jogadoresOrdenados.filter((player) => {
      const nome = String(player.nome || "").toLowerCase();
      const nomeCompleto = String(player.nomeCompleto || "").toLowerCase();
      const idOnline = String(player.idOnline || "").toLowerCase();
      const pais = String(player.pais || "").toLowerCase();

      return (
        nome.includes(termo) ||
        nomeCompleto.includes(termo) ||
        idOnline.includes(termo) ||
        pais.includes(termo)
      );
    });
  }, [jogadoresOrdenados, busca]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(jogadoresFiltrados.length / JOGADORES_POR_PAGINA)
  );

  const jogadoresPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * JOGADORES_POR_PAGINA;
    const fim = inicio + JOGADORES_POR_PAGINA;
    return jogadoresFiltrados.slice(inicio, fim);
  }, [jogadoresFiltrados, paginaAtual]);

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
        padding: "18px 0 40px",
      }}
    >
      <div style={{ padding: "0 12px" }}>
        <Link
          href="/dashboard"
          style={{
            color: "#ff4fd8",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 18,
          }}
        >
          ← Voltar para dashboard
        </Link>
      </div>

      <section
        style={{
          margin: "18px 0 0",
          border: "1px solid #181818",
          borderRadius: 22,
          background: "#050505",
          padding: "22px",
          boxShadow: "0 0 0 2px rgba(255,255,255,0.03) inset",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: 26, marginBottom: 18 }}>
          Lista de Jogadores
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 12,
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por nome, nome completo, ID online ou país"
            style={{
              width: "100%",
              background: "#0b0b0b",
              color: "#fff",
              border: "1px solid #252525",
              borderRadius: 12,
              padding: "14px 16px",
              outline: "none",
              fontSize: 15,
            }}
          />

          <div
            style={{
              color: "#cfcfcf",
              fontSize: 14,
              whiteSpace: "nowrap",
            }}
          >
            {jogadoresFiltrados.length} jogador(es)
          </div>
        </div>

        {carregando ? (
          <div style={{ color: "#9a9a9a" }}>Carregando jogadores...</div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 18,
              }}
            >
              {jogadoresFiltrados.length === 0 ? (
                <div style={{ color: "#9a9a9a" }}>Nenhum jogador encontrado.</div>
              ) : (
                jogadoresPaginados.map((player, index) => {
                  const overall = calculateOverall(player.valor ?? 0);

                  return (
                    <div
                      key={player.id ?? `${player.nome}-${index}`}
                      style={{
                        width: 230,
                        background: "#080808",
                        border: "1px solid #161616",
                        borderRadius: 18,
                        padding: 14,
                      }}
                    >
                      <img
                        src={player.imagem || "/user.png"}
                        alt={player.nome}
                        style={{
                          width: "100%",
                          height: 180,
                          objectFit: "cover",
                          borderRadius: 14,
                          marginBottom: 10,
                        }}
                      />

                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          marginBottom: 4,
                        }}
                      >
                        {player.nomeCompleto || player.nome}
                      </div>

                      <div style={{ textAlign: "center", margin: "8px 0 12px" }}>
                        <div style={{ fontSize: 28, lineHeight: 1 }}>{overall}</div>
                        <div style={{ color: "#d0d0d0", fontSize: 16 }}>
                          overall
                        </div>
                      </div>

                      <div style={{ color: "#cfcfcf", marginBottom: 6 }}>
                        ID online:{" "}
                        <span style={{ color: "#89a7ff" }}>
                          {player.idOnline || "-"}
                        </span>
                      </div>

                      <div style={{ color: "#cfcfcf", marginBottom: 6 }}>
                        País: {player.pais || "-"}
                      </div>

                      <div style={{ color: "#cfcfcf" }}>
                        Valor: R$ {formatMoney(parseMoney(player.valor ?? 0))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {jogadoresFiltrados.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 24,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  style={{
                    background: paginaAtual === 1 ? "#1a1a1a" : "#ff4fd8",
                    color: paginaAtual === 1 ? "#666" : "#000",
                    border: "none",
                    borderRadius: 12,
                    padding: "10px 16px",
                    fontWeight: 700,
                    cursor: paginaAtual === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Anterior
                </button>

                <div
                  style={{
                    color: "#fff",
                    fontWeight: 700,
                    minWidth: 120,
                    textAlign: "center",
                  }}
                >
                  Página {paginaAtual} de {totalPaginas}
                </div>

                <button
                  onClick={() =>
                    setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                  }
                  disabled={paginaAtual === totalPaginas}
                  style={{
                    background:
                      paginaAtual === totalPaginas ? "#1a1a1a" : "#ff4fd8",
                    color: paginaAtual === totalPaginas ? "#666" : "#000",
                    border: "none",
                    borderRadius: 12,
                    padding: "10px 16px",
                    fontWeight: 700,
                    cursor:
                      paginaAtual === totalPaginas ? "not-allowed" : "pointer",
                  }}
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}