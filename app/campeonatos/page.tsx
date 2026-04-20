"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  if (!formato) return "Formato não informado";
  if (formato === "eliminatorias") return "Eliminatórias";
  if (formato === "pontos-corridos") return "Pontos corridos";
  if (formato === "pontos-corridos-eliminatorias") {
    return "Pontos corridos + eliminatórias";
  }
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

        if (authError) {
          console.error(authError);
        }

        const usuarioAtual: UsuarioLogado | null = user
          ? {
              id: user.id,
              nome: user.user_metadata?.nome || user.email || "Usuário",
              email: user.email || "",
              isAdmin:
                String(user.email || "").toLowerCase().trim() ===
                ADMIN_EMAIL.toLowerCase(),
            }
          : null;

        setUsuario(usuarioAtual);

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
              titulo: item.titulo || "Campeonato",
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
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/dashboard"
          style={{
            color: "#ff4fd8",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          ← Voltar para dashboard
        </Link>

        {usuario?.isAdmin && (
          <Link
            href="/criar-campeonato"
            style={{
              background: "#ff4fd8",
              color: "#fff",
              textDecoration: "none",
              padding: "10px 14px",
              borderRadius: "12px",
              fontWeight: 700,
            }}
          >
            Criar campeonato
          </Link>
        )}
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
            padding: "18px 14px 22px 14px",
            minHeight: "500px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <h1
              style={{
                fontSize: "28px",
                margin: 0,
              }}
            >
              Lista de Campeonatos
            </h1>

            <input
              type="text"
              placeholder="Pesquisar campeonato"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                minWidth: 260,
                background: "#0b0b0b",
                border: "1px solid #1c1c1c",
                color: "#fff",
                borderRadius: 12,
                padding: "12px 14px",
                outline: "none",
              }}
            />
          </div>

          {carregando ? (
            <div style={{ color: "#888" }}>Carregando campeonatos...</div>
          ) : campeonatosFiltrados.length === 0 ? (
            <div
              style={{
                padding: 18,
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
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "20px",
              }}
            >
              {campeonatosFiltrados.map((campeonato) => (
                <Link
                  key={campeonato.id}
                  href={`/campeonatos/${campeonato.id}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      minHeight: "260px",
                      background: "#0b0b0b",
                      borderRadius: "14px",
                      border: "1px solid #1f1f1f",
                      overflow: "hidden",
                      transition: "0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: 150,
                        background: "#111",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {campeonato.imagem ? (
                        <img
                          src={campeonato.imagem}
                          alt={campeonato.titulo}
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

                    <div style={{ padding: 14 }}>
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 700,
                          color: "#fff",
                          marginBottom: 8,
                        }}
                      >
                        {campeonato.titulo}
                      </div>

                      <div
                        style={{
                          color: "#bdbdbd",
                          fontSize: 14,
                          marginBottom: 6,
                        }}
                      >
                        {formatarFormato(campeonato.formato)}
                      </div>

                      <div
                        style={{
                          color: "#bdbdbd",
                          fontSize: 14,
                          marginBottom: 10,
                        }}
                      >
                        Participantes: {campeonato.numeroParticipantes || 0}
                      </div>

                      <div
                        style={{
                          display: "inline-block",
                          background: "#ff4fd8",
                          color: "#fff",
                          borderRadius: 10,
                          padding: "8px 12px",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        Abrir campeonato
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}