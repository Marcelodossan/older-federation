"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  campeaoId?: string;
  jogos?: {
    id: string;
    mandanteId: string;
    visitanteId: string;
    data: string;
    placarMandante?: string;
    placarVisitante?: string;
  }[];
};

type JogadorLogado = {
  id: string;
  nome: string;
  nomeCompleto?: string;
  idOnline: string;
  pais?: string;
  valor?: number;
  imagem?: string;
  isAdmin?: boolean;
  email?: string;
};

type AbaPrincipal = "informacoes" | "calendario" | "titulos";

const LIMITE_ELENCO = 60;

function gerarId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getNomeCriador(logado: JogadorLogado | null) {
  return logado?.email || logado?.idOnline || logado?.nome || "";
}

function formatarData(data?: string) {
  if (!data) return "Sem data";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return data;
  return d.toLocaleString("pt-BR");
}

function normalizarTexto(texto?: string) {
  return String(texto || "").trim().toLowerCase();
}

function reduzirImagem(file: File, maxWidth = 400, quality = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Erro ao processar imagem."));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", quality);
        resolve(base64);
      };

      img.onerror = () => reject(new Error("Imagem inválida."));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error("Erro ao ler arquivo."));
    reader.readAsDataURL(file);
  });
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function CriarEquipePage() {
  const [jogadorLogado, setJogadorLogado] = useState<JogadorLogado | null>(null);
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);

  const [modoEdicao, setModoEdicao] = useState(false);
  const [equipeId, setEquipeId] = useState("");
  const [podeEditar, setPodeEditar] = useState(true);

  const [nome, setNome] = useState("");
  const [pais, setPais] = useState("Brasil");
  const [plataforma, setPlataforma] = useState("PC");
  const [imagem, setImagem] = useState("");
  const [instagram, setInstagram] = useState("");
  const [elenco, setElenco] = useState<JogadorNoElenco[]>([]);
  const [mensagem, setMensagem] = useState("");

  const [abaPrincipal, setAbaPrincipal] = useState<AbaPrincipal>("informacoes");

  const [nomeJogador, setNomeJogador] = useState("");
  const [idOnlineJogador, setIdOnlineJogador] = useState("");
  const [posicaoJogador, setPosicaoJogador] = useState("");
  const [numeroJogador, setNumeroJogador] = useState("");
  const [imagemJogador, setImagemJogador] = useState("");

  useEffect(() => {
    const jogadorSalvo = localStorage.getItem("jogadorLogado");
    const listaJogadores = readJson<Jogador[]>("jogadores", []);
    const listaEquipes = readJson<Equipe[]>("equipes", []);
    const listaCampeonatos = readJson<Campeonato[]>("campeonatos", []);
    const equipeEmEdicaoId = localStorage.getItem("equipeEmEdicaoId");

    const logado: JogadorLogado | null = jogadorSalvo ? JSON.parse(jogadorSalvo) : null;

    setJogadorLogado(logado);
    setJogadores(listaJogadores);
    setEquipes(listaEquipes);
    setCampeonatos(listaCampeonatos);

    if (equipeEmEdicaoId) {
      const equipe = listaEquipes.find(
        (item) => String(item.id) === String(equipeEmEdicaoId)
      );

      if (equipe) {
        const criador = equipe.criadoPor || "";
        const usuarioAtual = getNomeCriador(logado);

        setModoEdicao(true);
        setEquipeId(equipe.id);
        setNome(equipe.nome || "");
        setPais(equipe.pais || "Brasil");
        setPlataforma(equipe.plataforma || "PC");
        setImagem(equipe.imagem || "");
        setInstagram(equipe.instagram || "");
        setElenco(equipe.elenco || []);

        if (criador && criador !== usuarioAtual && !logado?.isAdmin) {
          setPodeEditar(false);
          setMensagem("Você só pode editar o clube que foi criado por você.");
        }
      }
    }
  }, []);

  const equipeAtual = useMemo(() => {
    if (!equipeId) return null;
    return equipes.find((item) => String(item.id) === String(equipeId)) || null;
  }, [equipes, equipeId]);

  const jogosDoClube = useMemo(() => {
    if (!equipeId) return [];

    const lista: {
      campeonatoTitulo: string;
      data: string;
      adversarioNome: string;
      placar?: string;
    }[] = [];

    campeonatos.forEach((camp) => {
      (camp.jogos || []).forEach((jogo) => {
        if (String(jogo.mandanteId) === String(equipeId)) {
          const adversario = equipes.find((eq) => String(eq.id) === String(jogo.visitanteId));
          lista.push({
            campeonatoTitulo: camp.titulo,
            data: jogo.data,
            adversarioNome: adversario?.nome || "Adversário",
            placar:
              jogo.placarMandante !== undefined && jogo.placarVisitante !== undefined
                ? `${jogo.placarMandante} x ${jogo.placarVisitante}`
                : undefined,
          });
        }

        if (String(jogo.visitanteId) === String(equipeId)) {
          const adversario = equipes.find((eq) => String(eq.id) === String(jogo.mandanteId));
          lista.push({
            campeonatoTitulo: camp.titulo,
            data: jogo.data,
            adversarioNome: adversario?.nome || "Adversário",
            placar:
              jogo.placarMandante !== undefined && jogo.placarVisitante !== undefined
                ? `${jogo.placarMandante} x ${jogo.placarVisitante}`
                : undefined,
          });
        }
      });
    });

    return lista;
  }, [campeonatos, equipes, equipeId]);

  const titulosDoClube = useMemo(() => {
    if (!equipeId) return [];
    return campeonatos.filter((camp) => String(camp.campeaoId || "") === String(equipeId));
  }, [campeonatos, equipeId]);

  const jogadoresDoClube = useMemo(() => {
    return jogadores.filter((jogador) =>
      elenco.some((item) => String(item.jogadorId) === String(jogador.id))
    );
  }, [jogadores, elenco]);

  async function handleUploadEscudo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imagemReduzida = await reduzirImagem(file, 500, 0.7);
      setImagem(imagemReduzida);
      setMensagem("");
    } catch (error) {
      console.error(error);
      setMensagem("Não foi possível processar o escudo do clube.");
    }
  }

  async function handleUploadImagemJogador(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imagemReduzida = await reduzirImagem(file, 400, 0.6);
      setImagemJogador(imagemReduzida);
      setMensagem("");
    } catch (error) {
      console.error(error);
      setMensagem("Não foi possível processar a imagem do jogador.");
    }
  }

  function salvarEquipesAtualizadas(lista: Equipe[], equipeAtualizada?: Equipe) {
    localStorage.setItem("equipes", JSON.stringify(lista));
    setEquipes(lista);

    if (equipeAtualizada) {
      const campeonatosAtualizados = campeonatos.map((camp) => ({
        ...camp,
        times: (camp.times || []).map((time) =>
          String(time.id) === String(equipeAtualizada.id) ? equipeAtualizada : time
        ),
      }));

      localStorage.setItem("campeonatos", JSON.stringify(campeonatosAtualizados));
      setCampeonatos(campeonatosAtualizados);
      localStorage.setItem("equipeEmEdicaoId", String(equipeAtualizada.id));
    }
  }

  function handleSalvarEquipe() {
    if (!jogadorLogado) {
      setMensagem("Faça login para continuar.");
      return;
    }

    if (!nome.trim()) {
      setMensagem("Informe o nome do clube.");
      return;
    }

    const nomeDuplicado = equipes.some(
      (item) =>
        normalizarTexto(item.nome) === normalizarTexto(nome) &&
        String(item.id) !== String(equipeId)
    );

    if (nomeDuplicado) {
      setMensagem("Já existe um clube com esse nome.");
      return;
    }

    if (!podeEditar) {
      setMensagem("Você não pode editar este clube.");
      return;
    }

    const idFinal = equipeId || gerarId();

    const novaEquipe: Equipe = {
      id: idFinal,
      nome: nome.trim(),
      pais: pais.trim() || "Brasil",
      plataforma: plataforma.trim() || "PC",
      imagem: imagem.trim(),
      instagram: instagram.trim(),
      vitorias: equipeAtual?.vitorias || 0,
      empates: equipeAtual?.empates || 0,
      derrotas: equipeAtual?.derrotas || 0,
      titulos: titulosDoClube.length || equipeAtual?.titulos || 0,
      criadoPor: equipeAtual?.criadoPor || getNomeCriador(jogadorLogado),
      formacao: "3-5-2",
      elenco,
    };

    const existeEquipe = equipes.some((item) => String(item.id) === String(idFinal));

    const novaLista = existeEquipe
      ? equipes.map((item) => (String(item.id) === String(novaEquipe.id) ? novaEquipe : item))
      : [...equipes, novaEquipe];

    setEquipeId(idFinal);
    setModoEdicao(true);
    setMensagem(existeEquipe ? "Clube atualizado com sucesso." : "Clube criado com sucesso.");

    salvarEquipesAtualizadas(novaLista, novaEquipe);
  }

  function criarJogadorNoClube() {
    if (!jogadorLogado) {
      setMensagem("Faça login para continuar.");
      return;
    }

    if (!nome.trim()) {
      setMensagem("Informe o nome do clube antes de criar jogadores.");
      return;
    }

    if (elenco.length >= LIMITE_ELENCO) {
      setMensagem(`O clube atingiu o limite de ${LIMITE_ELENCO} jogadores.`);
      return;
    }

    if (
      !nomeJogador.trim() ||
      !idOnlineJogador.trim() ||
      !posicaoJogador.trim() ||
      !numeroJogador.trim()
    ) {
      setMensagem("Preencha nome, ID online, posição e número da camisa.");
      return;
    }

    const nomeClubeDuplicado = equipes.some(
      (item) =>
        normalizarTexto(item.nome) === normalizarTexto(nome) &&
        String(item.id) !== String(equipeId || "")
    );

    if (nomeClubeDuplicado) {
      setMensagem("Já existe um clube com esse nome.");
      return;
    }

    const idDuplicado = jogadores.some(
      (j) => normalizarTexto(j.idOnline) === normalizarTexto(idOnlineJogador)
    );

    if (idDuplicado) {
      setMensagem("Já existe um jogador com esse ID online.");
      return;
    }

    const numeroDuplicadoNoClube = elenco.some(
      (j) => normalizarTexto(j.numero) === normalizarTexto(numeroJogador)
    );

    if (numeroDuplicadoNoClube) {
      setMensagem("Já existe um jogador com esse número da camisa no clube.");
      return;
    }

    const idClubeFinal = equipeId || gerarId();

    const equipeBase: Equipe = {
      id: idClubeFinal,
      nome: nome.trim(),
      pais: pais.trim() || "Brasil",
      plataforma: plataforma.trim() || "PC",
      imagem: imagem.trim(),
      instagram: instagram.trim(),
      vitorias: equipeAtual?.vitorias || 0,
      empates: equipeAtual?.empates || 0,
      derrotas: equipeAtual?.derrotas || 0,
      titulos: titulosDoClube.length || equipeAtual?.titulos || 0,
      criadoPor: equipeAtual?.criadoPor || getNomeCriador(jogadorLogado),
      formacao: "3-5-2",
      elenco,
    };

    const novoJogador: Jogador = {
      id: gerarId(),
      nome: nomeJogador.trim(),
      idOnline: idOnlineJogador.trim(),
      posicao: posicaoJogador.trim(),
      numero: numeroJogador.trim(),
      imagem: imagemJogador,
      overall: 55,
      valor: 550000,
      pais: pais,
      clubeAtualId: idClubeFinal,
      clubeAtualNome: nome.trim(),
      criadoPor: getNomeCriador(jogadorLogado),
      estatisticas: {
        gols: 0,
        assistencias: 0,
        desarmes: 0,
        defesas: 0,
        cartoes: 0,
      },
    };

    const novoJogadorElenco: JogadorNoElenco = {
      jogadorId: novoJogador.id,
      nome: novoJogador.nome,
      numero: novoJogador.numero,
      posicao: novoJogador.posicao,
      imagem: "",
      overall: novoJogador.overall,
    };

    const jogadoresAtualizados = [...jogadores, novoJogador];
    const elencoAtualizado = [...elenco, novoJogadorElenco];

    const equipeAtualizada: Equipe = {
      ...equipeBase,
      elenco: elencoAtualizado,
    };

    const existeEquipe = equipes.some(
      (item) => String(item.id) === String(idClubeFinal)
    );

    const equipesAtualizadas = existeEquipe
      ? equipes.map((item) =>
          String(item.id) === String(idClubeFinal) ? equipeAtualizada : item
        )
      : [...equipes, equipeAtualizada];

    try {
      localStorage.setItem("jogadores", JSON.stringify(jogadoresAtualizados));
      setJogadores(jogadoresAtualizados);

      setElenco(elencoAtualizado);
      setEquipeId(idClubeFinal);
      setModoEdicao(true);

      salvarEquipesAtualizadas(equipesAtualizadas, equipeAtualizada);

      setNomeJogador("");
      setIdOnlineJogador("");
      setPosicaoJogador("");
      setNumeroJogador("");
      setImagemJogador("");

      setMensagem("Jogador criado e adicionado ao elenco com sucesso.");
    } catch (error) {
      console.error(error);
      setMensagem(
        "Não foi possível salvar o jogador. A imagem está muito grande para o armazenamento local."
      );
    }
  }

  function removerJogadorDoElenco(jogadorId: string) {
    const elencoAtualizado = elenco.filter((item) => String(item.jogadorId) !== String(jogadorId));
    const jogadoresAtualizados = jogadores.filter((item) => String(item.id) !== String(jogadorId));

    setElenco(elencoAtualizado);
    setJogadores(jogadoresAtualizados);

    localStorage.setItem("jogadores", JSON.stringify(jogadoresAtualizados));

    if (equipeId) {
      const equipeAtualizada: Equipe = {
        id: equipeId,
        nome: nome.trim(),
        pais: pais.trim() || "Brasil",
        plataforma: plataforma.trim() || "PC",
        imagem: imagem.trim(),
        instagram: instagram.trim(),
        vitorias: equipeAtual?.vitorias || 0,
        empates: equipeAtual?.empates || 0,
        derrotas: equipeAtual?.derrotas || 0,
        titulos: titulosDoClube.length || equipeAtual?.titulos || 0,
        criadoPor: equipeAtual?.criadoPor || getNomeCriador(jogadorLogado),
        formacao: "3-5-2",
        elenco: elencoAtualizado,
      };

      const equipesAtualizadas = equipes.map((item) =>
        String(item.id) === String(equipeId) ? equipeAtualizada : item
      );

      salvarEquipesAtualizadas(equipesAtualizadas, equipeAtualizada);
    }

    setMensagem("Jogador removido do elenco.");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
        padding: 18,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            color: "#ff4fd8",
            textDecoration: "none",
            fontWeight: 700,
            display: "inline-block",
            marginBottom: 18,
          }}
        >
          ← Voltar para dashboard
        </Link>

        {mensagem && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              background: "rgba(255,79,216,0.08)",
              border: "1px solid rgba(255,79,216,0.22)",
              borderRadius: 12,
            }}
          >
            {mensagem}
          </div>
        )}

        <section
          style={{
            background: "#050505",
            border: "1px solid #151515",
            borderRadius: 22,
            padding: 18,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "300px 1fr",
              gap: 22,
              alignItems: "start",
            }}
          >
            <div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18 }}>
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 14,
                    background: "#111",
                    overflow: "hidden",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {imagem ? (
                    <img
                      src={imagem}
                      alt={nome}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ color: "#777" }}>Escudo</span>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>
                    {nome || "Nome do clube"}
                  </div>
                  <div style={{ color: "#d0d0d0", fontSize: 16 }}>
                    {pais || "Brasil"} • {plataforma || "PC"}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
                <div>
                  <label style={labelStyle}>Nome do clube</label>
                  <input value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>País</label>
                  <input value={pais} onChange={(e) => setPais(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Plataforma</label>
                  <select value={plataforma} onChange={(e) => setPlataforma(e.target.value)} style={inputStyle}>
                    <option value="PC">PC</option>
                    <option value="PlayStation">PlayStation</option>
                    <option value="Xbox">Xbox</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Instagram</label>
                  <input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    style={inputStyle}
                    placeholder="@seuclube"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Escudo do clube</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadEscudo}
                    style={{ ...inputStyle, padding: 10 }}
                  />
                </div>

                <button onClick={handleSalvarEquipe} style={primaryButtonStyle} disabled={!podeEditar}>
                  {modoEdicao ? "Salvar alterações" : "Criar clube"}
                </button>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <button onClick={() => setAbaPrincipal("informacoes")} style={tabButtonStyle(abaPrincipal === "informacoes")}>
                  Informações
                </button>
                <button onClick={() => setAbaPrincipal("calendario")} style={tabButtonStyle(abaPrincipal === "calendario")}>
                  Calendário
                </button>
                <button onClick={() => setAbaPrincipal("titulos")} style={tabButtonStyle(abaPrincipal === "titulos")}>
                  Títulos
                </button>
              </div>
            </div>

            <div>
              {abaPrincipal === "informacoes" && (
                <>
                  <div
                    style={{
                      background: "#070707",
                      border: "1px solid #181818",
                      borderRadius: 18,
                      padding: 18,
                      marginBottom: 18,
                    }}
                  >
                    <h2 style={{ margin: 0, fontSize: 34, marginBottom: 14 }}>
                      Elenco {elenco.length}/{LIMITE_ELENCO} Jogadores
                    </h2>

                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            <th style={thStyle}>Pos</th>
                            <th style={thStyle}>Nome</th>
                            <th style={thStyle}>Nº</th>
                            <th style={thStyle}>Overall</th>
                            <th style={thStyle}>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {elenco.length === 0 ? (
                            <tr>
                              <td style={tdStyle}>-</td>
                              <td style={tdStyle}>Nenhum jogador</td>
                              <td style={tdStyle}>-</td>
                              <td style={tdStyle}>-</td>
                              <td style={tdStyle}>-</td>
                            </tr>
                          ) : (
                            elenco.map((item) => (
                              <tr key={item.jogadorId}>
                                <td style={tdStyle}>{item.posicao}</td>
                                <td style={tdStyle}>{item.nome}</td>
                                <td style={tdStyle}>{item.numero}</td>
                                <td style={tdStyle}>{item.overall ?? 55}</td>
                                <td style={tdStyle}>
                                  <button
                                    onClick={() => removerJogadorDoElenco(item.jogadorId)}
                                    style={secondaryButtonStyle}
                                  >
                                    Remover
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#070707",
                      border: "1px solid #181818",
                      borderRadius: 18,
                      padding: 18,
                      marginBottom: 18,
                    }}
                  >
                    <h2 style={{ marginTop: 0 }}>Criar jogador no clube</h2>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>ID online</label>
                        <input
                          value={nomeJogador}
                          onChange={(e) => setNomeJogador(e.target.value)}
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Nome</label>
                        <input
                          value={idOnlineJogador}
                          onChange={(e) => setIdOnlineJogador(e.target.value)}
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Posição</label>
                        <select
                          value={posicaoJogador}
                          onChange={(e) => setPosicaoJogador(e.target.value)}
                          style={inputStyle}
                        >
                          <option value="">Selecione</option>
                          <option value="GOL">GOL</option>
                          <option value="ZAG">ZAG</option>
                          <option value="LD">LD</option>
                          <option value="LE">LE</option>
                          <option value="VOL">VOL</option>
                          <option value="MC">MC</option>
                          <option value="MEI">MEI</option>
                          <option value="ATA">ATA</option>
                          <option value="PE">PE</option>
                          <option value="PD">PD</option>
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>Nº da camisa</label>
                        <input
                          value={numeroJogador}
                          onChange={(e) => setNumeroJogador(e.target.value)}
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>Imagem do jogador</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadImagemJogador}
                          style={{ ...inputStyle, padding: 10 }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <button onClick={criarJogadorNoClube} style={primaryButtonStyle} disabled={!podeEditar}>
                        Criar jogador
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#070707",
                      border: "1px solid #181818",
                      borderRadius: 18,
                      padding: 18,
                    }}
                  >
                    <div style={{ marginBottom: 12, fontWeight: 700, color: "#d6d6d6" }}>
                      Jogadores do clube
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 12,
                      }}
                    >
                      {jogadoresDoClube.length === 0 ? (
                        <div style={emptyCardStyle}>Nenhum jogador cadastrado.</div>
                      ) : (
                        jogadoresDoClube.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              borderRadius: 12,
                              border: "1px solid #191919",
                              background: "#050505",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                height: 160,
                                background: "#101010",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {item.imagem ? (
                                <img
                                  src={item.imagem}
                                  alt={item.nome}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                <span style={{ color: "#777" }}>Sem imagem</span>
                              )}
                            </div>

                            <div style={{ padding: 10, textAlign: "center" }}>
                              <div style={{ fontWeight: 700 }}>{item.nome}</div>
                              <div style={{ color: "#aaa", fontSize: 13, marginTop: 4 }}>
                                {item.posicao} • #{item.numero}
                              </div>
                              <div style={{ color: "#fff", fontSize: 13, marginTop: 4 }}>
                                Overall {item.overall ?? 55}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              {abaPrincipal === "calendario" && (
                <div
                  style={{
                    background: "#070707",
                    border: "1px solid #181818",
                    borderRadius: 18,
                    padding: 18,
                  }}
                >
                  <h2 style={{ marginTop: 0 }}>Calendário do clube</h2>

                  {jogosDoClube.length === 0 ? (
                    <div style={emptyCardStyle}>Nenhum confronto encontrado.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 14 }}>
                      {jogosDoClube.map((jogo, index) => (
                        <div key={`${jogo.campeonatoTitulo}-${index}`} style={cardStyle}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{jogo.campeonatoTitulo}</div>
                            <div style={{ color: "#bbb", fontSize: 14 }}>
                              vs {jogo.adversarioNome}
                            </div>
                            <div style={{ color: "#999", fontSize: 13 }}>
                              {formatarData(jogo.data)}
                            </div>
                          </div>

                          <div style={{ fontWeight: 700 }}>
                            {jogo.placar || "Sem resultado"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {abaPrincipal === "titulos" && (
                <div
                  style={{
                    background: "#070707",
                    border: "1px solid #181818",
                    borderRadius: 18,
                    padding: 18,
                  }}
                >
                  <h2 style={{ marginTop: 0 }}>Títulos</h2>

                  {titulosDoClube.length === 0 ? (
                    <div style={emptyCardStyle}>Esse clube ainda não possui títulos.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {titulosDoClube.map((titulo) => (
                        <div key={titulo.id} style={cardStyle}>
                          <div style={{ fontWeight: 700 }}>{titulo.titulo}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function tabButtonStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "#ff4fd8" : "#111",
    color: "#fff",
    border: active ? "1px solid #ff4fd8" : "1px solid #222",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  };
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#111",
  color: "#fff",
  border: "1px solid #2a2a2a",
  borderRadius: 12,
  padding: "12px 14px",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 8,
  color: "#d8d8d8",
  fontWeight: 700,
  fontSize: 14,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  borderBottom: "1px solid #1f1f1f",
  color: "#bdbdbd",
  fontSize: 13,
};

const tdStyle: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "1px solid #141414",
  color: "#fff",
  fontSize: 14,
};

const cardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
  background: "#090909",
  border: "1px solid #1f1f1f",
  borderRadius: 14,
  padding: "14px",
};

const emptyCardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 14,
  border: "1px solid #1d1d1d",
  background: "#050505",
  textAlign: "center",
  color: "#888",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#ff4fd8",
  border: "none",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #ff4fd8",
  color: "#ff4fd8",
  padding: "8px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};