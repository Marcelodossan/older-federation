"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type EstatisticasJogador = {
  gols: number;
  assistencias: number;
  desarmes: number;
  defesas: number;
  cartoes: number;
};

type Jogador = {
  id: string;
  nome: string;
  idOnline: string;
  posicao: string;
  numero: string;
  imagem: string;
  overall: number;
  valor: number;
  pais?: string;
  clubeAtualId: string;
  clubeAtualNome: string;
  criadoPor: string;
  isAdmin?: boolean;
  email?: string;
  estatisticas?: EstatisticasJogador;
};

type JogadorNoElenco = {
  jogadorId: string;
  nome: string;
  numero: string;
  posicao: string;
  imagem: string;
  overall: number;
};

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
  criadoPor?: string;
  formacao?: string;
  elenco?: JogadorNoElenco[];
};

type Campeonato = {
  id: string;
  titulo: string;
  imagem: string;
  numeroParticipantes: number;
  formato: "eliminatorias" | "pontos-corridos" | "pontos-corridos-eliminatorias";
  criadoPor: string;
  dataCriacao: string;
  times?: Equipe[];
};

const ADMIN_EMAIL = "marcelo.dos.santos.filho03@gmail.com";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function parseMoney(value: unknown): number {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const cleaned = value
      .replace(/[R$\s]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");

    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getFormatoLabel(formato: Campeonato["formato"]) {
  switch (formato) {
    case "eliminatorias":
      return "Eliminatórias";
    case "pontos-corridos":
      return "Pontos corridos";
    case "pontos-corridos-eliminatorias":
      return "Pontos corridos + eliminatórias";
    default:
      return formato;
  }
}

function getCriadorKey(jogador: Jogador | null) {
  if (!jogador) return "";
  return jogador.email || jogador.idOnline || jogador.nome || "";
}

function calcularPontuacaoTime(time: Equipe) {
  const vitorias = Number(time.vitorias || 0);
  const empates = Number(time.empates || 0);
  const derrotas = Number(time.derrotas || 0);

  return vitorias * 5 + empates * 2 - derrotas;
}

function garantirAdminNoJogadorLogado(): Jogador | null {
  const jogador = readJson<Jogador | null>("jogadorLogado", null);
  if (!jogador) return null;

  const jogadorAtualizado: Jogador = {
    ...jogador,
    nome: jogador.nome || jogador.idOnline || "Usuário",
    idOnline: jogador.idOnline || "Usuário",
    posicao: jogador.posicao || "GOL",
    numero: jogador.numero || "1",
    imagem: jogador.imagem || "",
    overall: Number(jogador.overall ?? 55),
    valor: Number(jogador.valor ?? 550000),
    clubeAtualId: jogador.clubeAtualId || "",
    clubeAtualNome: jogador.clubeAtualNome || "",
    criadoPor:
      jogador.criadoPor || jogador.email || jogador.idOnline || jogador.nome || "",
    isAdmin:
      String(jogador.email || "").trim().toLowerCase() ===
      ADMIN_EMAIL.toLowerCase(),
  };

  localStorage.setItem("jogadorLogado", JSON.stringify(jogadorAtualizado));

  const jogadores = readJson<Jogador[]>("jogadores", []);
  const existe = jogadores.some(
    (item) => String(item.id) === String(jogadorAtualizado.id)
  );

  const jogadoresAtualizados = existe
    ? jogadores.map((item) =>
        String(item.id) === String(jogadorAtualizado.id)
          ? { ...item, ...jogadorAtualizado }
          : item
      )
    : [...jogadores, jogadorAtualizado];

  localStorage.setItem("jogadores", JSON.stringify(jogadoresAtualizados));

  return jogadorAtualizado;
}

export default function DashboardPage() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [jogadorLogado, setJogadorLogado] = useState<Jogador | null>(null);
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const jogadorCorrigido = garantirAdminNoJogadorLogado();

    setJogadorLogado(jogadorCorrigido);
    setJogadores(readJson<Jogador[]>("jogadores", []));
    setEquipes(readJson<Equipe[]>("equipes", []));
    setCampeonatos(readJson<Campeonato[]>("campeonatos", []));

    localStorage.removeItem("equipeEmEdicao");
    localStorage.removeItem("equipeEmEdicaoid");
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const topPlayers = useMemo(() => {
    const unicosPorNome = jogadores.filter(
      (player, index, arr) =>
        arr.findIndex(
          (item) =>
            String(item.nome).trim().toLowerCase() ===
            String(player.nome).trim().toLowerCase()
        ) === index
    );

    return [...unicosPorNome]
      .sort(
        (a, b) =>
          Number(b.overall ?? 55) - Number(a.overall ?? 55) ||
          parseMoney(b.valor) - parseMoney(a.valor) ||
          String(a.nome || "").localeCompare(String(b.nome || ""))
      )
      .slice(0, 10);
  }, [jogadores]);

  const topTeams = useMemo(() => {
    const unicosPorNome = equipes.filter(
      (team, index, arr) =>
        arr.findIndex(
          (item) =>
            String(item.nome).trim().toLowerCase() ===
            String(team.nome).trim().toLowerCase()
        ) === index
    );

    return [...unicosPorNome]
      .sort((a, b) => {
        const pontosA = calcularPontuacaoTime(a);
        const pontosB = calcularPontuacaoTime(b);

        if (pontosB !== pontosA) return pontosB - pontosA;
        if (Number(b.vitorias || 0) !== Number(a.vitorias || 0)) {
          return Number(b.vitorias || 0) - Number(a.vitorias || 0);
        }
        if (Number(b.titulos || 0) !== Number(a.titulos || 0)) {
          return Number(b.titulos || 0) - Number(a.titulos || 0);
        }

        return String(a.nome || "").localeCompare(String(b.nome || ""));
      })
      .slice(0, 10);
  }, [equipes]);

  const clubeDoUsuario = useMemo(() => {
    if (!jogadorLogado) return null;

    const chaveCriador = getCriadorKey(jogadorLogado);

    return (
      equipes.find((equipe) => equipe.criadoPor === chaveCriador) ||
      equipes.find((equipe) => equipe.criadoPor === jogadorLogado.email) ||
      equipes.find((equipe) => equipe.criadoPor === jogadorLogado.idOnline) ||
      equipes.find((equipe) => equipe.criadoPor === jogadorLogado.nome) ||
      null
    );
  }, [equipes, jogadorLogado]);

  function handleSair() {
    localStorage.setItem("sessaoAtiva", "false");
    window.location.href = "/login";
  }

  function handleCriarEquipe() {
    localStorage.removeItem("equipeEmEdicaoId");
    window.location.href = "/criar-equipe";
  }

  function handleEditarClube() {
    try {
      if (!clubeDoUsuario) {
        alert("Você ainda não criou nenhum clube.");
        return;
      }

      localStorage.removeItem("equipeEmEdicao");
      localStorage.removeItem("equipeEmEdicaoid");
      localStorage.setItem("equipeEmEdicaoId", String(clubeDoUsuario.id));

      window.location.href = "/criar-equipe";
    } catch (error) {
      console.error("Erro ao abrir edição do clube:", error);
      alert("Erro ao abrir a edição do clube.");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "18px 24px",
          borderBottom: "1px solid #1b1b1b",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ color: "#ff4fd8", margin: 0, fontSize: "32px" }}>
            Older Federation
          </h1>

          <p style={{ marginTop: 8, color: "#ddd" }}>
            Bem-vindo, {jogadorLogado?.idOnline || jogadorLogado?.nome || "Usuário"}
          </p>

          <nav
            style={{
              display: "flex",
              gap: "28px",
              marginTop: "18px",
              fontSize: "18px",
              flexWrap: "wrap",
            }}
          >
            <a
              href="#campeonatos"
              style={{ color: "#ccc", textDecoration: "none" }}
            >
              Campeonatos
            </a>

            <Link
              href="/equipes"
              style={{ color: "#ccc", textDecoration: "none" }}
            >
              Equipes
            </Link>

            <Link
              href="/jogadores"
              style={{ color: "#ccc", textDecoration: "none" }}
            >
              Jogadores
            </Link>

            {jogadorLogado?.isAdmin && (
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

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              style={{
                background: "transparent",
                border: "none",
                color: "#ddd",
                cursor: "pointer",
                fontSize: "22px",
              }}
            >
              Minha conta
            </button>

            {menuAberto && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 42,
                  width: 260,
                  background: "#111",
                  border: "1px solid #222",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                  zIndex: 50,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    borderBottom: "1px solid #1f1f1f",
                  }}
                >
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 14, color: "#d9d9d9" }}>
                      R$ {formatMoney(parseMoney(jogadorLogado?.valor ?? 0))}
                    </div>
                    <div style={{ fontSize: 13, color: "#9c9c9c", marginTop: 2 }}>
                      Valor do jogador
                    </div>
                  </div>

                  <div style={{ padding: 14, textAlign: "center" }}>
                    <div style={{ fontSize: 22, color: "#fff", fontWeight: "bold" }}>
                      {jogadorLogado?.overall ?? 55}
                    </div>
                    <div style={{ fontSize: 13, color: "#9c9c9c" }}>Overall</div>
                  </div>
                </div>

                {clubeDoUsuario ? (
                  <button
                    onClick={handleEditarClube}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "14px 16px",
                      color: "#fff",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Editar clube
                  </button>
                ) : (
                  <button
                    onClick={handleCriarEquipe}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "14px 16px",
                      color: "#fff",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Criar equipe
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSair}
            style={{
              background: "#2d2d2d",
              border: "none",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Sair
          </button>
        </div>
      </header>

      <section
        id="campeonatos"
        style={{
          margin: "18px 16px",
          border: "1px solid #181818",
          borderRadius: 22,
          background: "#050505",
          padding: "22px",
          boxShadow: "0 0 0 2px rgba(255,255,255,0.03) inset",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Campeonatos</h2>

          {jogadorLogado?.isAdmin && (
            <Link
              href="/criar-campeonato"
              style={{
                background: "#ff4fd8",
                color: "#fff",
                textDecoration: "none",
                padding: "10px 16px",
                borderRadius: 12,
                fontWeight: 700,
              }}
            >
              + Criar campeonato
            </Link>
          )}
        </div>

        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          {campeonatos.length === 0 ? (
            <div
              style={{
                width: "100%",
                background: "#090909",
                border: "1px solid #161616",
                borderRadius: 18,
                padding: 18,
                color: "#8e8e8e",
              }}
            >
              Nenhum campeonato cadastrado ainda.
            </div>
          ) : (
            campeonatos.map((campeonato, index) => (
              <Link
                key={campeonato.id || `campeonato-${index}`}
                href={`/campeonatos/${campeonato.id}`}
                style={{
                  width: 260,
                  background: "#080808",
                  border: "1px solid #161616",
                  borderRadius: 18,
                  overflow: "hidden",
                  textDecoration: "none",
                  color: "#fff",
                  display: "block",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 160,
                    background: "#111",
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
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#777",
                        fontSize: 14,
                      }}
                    >
                      Sem imagem
                    </div>
                  )}
                </div>

                <div style={{ padding: 16 }}>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    {campeonato.titulo}
                  </div>

                  <div style={{ color: "#b9b9b9", fontSize: 14, marginBottom: 6 }}>
                    Participantes: {campeonato.numeroParticipantes}
                  </div>

                  <div style={{ color: "#b9b9b9", fontSize: 14 }}>
                    Formato: {getFormatoLabel(campeonato.formato)}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section
        style={{
          margin: "18px 16px",
          border: "1px solid #181818",
          borderRadius: 22,
          background: "#050505",
          padding: "22px",
          boxShadow: "0 0 0 2px rgba(255,255,255,0.03) inset",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 28,
          }}
        >
          <div>
            <h2 style={{ marginTop: 0, fontSize: 22 }}>Top Players</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {topPlayers.length === 0 ? (
                <div
                  style={{
                    background: "#090909",
                    border: "1px solid #161616",
                    borderRadius: 18,
                    padding: 18,
                    color: "#8e8e8e",
                  }}
                >
                  Nenhum jogador cadastrado ainda.
                </div>
              ) : (
                topPlayers.map((player, index) => (
                  <div
                    key={player.id || `player-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#080808",
                      border: "1px solid #161616",
                      borderRadius: 18,
                      padding: 16,
                      maxWidth: 520,
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#fff",
                          width: 28,
                          textAlign: "center",
                        }}
                      >
                        {index + 1}
                      </div>

                      <img
                        src={player.imagem || "/user.png"}
                        alt={player.nome}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          objectFit: "cover",
                        }}
                      />

                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>
                          {player.idOnline}
                        </div>
                        <div style={{ color: "#b9b9b9", fontSize: 14 }}>
                          {player.posicao} • #{player.numero}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "center", minWidth: 70 }}>
                      <div style={{ fontSize: 22 }}>{player.overall ?? 55}</div>
                      <div style={{ color: "#d0d0d0", fontSize: 14 }}>Overall</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div id="equipes">
            <h2 style={{ marginTop: 0, fontSize: 22 }}>TOP TEAMS</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {topTeams.length === 0 ? (
                <div
                  style={{
                    background: "#090909",
                    border: "1px solid #161616",
                    borderRadius: 18,
                    padding: 18,
                    color: "#8e8e8e",
                  }}
                >
                  Nenhum clube cadastrado ainda.
                </div>
              ) : (
                topTeams.map((team, index) => (
                  <div
                    key={team.id || `team-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#080808",
                      border: "1px solid #161616",
                      borderRadius: 18,
                      padding: 16,
                      maxWidth: 560,
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#fff",
                          width: 28,
                          textAlign: "center",
                        }}
                      >
                        {index + 1}
                      </div>

                      <img
                        src={team.imagem || "/team.png"}
                        alt={team.nome}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          objectFit: "cover",
                        }}
                      />

                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{team.nome}</div>
                        <div style={{ color: "#b9b9b9", fontSize: 14 }}>
                          {team.pais || "Brasil"} • {team.plataforma || "PC"}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 18,
                        textAlign: "center",
                        minWidth: 180,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 22 }}>{team.vitorias ?? 0}</div>
                        <div style={{ color: "#d0d0d0", fontSize: 14 }}>V</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 22 }}>{team.empates ?? 0}</div>
                        <div style={{ color: "#d0d0d0", fontSize: 14 }}>E</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 22 }}>{team.derrotas ?? 0}</div>
                        <div style={{ color: "#d0d0d0", fontSize: 14 }}>D</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 22 }}>{team.titulos ?? 0}</div>
                        <div style={{ color: "#d0d0d0", fontSize: 14 }}>T</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}