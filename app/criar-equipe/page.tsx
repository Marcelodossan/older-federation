"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import { createClient } from "@/lib/supabase/client";

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
  user_id?: string;
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
  user_id?: string;
  formacao?: string;
  elenco?: JogadorNoElenco[];
};

type Campeonato = {
  id: string;
  titulo: string;
  imagem: string;
  numeroParticipantes: number;
  formato:
    | "eliminatorias"
    | "pontos-corridos"
    | "pontos-corridos-eliminatorias";
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
  idOnline?: string;
  pais?: string;
  valor?: number;
  imagem?: string;
  isAdmin?: boolean;
  email?: string;
};

type AbaPrincipal = "informacoes" | "calendario" | "titulos";

const LIMITE_ELENCO = 60;
const ADMIN_EMAIL = "marcelo.dos.santos.filho03@gmail.com";

function gerarId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatarData(data?: string) {
  if (!data) return "No date";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return data;
  return d.toLocaleString("en-US");
}

function normalizarTexto(texto?: string) {
  return String(texto || "").trim().toLowerCase();
}

function reduzirImagem(
  file: File,
  maxWidth = 400,
  quality = 0.6
): Promise<string> {
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
          reject(new Error("Error processing image."));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", quality);
        resolve(base64);
      };

      img.onerror = () => reject(new Error("Invalid image."));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error("Error reading file."));
    reader.readAsDataURL(file);
  });
}

function normalizarEquipe(item: any): Equipe {
  return {
    id: String(item.id),
    nome: item.nome || "",
    pais: item.pais || "Brazil",
    plataforma: item.plataforma || "PC",
    imagem: item.imagem || "",
    instagram: item.instagram || "",
    vitorias: Number(item.vitorias || 0),
    empates: Number(item.empates || 0),
    derrotas: Number(item.derrotas || 0),
    titulos: Number(item.titulos || 0),
    criadoPor: item.criadoPor || "",
    user_id: item.user_id || "",
    formacao: item.formacao || "3-5-2",
    elenco: Array.isArray(item.elenco) ? item.elenco : [],
  };
}

function normalizarJogador(item: any): Jogador {
  return {
    id: String(item.id),
    nome: item.nome || "Player",
    idOnline: item.idOnline || "",
    posicao: item.posicao || "",
    numero: String(item.numero || ""),
    imagem: item.imagem || "",
    overall: Number(item.overall || 55),
    valor: Number(item.valor || 550000),
    pais: item.pais || "",
    clubeAtualId: String(item.clubeAtualId || ""),
    clubeAtualNome: item.clubeAtualNome || "",
    criadoPor: item.criadoPor || "",
    user_id: item.user_id || "",
    estatisticas: item.estatisticas || {
      gols: 0,
      assistencias: 0,
      desarmes: 0,
      defesas: 0,
      cartoes: 0,
    },
  };
}

function normalizarCampeonato(item: any): Campeonato {
  return {
    id: String(item.id),
    titulo: item.titulo || item.nome || "Tournament",
    imagem: item.imagem || "",
    numeroParticipantes: Number(
      item.numeroParticipantes || item.numeroparticipantes || 0
    ),
    formato: item.formato || "eliminatorias",
    criadoPor: item.criadoPor || item.criadopor || "",
    dataCriacao: item.dataCriacao || item.datacriacao || item.created_at || "",
    times: Array.isArray(item.times) ? item.times : [],
    campeaoId: item.campeaoId || item.campeaoid || "",
    jogos: Array.isArray(item.jogos) ? item.jogos : [],
  };
}
export default function CriarEquipePage() {
  const [jogadorLogado, setJogadorLogado] = useState<JogadorLogado | null>(null);
  const [authUserId, setAuthUserId] = useState<string>("");
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);

  const [modoEdicao, setModoEdicao] = useState(false);
  const [equipeId, setEquipeId] = useState("");
  const [podeEditar, setPodeEditar] = useState(true);
  const [carregando, setCarregando] = useState(true);

  const [nome, setNome] = useState("");
  const [pais, setPais] = useState("Brazil");
  const [plataforma, setPlataforma] = useState("PC");
  const [imagem, setImagem] = useState("");
  const [instagram, setInstagram] = useState("");
  const [elenco, setElenco] = useState<JogadorNoElenco[]>([]);
  const [mensagem, setMensagem] = useState("");

  const [abaPrincipal, setAbaPrincipal] =
    useState<AbaPrincipal>("informacoes");

  const [nomeJogador, setNomeJogador] = useState("");
  const [idOnlineJogador, setIdOnlineJogador] = useState("");
  const [posicaoJogador, setPosicaoJogador] = useState("");
  const [numeroJogador, setNumeroJogador] = useState("");
  const [imagemJogador, setImagemJogador] = useState("");

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function carregarDados() {
      const supabase = createClient();

      try {
        setCarregando(true);
        setMensagem("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(userError);
          setMensagem("Error validating login.");
          return;
        }

        if (!user) {
          setMensagem("Please sign in to manage your club.");
          return;
        }

        const isAdmin =
          normalizarTexto(user.email) === normalizarTexto(ADMIN_EMAIL);

        const usuarioLogado: JogadorLogado = {
          id: user.id,
          nome: user.email?.split("@")[0] || "User",
          email: user.email || "",
          isAdmin,
        };

        setJogadorLogado(usuarioLogado);
        setAuthUserId(user.id);
        setPodeEditar(true);

        const { data: listaEquipesBanco, error: errorEquipes } = await supabase
          .from("equipes")
          .select("*")
          .order("created_at", { ascending: false });

        if (errorEquipes) {
          console.error(errorEquipes);
          setMensagem("Error loading teams from database.");
          setEquipes([]);
          return;
        }

        const equipesBanco: Equipe[] = Array.isArray(listaEquipesBanco)
          ? listaEquipesBanco.map(normalizarEquipe)
          : [];

        setEquipes(equipesBanco);

        let equipeDoUsuario: Equipe | null =
          equipesBanco.find(
            (item) =>
              String(item.user_id || "") === String(user.id) ||
              String(item.criadoPor || "") === String(user.id)
          ) || null;

        if (!equipeDoUsuario && isAdmin && equipesBanco.length > 0) {
          equipeDoUsuario = equipesBanco[0];
        }

        if (equipeDoUsuario) {
          setModoEdicao(true);
          setEquipeId(equipeDoUsuario.id);
          setNome(equipeDoUsuario.nome || "");
          setPais(equipeDoUsuario.pais || "Brazil");
          setPlataforma(equipeDoUsuario.plataforma || "PC");
          setImagem(equipeDoUsuario.imagem || "");
          setInstagram(equipeDoUsuario.instagram || "");
          setElenco(
            Array.isArray(equipeDoUsuario.elenco) ? equipeDoUsuario.elenco : []
          );

          const donoDaEquipe =
            String(equipeDoUsuario.user_id || equipeDoUsuario.criadoPor || "") ===
            String(user.id);

          if (!donoDaEquipe && !isAdmin) {
            setPodeEditar(false);
            setMensagem("You can only edit the club created by you.");
          }

          const { data: listaJogadoresBanco, error: errorJogadores } =
            await supabase
              .from("jogadores")
              .select("*")
              .eq("clubeAtualId", equipeDoUsuario.id)
              .order("created_at", { ascending: false });

          if (errorJogadores) {
            console.error(errorJogadores);
            setJogadores([]);
          } else {
            setJogadores(
              Array.isArray(listaJogadoresBanco)
                ? listaJogadoresBanco.map(normalizarJogador)
                : []
            );
          }
        } else {
          setModoEdicao(false);
          setEquipeId("");
          setJogadores([]);
          setElenco([]);
        }

        const { data: listaCampeonatosBanco, error: errorCampeonatos } =
          await supabase
            .from("campeonatos")
            .select("*")
            .order("created_at", { ascending: false });

        if (errorCampeonatos) {
          console.error(errorCampeonatos);
          setCampeonatos([]);
        } else {
          setCampeonatos(
            Array.isArray(listaCampeonatosBanco)
              ? listaCampeonatosBanco.map(normalizarCampeonato)
              : []
          );
        }
      } catch (error) {
        console.error(error);
        setMensagem("Error loading page data.");
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
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
          const adversario = equipes.find(
            (eq) => String(eq.id) === String(jogo.visitanteId)
          );

          lista.push({
            campeonatoTitulo: camp.titulo,
            data: jogo.data,
            adversarioNome: adversario?.nome || "Opponent",
            placar:
              jogo.placarMandante !== undefined &&
              jogo.placarVisitante !== undefined
                ? `${jogo.placarMandante} x ${jogo.placarVisitante}`
                : undefined,
          });
        }

        if (String(jogo.visitanteId) === String(equipeId)) {
          const adversario = equipes.find(
            (eq) => String(eq.id) === String(jogo.mandanteId)
          );

          lista.push({
            campeonatoTitulo: camp.titulo,
            data: jogo.data,
            adversarioNome: adversario?.nome || "Opponent",
            placar:
              jogo.placarMandante !== undefined &&
              jogo.placarVisitante !== undefined
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
    return campeonatos.filter(
      (camp) => String(camp.campeaoId || "") === String(equipeId)
    );
  }, [campeonatos, equipeId]);

  const jogadoresDoClube = useMemo(() => {
    const idsNoElenco = new Set(elenco.map((item) => String(item.jogadorId)));

    return jogadores.filter(
      (jogador) =>
        String(jogador.clubeAtualId || "") === String(equipeId) &&
        idsNoElenco.has(String(jogador.id))
    );
  }, [jogadores, elenco, equipeId]);

  async function handleUploadEscudo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imagemReduzida = await reduzirImagem(file, 500, 0.7);
      setImagem(imagemReduzida);
      setMensagem("");
    } catch (error) {
      console.error(error);
      setMensagem("Could not process the club badge.");
    }
  }

  async function handleUploadImagemJogador(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imagemReduzida = await reduzirImagem(file, 400, 0.6);
      setImagemJogador(imagemReduzida);
      setMensagem("");
    } catch (error) {
      console.error(error);
      setMensagem("Could not process the player image.");
    }
  }

  async function salvarEquipesAtualizadas(
    lista: Equipe[],
    equipeAtualizada?: Equipe
  ) {
    setEquipes(lista);

    if (equipeAtualizada) {
      const campeonatosAtualizados = campeonatos.map((camp) => ({
        ...camp,
        times: (camp.times || []).map((time) =>
          String(time.id) === String(equipeAtualizada.id)
            ? equipeAtualizada
            : time
        ),
      }));

      setCampeonatos(campeonatosAtualizados);
    }
  }

  async function handleSalvarEquipe() {
    const supabase = createClient();

    try {
      setMensagem("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error(authError);
        setMensagem("Error validating login.");
        return;
      }

      if (!user) {
        setMensagem("Please sign in to save the club.");
        return;
      }

      if (!nome.trim()) {
        setMensagem("Please enter the club name.");
        return;
      }

      const nomeDuplicado = equipes.some(
        (item) =>
          normalizarTexto(item.nome) === normalizarTexto(nome) &&
          String(item.id) !== String(equipeId)
      );

      if (nomeDuplicado) {
        setMensagem("A club with this name already exists.");
        return;
      }

      if (!podeEditar) {
        setMensagem("You cannot edit this club.");
        return;
      }

      const idFinal = equipeId || gerarId();

      const novaEquipe: Equipe = {
        id: idFinal,
        nome: nome.trim(),
        pais: pais.trim() || "Brazil",
        plataforma: plataforma.trim() || "PC",
        imagem: imagem.trim(),
        instagram: instagram.trim(),
        vitorias: equipeAtual?.vitorias || 0,
        empates: equipeAtual?.empates || 0,
        derrotas: equipeAtual?.derrotas || 0,
        titulos: titulosDoClube.length || equipeAtual?.titulos || 0,
        criadoPor: user.id,
        user_id: user.id,
        formacao: equipeAtual?.formacao || "3-5-2",
        elenco,
      };

      const payload = {
        id: novaEquipe.id,
        nome: novaEquipe.nome,
        pais: novaEquipe.pais,
        plataforma: novaEquipe.plataforma,
        imagem: novaEquipe.imagem,
        instagram: novaEquipe.instagram,
        vitorias: novaEquipe.vitorias,
        empates: novaEquipe.empates,
        derrotas: novaEquipe.derrotas,
        titulos: novaEquipe.titulos,
        criadoPor: novaEquipe.criadoPor,
        user_id: novaEquipe.user_id,
        formacao: novaEquipe.formacao,
        elenco: novaEquipe.elenco,
      };

      const { error } = await supabase
        .from("equipes")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        console.error(error);
        setMensagem(`Error saving club to database: ${error.message}`);
        return;
      }

      const existeEquipe = equipes.some(
        (item) => String(item.id) === String(idFinal)
      );

      const novaLista = existeEquipe
        ? equipes.map((item) =>
            String(item.id) === String(novaEquipe.id) ? novaEquipe : item
          )
        : [...equipes, novaEquipe];

      setEquipeId(idFinal);
      setModoEdicao(true);
      setAuthUserId(user.id);
      setPodeEditar(true);
      setMensagem(
        existeEquipe
          ? "Club updated successfully."
          : "Club created successfully."
      );

      await salvarEquipesAtualizadas(novaLista, novaEquipe);
    } catch (error) {
      console.error(error);
      setMensagem("Unexpected error while saving club.");
    }
  }
    async function criarJogadorNoClube() {
    const supabase = createClient();

    try {
      setMensagem("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error(authError);
        setMensagem("Error validating login.");
        return;
      }

      if (!user) {
        setMensagem("Please sign in to save the player.");
        return;
      }

      if (!nome.trim()) {
        setMensagem("Please enter the club name before creating players.");
        return;
      }

      if (elenco.length >= LIMITE_ELENCO) {
        setMensagem(`The club has reached the limit of ${LIMITE_ELENCO} players.`);
        return;
      }

      if (
        !nomeJogador.trim() ||
        !idOnlineJogador.trim() ||
        !posicaoJogador.trim() ||
        !numeroJogador.trim()
      ) {
        setMensagem("Fill in online ID, name, position, and shirt number.");
        return;
      }

      const nomeClubeDuplicado = equipes.some(
        (item) =>
          normalizarTexto(item.nome) === normalizarTexto(nome) &&
          String(item.id) !== String(equipeId || "")
      );

      if (nomeClubeDuplicado) {
        setMensagem("A club with this name already exists.");
        return;
      }

      const idDuplicado = jogadores.some(
        (j) => normalizarTexto(j.idOnline) === normalizarTexto(idOnlineJogador)
      );

      if (idDuplicado) {
        setMensagem("A player with this online ID already exists.");
        return;
      }

      const numeroDuplicadoNoClube = elenco.some(
        (j) => normalizarTexto(j.numero) === normalizarTexto(numeroJogador)
      );

      if (numeroDuplicadoNoClube) {
        setMensagem("A player with this shirt number already exists in the club.");
        return;
      }

      const idClubeFinal = equipeId || gerarId();

      const equipeBase: Equipe = {
        id: idClubeFinal,
        nome: nome.trim(),
        pais: pais.trim() || "Brazil",
        plataforma: plataforma.trim() || "PC",
        imagem: imagem.trim(),
        instagram: instagram.trim(),
        vitorias: equipeAtual?.vitorias || 0,
        empates: equipeAtual?.empates || 0,
        derrotas: equipeAtual?.derrotas || 0,
        titulos: titulosDoClube.length || equipeAtual?.titulos || 0,
        criadoPor: user.id,
        user_id: user.id,
        formacao: equipeAtual?.formacao || "3-5-2",
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
        criadoPor: user.id,
        user_id: user.id,
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
        imagem: novoJogador.imagem,
        overall: novoJogador.overall,
      };

      const { error: erroJogador } = await supabase.from("jogadores").insert({
        id: novoJogador.id,
        nome: novoJogador.nome,
        idOnline: novoJogador.idOnline,
        posicao: novoJogador.posicao,
        numero: novoJogador.numero,
        imagem: novoJogador.imagem,
        overall: novoJogador.overall,
        valor: novoJogador.valor,
        pais: novoJogador.pais,
        clubeAtualId: novoJogador.clubeAtualId,
        clubeAtualNome: novoJogador.clubeAtualNome,
        criadoPor: novoJogador.criadoPor,
        user_id: novoJogador.user_id,
        estatisticas: novoJogador.estatisticas,
      });

      if (erroJogador) {
        console.error(erroJogador);
        setMensagem(`Error saving player to database: ${erroJogador.message}`);
        return;
      }

      const jogadoresAtualizados = [novoJogador, ...jogadores];
      const elencoAtualizado = [...elenco, novoJogadorElenco];

      setJogadores(jogadoresAtualizados);
      setElenco(elencoAtualizado);

      const equipeAtualizada: Equipe = {
        ...equipeBase,
        elenco: elencoAtualizado,
      };

      const { error: erroEquipe } = await supabase
        .from("equipes")
        .upsert(
          {
            id: equipeAtualizada.id,
            nome: equipeAtualizada.nome,
            pais: equipeAtualizada.pais,
            plataforma: equipeAtualizada.plataforma,
            imagem: equipeAtualizada.imagem,
            instagram: equipeAtualizada.instagram,
            vitorias: equipeAtualizada.vitorias,
            empates: equipeAtualizada.empates,
            derrotas: equipeAtualizada.derrotas,
            titulos: equipeAtualizada.titulos,
            criadoPor: equipeAtualizada.criadoPor,
            user_id: equipeAtualizada.user_id,
            formacao: equipeAtualizada.formacao,
            elenco: equipeAtualizada.elenco,
          },
          { onConflict: "id" }
        );

      if (erroEquipe) {
        console.error(erroEquipe);
        setMensagem(
          `Player saved, but there was an error updating the squad: ${erroEquipe.message}`
        );
        return;
      }

      const existeEquipe = equipes.some(
        (item) => String(item.id) === String(equipeAtualizada.id)
      );

      const equipesAtualizadas = existeEquipe
        ? equipes.map((item) =>
            String(item.id) === String(equipeAtualizada.id)
              ? equipeAtualizada
              : item
          )
        : [...equipes, equipeAtualizada];

      await salvarEquipesAtualizadas(equipesAtualizadas, equipeAtualizada);

      setEquipeId(idClubeFinal);
      setModoEdicao(true);
      setPodeEditar(true);

      setNomeJogador("");
      setIdOnlineJogador("");
      setPosicaoJogador("");
      setNumeroJogador("");
      setImagemJogador("");

      setMensagem("Player created and saved successfully.");
    } catch (error) {
      console.error(error);
      setMensagem("Unexpected error while creating player.");
    }
  }

  async function removerJogadorDoElenco(jogadorId: string) {
    const supabase = createClient();

    try {
      if (!equipeId) return;

      const elencoAtualizado = elenco.filter(
        (item) => String(item.jogadorId) !== String(jogadorId)
      );

      const jogadoresAtualizados = jogadores.filter(
        (item) => String(item.id) !== String(jogadorId)
      );

      const { error: erroDeleteJogador } = await supabase
        .from("jogadores")
        .delete()
        .eq("id", jogadorId);

      if (erroDeleteJogador) {
        console.error(erroDeleteJogador);
        setMensagem(
          `Error removing player from database: ${erroDeleteJogador.message}`
        );
        return;
      }

      const equipeAtualizada: Equipe = {
        id: equipeId,
        nome: nome.trim(),
        pais: pais.trim() || "Brazil",
        plataforma: plataforma.trim() || "PC",
        imagem: imagem.trim(),
        instagram: instagram.trim(),
        vitorias: equipeAtual?.vitorias || 0,
        empates: equipeAtual?.empates || 0,
        derrotas: equipeAtual?.derrotas || 0,
        titulos: titulosDoClube.length || equipeAtual?.titulos || 0,
        criadoPor: equipeAtual?.criadoPor || authUserId,
        user_id: equipeAtual?.user_id || authUserId,
        formacao: equipeAtual?.formacao || "3-5-2",
        elenco: elencoAtualizado,
      };

      const { error: erroEquipe } = await supabase
        .from("equipes")
        .upsert(
          {
            id: equipeAtualizada.id,
            nome: equipeAtualizada.nome,
            pais: equipeAtualizada.pais,
            plataforma: equipeAtualizada.plataforma,
            imagem: equipeAtualizada.imagem,
            instagram: equipeAtualizada.instagram,
            vitorias: equipeAtualizada.vitorias,
            empates: equipeAtualizada.empates,
            derrotas: equipeAtualizada.derrotas,
            titulos: equipeAtualizada.titulos,
            criadoPor: equipeAtualizada.criadoPor,
            user_id: equipeAtualizada.user_id,
            formacao: equipeAtualizada.formacao,
            elenco: equipeAtualizada.elenco,
          },
          { onConflict: "id" }
        );

      if (erroEquipe) {
        console.error(erroEquipe);
        setMensagem(
          `Player removed, but there was an error updating the squad: ${erroEquipe.message}`
        );
        return;
      }

      setElenco(elencoAtualizado);
      setJogadores(jogadoresAtualizados);

      const equipesAtualizadas = equipes.map((item) =>
        String(item.id) === String(equipeId) ? equipeAtualizada : item
      );

      await salvarEquipesAtualizadas(equipesAtualizadas, equipeAtualizada);
      setMensagem("Player removed from squad.");
    } catch (error) {
      console.error(error);
      setMensagem("Unexpected error while removing player.");
    }
  }
    return (
    <main style={pageStyle(isMobile)}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <Link href="/" style={backLinkStyle(isMobile)}>
          ← Back to Dashboard
        </Link>

        {mensagem && (
          <div style={messageStyle(isMobile)}>
            {mensagem}
          </div>
        )}

        {carregando ? (
          <div style={loadingCardStyle}>
            Loading club data...
          </div>
        ) : (
          <section style={mainSectionStyle(isMobile)}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "300px 1fr",
                gap: isMobile ? 16 : 22,
                alignItems: "start",
              }}
            >
              <div>
                <div style={clubHeaderStyle}>
                  <div style={badgeBoxStyle(isMobile)}>
                    {imagem ? (
                      <img
                        src={imagem}
                        alt={nome}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span style={{ color: "#8f93ad" }}>Badge</span>
                    )}
                  </div>

                  <div>
                    <div style={clubNameStyle(isMobile)}>
                      {nome || "Club Name"}
                    </div>

                    <div style={clubMetaStyle(isMobile)}>
                      {pais || "Brazil"} • {plataforma || "PC"}
                    </div>

                    {modoEdicao && (
                      <div style={clubIdStyle}>
                        Club ID: {equipeId}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
                  <div>
                    <label style={labelStyle}>Club Name</label>
                    <input
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      style={inputStyle}
                      placeholder="Enter club name"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Country</label>
                    <input
                      value={pais}
                      onChange={(e) => setPais(e.target.value)}
                      style={inputStyle}
                      placeholder="Enter country"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Platform</label>
                    <select
                      value={plataforma}
                      onChange={(e) => setPlataforma(e.target.value)}
                      style={inputStyle}
                    >
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
                      placeholder="@yourclub"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Club Badge</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadEscudo}
                      style={{ ...inputStyle, padding: 10 }}
                    />
                  </div>

                  <button
                    onClick={handleSalvarEquipe}
                    style={primaryButtonStyle}
                    disabled={!podeEditar}
                  >
                    {modoEdicao ? "Save Changes" : "Create Club"}
                  </button>
                </div>

                <div style={tabsWrapperStyle}>
                  <button
                    onClick={() => setAbaPrincipal("informacoes")}
                    style={tabButtonStyle(abaPrincipal === "informacoes")}
                  >
                    Information
                  </button>

                  <button
                    onClick={() => setAbaPrincipal("calendario")}
                    style={tabButtonStyle(abaPrincipal === "calendario")}
                  >
                    Calendar
                  </button>

                  <button
                    onClick={() => setAbaPrincipal("titulos")}
                    style={tabButtonStyle(abaPrincipal === "titulos")}
                  >
                    Titles
                  </button>
                </div>
              </div>

              <div>
                {abaPrincipal === "informacoes" && (
                  <>
                    <div style={panelStyle(isMobile)}>
                      <h2 style={panelTitleStyle(isMobile)}>
                        Squad {elenco.length}/{LIMITE_ELENCO} Players
                      </h2>

                      <div style={{ overflowX: "auto" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                          }}
                        >
                          <thead>
                            <tr>
                              <th style={thStyle}>Pos</th>
                              <th style={thStyle}>Name</th>
                              <th style={thStyle}>No.</th>
                              <th style={thStyle}>Overall</th>
                              <th style={thStyle}>Actions</th>
                            </tr>
                          </thead>

                          <tbody>
                            {elenco.length === 0 ? (
                              <tr>
                                <td style={tdStyle}>-</td>
                                <td style={tdStyle}>No player</td>
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
                                      onClick={() =>
                                        removerJogadorDoElenco(item.jogadorId)
                                      }
                                      style={secondaryButtonStyle}
                                      disabled={!podeEditar}
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div style={panelStyle(isMobile)}>
                      <h2 style={{ marginTop: 0 }}>Create Player in Club</h2>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: isMobile
                            ? "1fr"
                            : "repeat(2, 1fr)",
                          gap: 12,
                        }}
                      >
                        <div>
                          <label style={labelStyle}>Online ID</label>
                          <input
                            value={idOnlineJogador}
                            onChange={(e) => setIdOnlineJogador(e.target.value)}
                            style={inputStyle}
                            placeholder="Player online ID"
                          />
                        </div>

                        <div>
                          <label style={labelStyle}>Name</label>
                          <input
                            value={nomeJogador}
                            onChange={(e) => setNomeJogador(e.target.value)}
                            style={inputStyle}
                            placeholder="Player name"
                          />
                        </div>

                        <div>
                          <label style={labelStyle}>Position</label>
                          <select
                            value={posicaoJogador}
                            onChange={(e) => setPosicaoJogador(e.target.value)}
                            style={inputStyle}
                          >
                            <option value="">Select</option>
                            <option value="GK">GK</option>
                            <option value="CB">CB</option>
                            <option value="RB">RB</option>
                            <option value="LB">LB</option>
                            <option value="CDM">CDM</option>
                            <option value="CM">CM</option>
                            <option value="CAM">CAM</option>
                            <option value="ST">ST</option>
                            <option value="LW">LW</option>
                            <option value="RW">RW</option>
                          </select>
                        </div>

                        <div>
                          <label style={labelStyle}>Shirt Number</label>
                          <input
                            value={numeroJogador}
                            onChange={(e) => setNumeroJogador(e.target.value)}
                            style={inputStyle}
                            placeholder="Number"
                          />
                        </div>

                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={labelStyle}>Player Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadImagemJogador}
                            style={{ ...inputStyle, padding: 10 }}
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <button
                          onClick={criarJogadorNoClube}
                          style={primaryButtonStyle}
                          disabled={!podeEditar}
                        >
                          Create Player
                        </button>
                      </div>
                    </div>
                                        <div style={panelStyle(isMobile)}>
                      <div style={playersSectionTitleStyle}>
                        Club Players
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: isMobile
                            ? "1fr"
                            : "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: 12,
                        }}
                      >
                        {jogadoresDoClube.length === 0 ? (
                          <div style={emptyCardStyle}>
                            No players registered yet.
                          </div>
                        ) : (
                          jogadoresDoClube.map((item) => (
                            <div key={item.id} style={playerCardStyle}>
                              <div style={playerImageBoxStyle(isMobile)}>
                                {item.imagem ? (
                                  <img
                                    src={item.imagem}
                                    alt={item.nome}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                ) : (
                                  <span style={{ color: "#8f93ad" }}>
                                    No image
                                  </span>
                                )}
                              </div>

                              <div style={{ padding: 10, textAlign: "center" }}>
                                <div style={{ fontWeight: 800 }}>{item.nome}</div>

                                <div style={mutedSmallTextStyle}>
                                  {item.idOnline}
                                </div>

                                <div style={mutedSmallTextStyle}>
                                  {item.posicao} • #{item.numero}
                                </div>

                                <div style={overallTextStyle}>
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
                  <div style={panelStyle(isMobile)}>
                    <h2 style={{ marginTop: 0 }}>Club Calendar</h2>

                    {jogosDoClube.length === 0 ? (
                      <div style={emptyCardStyle}>No matches found.</div>
                    ) : (
                      <div style={{ display: "grid", gap: 14 }}>
                        {jogosDoClube.map((jogo, index) => (
                          <div
                            key={`${jogo.campeonatoTitulo}-${index}`}
                            style={cardStyle}
                          >
                            <div>
                              <div style={{ fontWeight: 800 }}>
                                {jogo.campeonatoTitulo}
                              </div>

                              <div style={{ color: "#c7c9d9", fontSize: 14 }}>
                                vs {jogo.adversarioNome}
                              </div>

                              <div style={{ color: "#8f93ad", fontSize: 13 }}>
                                {formatarData(jogo.data)}
                              </div>
                            </div>

                            <div style={{ fontWeight: 800 }}>
                              {jogo.placar || "No result"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {abaPrincipal === "titulos" && (
                  <div style={panelStyle(isMobile)}>
                    <h2 style={{ marginTop: 0 }}>Titles</h2>

                    {titulosDoClube.length === 0 ? (
                      <div style={emptyCardStyle}>
                        This club has no titles yet.
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: 12 }}>
                        {titulosDoClube.map((titulo) => (
                          <div key={titulo.id} style={cardStyle}>
                            <div style={{ fontWeight: 800 }}>{titulo.titulo}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

const ORANGE = "#ff6900";
const BLACK = "#050505";
const PANEL = "#0b0b0f";
const LINE = "#242024";
const MUTED = "#bdb6b1";

function pageStyle(isMobile: boolean): CSSProperties {
  return {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(255,105,0,0.24), transparent 34%), radial-gradient(circle at top right, rgba(255,105,0,0.12), transparent 28%), #000",
    color: "#ffffff",
    fontFamily: "Arial, sans-serif",
    padding: isMobile ? 12 : 24,
    overflowX: "hidden",
  };
}

function backLinkStyle(isMobile: boolean): CSSProperties {
  return {
    color: ORANGE,
    textDecoration: "none",
    fontWeight: 900,
    display: "inline-block",
    marginBottom: 18,
    fontSize: isMobile ? 15 : 16,
  };
}

function messageStyle(isMobile: boolean): CSSProperties {
  return {
    marginBottom: 16,
    padding: "12px 14px",
    background: "rgba(255,105,0,0.11)",
    border: "1px solid rgba(255,105,0,0.28)",
    borderRadius: 14,
    fontSize: isMobile ? 14 : 16,
    color: "#ffffff",
  };
}

const loadingCardStyle: CSSProperties = {
  background: "linear-gradient(180deg, rgba(18,18,22,0.98), rgba(5,5,5,0.98))",
  border: `1px solid ${LINE}`,
  borderRadius: 24,
  padding: 24,
  textAlign: "center",
  color: MUTED,
};

function mainSectionStyle(isMobile: boolean): CSSProperties {
  return {
    background:
      "linear-gradient(135deg, rgba(255,105,0,0.18), rgba(5,5,5,0.98) 36%, rgba(15,15,18,1))",
    border: "1px solid rgba(255,105,0,0.35)",
    borderRadius: 28,
    padding: isMobile ? 14 : 22,
    boxShadow: "0 24px 80px rgba(255,105,0,0.12)",
    overflow: "hidden",
  };
}

const clubHeaderStyle: CSSProperties = {
  display: "flex",
  gap: 16,
  alignItems: "center",
  marginBottom: 18,
};

function badgeBoxStyle(isMobile: boolean): CSSProperties {
  return {
    width: isMobile ? 86 : 104,
    height: isMobile ? 86 : 104,
    borderRadius: 20,
    background: "linear-gradient(135deg, #1a1a1a, #050505)",
    overflow: "hidden",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255,105,0,0.35)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
  };
}

function clubNameStyle(isMobile: boolean): CSSProperties {
  return {
    fontSize: isMobile ? 24 : 32,
    fontWeight: 900,
    lineHeight: 1.05,
    color: "#ffffff",
  };
}

function clubMetaStyle(isMobile: boolean): CSSProperties {
  return {
    color: MUTED,
    fontSize: isMobile ? 14 : 16,
    marginTop: 4,
  };
}

const clubIdStyle: CSSProperties = {
  color: MUTED,
  fontSize: 12,
  marginTop: 7,
  wordBreak: "break-all",
};

const tabsWrapperStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 18,
};

function panelStyle(isMobile: boolean): CSSProperties {
  return {
    background: PANEL,
    border: `1px solid ${LINE}`,
    borderRadius: 22,
    padding: isMobile ? 14 : 18,
    marginBottom: 18,
  };
}

function panelTitleStyle(isMobile: boolean): CSSProperties {
  return {
    margin: 0,
    fontSize: isMobile ? 22 : 30,
    marginBottom: 14,
    lineHeight: 1.15,
    color: "#ffffff",
  };
}

function tabButtonStyle(active: boolean): CSSProperties {
  return {
    background: active ? ORANGE : "rgba(0,0,0,0.18)",
    color: active ? "#080808" : "#ffffff",
    border: `1px solid ${active ? ORANGE : "rgba(255,105,0,0.55)"}`,
    borderRadius: 999,
    padding: "10px 16px",
    fontWeight: 900,
    cursor: "pointer",
  };
}

const inputStyle: CSSProperties = {
  width: "100%",
  background: "#09090b",
  color: "#ffffff",
  border: "1px solid #2d2826",
  borderRadius: 13,
  padding: "12px 14px",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 8,
  color: MUTED,
  fontWeight: 800,
  fontSize: 14,
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "14px 12px",
  borderBottom: "1px solid #272020",
  color: "#f2e8e0",
  fontSize: 13,
  whiteSpace: "nowrap",
  background: "linear-gradient(90deg, rgba(255,105,0,0.22), rgba(12,12,12,1))",
};

const tdStyle: CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid #171316",
  color: "#ffffff",
  fontSize: 14,
  whiteSpace: "nowrap",
};

const cardStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
  background: "#08080b",
  border: `1px solid ${LINE}`,
  borderRadius: 18,
  padding: 14,
};

const emptyCardStyle: CSSProperties = {
  padding: 20,
  borderRadius: 16,
  border: "1px dashed rgba(255,105,0,0.25)",
  background: "rgba(255,255,255,0.03)",
  textAlign: "center",
  color: MUTED,
};

const primaryButtonStyle: CSSProperties = {
  background: ORANGE,
  border: "none",
  color: "#080808",
  padding: "11px 15px",
  borderRadius: 13,
  cursor: "pointer",
  fontWeight: 900,
};

const secondaryButtonStyle: CSSProperties = {
  background: "transparent",
  border: `1px solid ${ORANGE}`,
  color: ORANGE,
  padding: "8px 12px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 800,
};

const playersSectionTitleStyle: CSSProperties = {
  marginBottom: 12,
  fontWeight: 900,
  color: "#ffffff",
  fontSize: 20,
};

const playerCardStyle: CSSProperties = {
  borderRadius: 16,
  border: `1px solid ${LINE}`,
  background: "#08080b",
  overflow: "hidden",
};

function playerImageBoxStyle(isMobile: boolean): CSSProperties {
  return {
    width: "100%",
    height: isMobile ? 210 : 170,
    background: "#111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderBottom: "1px solid rgba(255,105,0,0.18)",
  };
}

const mutedSmallTextStyle: CSSProperties = {
  color: MUTED,
  fontSize: 13,
  marginTop: 4,
};

const overallTextStyle: CSSProperties = {
  color: ORANGE,
  fontSize: 13,
  marginTop: 6,
  fontWeight: 900,
};