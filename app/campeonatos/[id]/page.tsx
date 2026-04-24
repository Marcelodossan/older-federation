"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createClient } from "@/lib/supabase/client";

type JogadorElenco = {
  jogadorId: string;
  nome: string;
  nomeCompleto?: string;
  posicao: string;
  numero?: string;
  imagem?: string;
  overall?: number;
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
  emailDono?: string;
  criadoPorEmail?: string;
  elenco?: JogadorElenco[];
};

type CampeonatoFormato =
  | "eliminatorias"
  | "pontos-corridos"
  | "pontos-corridos-eliminatorias";

type EstatisticaJogador = {
  jogadorId: string;
  jogadorNome: string;
  posicao: string;
  gols: number;
  assistencias: number;
  desarmes: number;
  cartoes: number;
  defesas: number;
};

type Partida = {
  id: string;
  fase: "grupos" | "mata-mata";
  faseNome?: string;
  grupoNome?: string;
  rodada: number;
  mandanteId: string;
  visitanteId: string;
  golsMandante: number;
  golsVisitante: number;
  status: "pendente" | "finalizado";
  data: string;
  estatisticasMandante: EstatisticaJogador[];
  estatisticasVisitante: EstatisticaJogador[];
};

type GrupoData = {
  nome: string;
  timeIds: string[];
};

type Campeonato = {
  id: string;
  titulo: string;
  imagem: string;
  numeroParticipantes: number;
  formato: CampeonatoFormato;
  criadoPor: string;
  dataCriacao: string;
  timeIds?: string[];
  gruposData?: GrupoData[];
  partidas?: Partida[];
};

type JogadorLogado = {
  id: string;
  nome: string;
  idOnline?: string;
  email?: string;
  isAdmin?: boolean;
};

type TabKey = "grupos" | "mata-mata" | "ranking" | "trofeus";

type RankingCategoria =
  | "goleiro"
  | "defensores"
  | "meias-defensivos"
  | "meio-campistas"
  | "atacantes"
  | "artilheiro"
  | "lider-assistencias";

type GrupoRow = {
  posicao: number;
  equipe: Equipe | null;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  saldo: number;
};

type RankingRow = {
  posicao: number;
  jogador: string;
  equipe: string;
  pontos: number;
  gols: number;
  assistencias: number;
  desarmes: number;
  cartoes: number;
  defesas: number;
};

type RankingPlayerStats = {
  jogadorId: string;
  jogador: string;
  equipe: string;
  posicao: string;
  gols: number;
  assistencias: number;
  desarmes: number;
  cartoes: number;
  defesas: number;
  pontos: number;
};

type EscalacaoSlot = {
  slot: string;
  posicaoLabel: string;
  jogador: string;
  equipe: string;
};

const MAX_TIMES = 32;
const ADMIN_EMAIL = "marcelo.dos.santos.filho03@gmail.com";

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizarTexto(texto?: string) {
  return String(texto || "").trim().toLowerCase();
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
    emailDono: item.emailDono || "",
    criadoPorEmail: item.criadoPorEmail || "",
    elenco: Array.isArray(item.elenco) ? item.elenco : [],
  };
}

function normalizarCampeonato(item: any): Campeonato {
  return {
    id: String(item.id),
    titulo: item.titulo || "Tournament",
    imagem: item.imagem || "",
    numeroParticipantes: Number(item.numeroparticipantes || 0),
    formato: item.formato || "eliminatorias",
    criadoPor: item.criadopor || "",
    dataCriacao: item.datacriacao || item.created_at || "",
    timeIds: Array.isArray(item.timeids)
      ? item.timeids.map((id: any) => String(id))
      : [],
    gruposData: Array.isArray(item.gruposdata)
      ? item.gruposdata.map((grupo: any) => ({
          nome: grupo?.nome || "",
          timeIds: Array.isArray(grupo?.timeIds)
            ? grupo.timeIds.map((id: any) => String(id))
            : [],
        }))
      : [],
    partidas: Array.isArray(item.partidas) ? item.partidas : [],
  };
}

function getFormatoLabel(formato: CampeonatoFormato) {
  switch (formato) {
    case "eliminatorias":
      return "Knockout";
    case "pontos-corridos":
      return "League Format";
    case "pontos-corridos-eliminatorias":
      return "League + Knockout";
    default:
      return formato;
  }
}

function getFaseLabel(fase?: string) {
  if (fase === "Oitavas de final") return "Round of 16";
  if (fase === "Quartas de final") return "Quarter-finals";
  if (fase === "Semifinal") return "Semi-final";
  if (fase === "Final") return "Final";
  return fase || "";
}

function getRankingCategoriaLabel(categoria: RankingCategoria) {
  if (categoria === "goleiro") return "Goalkeepers";
  if (categoria === "defensores") return "Defenders";
  if (categoria === "meias-defensivos") return "Defensive Midfielders";
  if (categoria === "meio-campistas") return "Midfielders";
  if (categoria === "atacantes") return "Forwards";
  if (categoria === "artilheiro") return "Top Scorers";
  if (categoria === "lider-assistencias") return "Assist Leaders";
  return categoria;
}

function getVisibleTabs(formato: CampeonatoFormato): TabKey[] {
  if (formato === "eliminatorias") return ["mata-mata", "ranking", "trofeus"];
  if (formato === "pontos-corridos") return ["grupos", "ranking", "trofeus"];
  return ["grupos", "mata-mata", "ranking", "trofeus"];
}

function shuffleArray<T>(items: T[]) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getNumeroGrupos(totalTimes: number) {
  if (totalTimes <= 4) return 1;
  if (totalTimes <= 8) return 2;
  if (totalTimes <= 16) return 4;
  return 8;
}

function limparPosicao(posicao?: string) {
  return String(posicao || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getPosicaoExibicao(posicao?: string) {
  const p = limparPosicao(posicao);

  if (["GK", "GOLEIRO", "GOL", "GO"].includes(p)) return "GK";
  if (["ZAG", "ZAGUEIRO", "CB"].includes(p)) return "CB";
  if (["LAT", "LD", "LE", "LATERAL", "LATERAL DIREITO", "LATERAL ESQUERDO", "RB", "LB"].includes(p)) return "FB";
  if (["VOL", "VOLANTE", "MEIA DEFENSIVO", "MEIA-DEFENSIVO", "CDM"].includes(p)) return "CDM";
  if (["MC", "MEIO CAMPISTA", "MEIO-CAMPISTA", "CM"].includes(p)) return "CM";
  if (["MEI", "MEIA", "CAM"].includes(p)) return "CAM";
  if (["PE", "PONTA ESQUERDA", "LW"].includes(p)) return "LW";
  if (["PD", "PONTA DIREITA", "RW"].includes(p)) return "RW";
  if (["ATA", "ATACANTE", "CENTROAVANTE", "ST", "CF"].includes(p)) return "ST";

  return p || "-";
}

function getGrupoRankingPorPosicao(posicao?: string) {
  const p = getPosicaoExibicao(posicao);

  if (p === "GK") return "goleiro";
  if (p === "CB" || p === "FB") return "defensores";
  if (p === "CDM") return "meias-defensivos";
  if (p === "CM" || p === "CAM") return "meio-campistas";
  if (p === "LW" || p === "RW" || p === "ST") return "atacantes";

  return "";
}

function jogadorPassaNoFiltroDeRanking(
  categoria: RankingCategoria,
  posicao: string,
  stats: {
    gols: number;
    assistencias: number;
    desarmes: number;
    cartoes: number;
    defesas: number;
  }
) {
  const grupo = getGrupoRankingPorPosicao(posicao);

  if (categoria === "goleiro") return grupo === "goleiro";
  if (categoria === "defensores") return grupo === "defensores";
  if (categoria === "meias-defensivos") return grupo === "meias-defensivos";
  if (categoria === "meio-campistas") return grupo === "meio-campistas";
  if (categoria === "atacantes") return grupo === "atacantes";
  if (categoria === "artilheiro") return stats.gols > 0;
  if (categoria === "lider-assistencias") return stats.assistencias > 0;

  return true;
}

function gerarEstatisticasVazias(equipe: Equipe | null): EstatisticaJogador[] {
  return (equipe?.elenco || []).map((jogador) => ({
    jogadorId: String(jogador.jogadorId),
    jogadorNome: jogador.nome,
    posicao: jogador.posicao || "",
    gols: 0,
    assistencias: 0,
    desarmes: 0,
    cartoes: 0,
    defesas: 0,
  }));
}

function criarPartidasRoundRobin(
  grupoNome: string,
  ids: string[],
  times: Equipe[]
): Partida[] {
  if (ids.length < 2) return [];

  let lista = [...ids];
  if (lista.length % 2 !== 0) lista.push("BYE");

  const rodadas = lista.length - 1;
  const jogosPorRodada = lista.length / 2;
  const partidas: Partida[] = [];

  for (let rodada = 1; rodada <= rodadas; rodada++) {
    for (let i = 0; i < jogosPorRodada; i++) {
      const mandanteId = lista[i];
      const visitanteId = lista[lista.length - 1 - i];

      if (mandanteId === "BYE" || visitanteId === "BYE") continue;

      const mandante = times.find((t) => String(t.id) === String(mandanteId)) || null;
      const visitante = times.find((t) => String(t.id) === String(visitanteId)) || null;

      partidas.push({
        id: uid(),
        fase: "grupos",
        grupoNome,
        rodada,
        mandanteId,
        visitanteId,
        golsMandante: 0,
        golsVisitante: 0,
        status: "pendente",
        data: "",
        estatisticasMandante: gerarEstatisticasVazias(mandante),
        estatisticasVisitante: gerarEstatisticasVazias(visitante),
      });
    }

    const fixo = lista[0];
    const resto = lista.slice(1);
    resto.unshift(resto.pop() as string);
    lista = [fixo, ...resto];
  }

  return partidas;
}

function buildGroups(campeonato: Campeonato, times: Equipe[]): { nome: string; equipes: GrupoRow[] }[] {
  const partidas = campeonato.partidas || [];
  const gruposData = campeonato.gruposData || [];

  if (!gruposData.length) return [];

  return gruposData.map((grupo) => {
    const rows: GrupoRow[] = grupo.timeIds
      .map((timeId) => times.find((t) => String(t.id) === String(timeId)) || null)
      .filter(Boolean)
      .map((equipe) => ({
        posicao: 0,
        equipe,
        pontos: 0,
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        golsPro: 0,
        golsContra: 0,
        saldo: 0,
      })) as GrupoRow[];

    const partidasGrupo = partidas.filter(
      (p) => p.fase === "grupos" && p.grupoNome === grupo.nome && p.status === "finalizado"
    );

    partidasGrupo.forEach((p) => {
      const mandante = rows.find((r) => String(r.equipe?.id) === String(p.mandanteId));
      const visitante = rows.find((r) => String(r.equipe?.id) === String(p.visitanteId));

      if (!mandante || !visitante) return;

      mandante.jogos += 1;
      visitante.jogos += 1;

      mandante.golsPro += p.golsMandante;
      mandante.golsContra += p.golsVisitante;
      visitante.golsPro += p.golsVisitante;
      visitante.golsContra += p.golsMandante;

      if (p.golsMandante > p.golsVisitante) {
        mandante.vitorias += 1;
        visitante.derrotas += 1;
        mandante.pontos += 3;
      } else if (p.golsVisitante > p.golsMandante) {
        visitante.vitorias += 1;
        mandante.derrotas += 1;
        visitante.pontos += 3;
      } else {
        mandante.empates += 1;
        visitante.empates += 1;
        mandante.pontos += 1;
        visitante.pontos += 1;
      }
    });

    rows.forEach((row) => {
      row.saldo = row.golsPro - row.golsContra;
    });

    rows.sort((a, b) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
      if (b.saldo !== a.saldo) return b.saldo - a.saldo;
      if (b.golsPro !== a.golsPro) return b.golsPro - a.golsPro;
      return String(a.equipe?.nome || "").localeCompare(String(b.equipe?.nome || ""));
    });

    return {
      nome: grupo.nome,
      equipes: rows.map((row, index) => ({ ...row, posicao: index + 1 })),
    };
  });
}

function buildTabelaGeralPontosCorridos(campeonato: Campeonato, times: Equipe[]) {
  const partidas = campeonato.partidas || [];

  const rows: GrupoRow[] = times.map((equipe) => ({
    posicao: 0,
    equipe,
    pontos: 0,
    jogos: 0,
    vitorias: 0,
    empates: 0,
    derrotas: 0,
    golsPro: 0,
    golsContra: 0,
    saldo: 0,
  }));

  partidas
    .filter((p) => p.fase === "grupos" && p.status === "finalizado")
    .forEach((p) => {
      const mandante = rows.find((r) => String(r.equipe?.id) === String(p.mandanteId));
      const visitante = rows.find((r) => String(r.equipe?.id) === String(p.visitanteId));

      if (!mandante || !visitante) return;

      mandante.jogos += 1;
      visitante.jogos += 1;

      mandante.golsPro += p.golsMandante;
      mandante.golsContra += p.golsVisitante;
      visitante.golsPro += p.golsVisitante;
      visitante.golsContra += p.golsMandante;

      if (p.golsMandante > p.golsVisitante) {
        mandante.vitorias += 1;
        visitante.derrotas += 1;
        mandante.pontos += 3;
      } else if (p.golsVisitante > p.golsMandante) {
        visitante.vitorias += 1;
        mandante.derrotas += 1;
        visitante.pontos += 3;
      } else {
        mandante.empates += 1;
        visitante.empates += 1;
        mandante.pontos += 1;
        visitante.pontos += 1;
      }
    });

  rows.forEach((row) => {
    row.saldo = row.golsPro - row.golsContra;
  });

  rows.sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
    if (b.saldo !== a.saldo) return b.saldo - a.saldo;
    if (b.golsPro !== a.golsPro) return b.golsPro - a.golsPro;
    return String(a.equipe?.nome || "").localeCompare(String(b.equipe?.nome || ""));
  });

  return rows.map((row, index) => ({ ...row, posicao: index + 1 }));
}

function getMapaJogadoresDoCampeonato(times: Equipe[]) {
  const mapa = new Map<string, { equipeNome: string; posicao: string; jogadorNome: string }>();

  times.forEach((time) => {
    (time.elenco || []).forEach((jogador) => {
      mapa.set(String(jogador.jogadorId), {
        equipeNome: time.nome,
        posicao: getPosicaoExibicao(jogador.posicao || ""),
        jogadorNome: jogador.nome,
      });
    });
  });

  return mapa;
}

function getAllPlayerStats(campeonato: Campeonato, times: Equipe[]) {
  const mapa = new Map<string, RankingPlayerStats>();
  const mapaJogadores = getMapaJogadoresDoCampeonato(times);

  (campeonato.partidas || [])
    .filter((partida) => partida.status === "finalizado")
    .forEach((partida) => {
      const processar = (stats: EstatisticaJogador[]) => {
        (stats || []).forEach((item) => {
          const base = mapaJogadores.get(String(item.jogadorId));
          if (!base) return;

          const chave = `${item.jogadorId}`;
          const atual =
            mapa.get(chave) ||
            {
              jogadorId: String(item.jogadorId),
              jogador: base.jogadorNome || item.jogadorNome,
              equipe: base.equipeNome,
              posicao: base.posicao || item.posicao || "",
              gols: 0,
              assistencias: 0,
              desarmes: 0,
              cartoes: 0,
              defesas: 0,
              pontos: 0,
            };

          atual.gols += Number(item.gols || 0);
          atual.assistencias += Number(item.assistencias || 0);
          atual.desarmes += Number(item.desarmes || 0);
          atual.cartoes += Number(item.cartoes || 0);
          atual.defesas += Number(item.defesas || 0);

          atual.pontos =
            atual.gols * 6.5 +
            atual.assistencias * 4 +
            atual.desarmes * 1.5 +
            atual.cartoes * -2 +
            atual.defesas * 2;

          mapa.set(chave, atual);
        });
      };

      processar(partida.estatisticasMandante || []);
      processar(partida.estatisticasVisitante || []);
    });

  return Array.from(mapa.values());
}

function ordenarRankingCategoria(itens: RankingPlayerStats[], categoria: RankingCategoria) {
  const filtradas = itens.filter((item) =>
    jogadorPassaNoFiltroDeRanking(categoria, item.posicao, {
      gols: item.gols,
      assistencias: item.assistencias,
      desarmes: item.desarmes,
      cartoes: item.cartoes,
      defesas: item.defesas,
    })
  );

  const ordenadas = [...filtradas];

  if (categoria === "artilheiro") {
    ordenadas.sort(
      (a, b) =>
        b.gols - a.gols ||
        b.assistencias - a.assistencias ||
        b.pontos - a.pontos ||
        a.jogador.localeCompare(b.jogador)
    );
  } else if (categoria === "lider-assistencias") {
    ordenadas.sort(
      (a, b) =>
        b.assistencias - a.assistencias ||
        b.gols - a.gols ||
        b.pontos - a.pontos ||
        a.jogador.localeCompare(b.jogador)
    );
  } else {
    ordenadas.sort(
      (a, b) =>
        b.pontos - a.pontos ||
        b.gols - a.gols ||
        b.assistencias - a.assistencias ||
        a.jogador.localeCompare(b.jogador)
    );
  }

  return ordenadas;
}

function pegarPrimeiroDisponivel(lista: RankingPlayerStats[], usados: Set<string>): RankingPlayerStats | null {
  for (const item of lista) {
    if (!usados.has(item.jogadorId)) {
      usados.add(item.jogadorId);
      return item;
    }
  }
  return null;
}

function montarEscalacao352(base: RankingPlayerStats[]): EscalacaoSlot[] {
  const goalkeepers = ordenarRankingCategoria(base, "goleiro");
  const defenders = ordenarRankingCategoria(base, "defensores");
  const defensiveMidfielders = ordenarRankingCategoria(base, "meias-defensivos");
  const midfielders = ordenarRankingCategoria(base, "meio-campistas");
  const forwards = ordenarRankingCategoria(base, "atacantes");

  const usados = new Set<string>();

  const gk = pegarPrimeiroDisponivel(goalkeepers, usados);
  const cb1 = pegarPrimeiroDisponivel(defenders, usados);
  const cb2 = pegarPrimeiroDisponivel(defenders, usados);
  const cb3 = pegarPrimeiroDisponivel(defenders, usados);
  const cdm = pegarPrimeiroDisponivel(defensiveMidfielders, usados);
  const cam1 = pegarPrimeiroDisponivel(midfielders, usados);
  const cam2 = pegarPrimeiroDisponivel(midfielders, usados);
  const st1 = pegarPrimeiroDisponivel(forwards, usados);
  const st2 = pegarPrimeiroDisponivel(forwards, usados);
  const lw = pegarPrimeiroDisponivel(forwards, usados);
  const rw = pegarPrimeiroDisponivel(forwards, usados);

  const montar = (slot: string, posicaoLabel: string, jogador: RankingPlayerStats | null): EscalacaoSlot => ({
    slot,
    posicaoLabel,
    jogador: jogador?.jogador || "-",
    equipe: jogador?.equipe || "-",
  });

  return [
    montar("GK", "GK", gk),
    montar("CB-1", "CB", cb1),
    montar("CB-2", "CB", cb2),
    montar("CB-3", "CB", cb3),
    montar("CDM", "CDM", cdm),
    montar("CAM-1", "CAM", cam1),
    montar("CAM-2", "CAM", cam2),
    montar("RW", "RW", rw),
    montar("LW", "LW", lw),
    montar("ST-1", "ST", st1),
    montar("ST-2", "ST", st2),
  ];
}

function getCampeao(campeonato: Campeonato, times: Equipe[]): Equipe | null {
  const partidas = campeonato.partidas || [];

  if (campeonato.formato === "pontos-corridos") {
    const tabela = buildTabelaGeralPontosCorridos(campeonato, times);
    return tabela[0]?.equipe || null;
  }

  const finais = partidas.filter(
    (p) => p.fase === "mata-mata" && p.faseNome === "Final" && p.status === "finalizado"
  );

  if (!finais.length) return null;

  const final = finais[0];
  if (final.golsMandante === final.golsVisitante) return null;

  const campeaoId = final.golsMandante > final.golsVisitante ? final.mandanteId : final.visitanteId;

  return times.find((time) => String(time.id) === String(campeaoId)) || null;
}

function todasPartidasDeGrupoFinalizadas(campeonato: Campeonato) {
  const partidasGrupo = (campeonato.partidas || []).filter((p) => p.fase === "grupos");
  return partidasGrupo.length > 0 && partidasGrupo.every((p) => p.status === "finalizado");
}

function getNomeFaseInicialEliminatorias(totalTimes: number) {
  if (totalTimes >= 16) return "Oitavas de final";
  if (totalTimes >= 8) return "Quartas de final";
  if (totalTimes >= 4) return "Semifinal";
  return "Final";
}

function gerarMataMataPuro(campeonato: Campeonato, timesBase: Equipe[]): Campeonato {
  const times = shuffleArray(timesBase);
  if (times.length < 2) return campeonato;

  const partidasExistentes = (campeonato.partidas || []).filter((p) => p.fase === "mata-mata");
  if (partidasExistentes.length > 0) return campeonato;

  const faseNome = getNomeFaseInicialEliminatorias(times.length);
  const partidas: Partida[] = [];

  for (let i = 0; i < times.length; i += 2) {
    const mandante = times[i];
    const visitante = times[i + 1];
    if (!mandante || !visitante) continue;

    partidas.push({
      id: uid(),
      fase: "mata-mata",
      faseNome,
      rodada: 1,
      mandanteId: String(mandante.id),
      visitanteId: String(visitante.id),
      golsMandante: 0,
      golsVisitante: 0,
      status: "pendente",
      data: "",
      estatisticasMandante: gerarEstatisticasVazias(mandante),
      estatisticasVisitante: gerarEstatisticasVazias(visitante),
    });
  }

  return {
    ...campeonato,
    partidas: [...(campeonato.partidas || []), ...partidas],
  };
}

function gerarMataMataMistoAutomatico(campeonato: Campeonato, times: Equipe[]): Campeonato {
  if (campeonato.formato !== "pontos-corridos-eliminatorias") return campeonato;
  if (!todasPartidasDeGrupoFinalizadas(campeonato)) return campeonato;

  const jaTemMataMata = (campeonato.partidas || []).some((p) => p.fase === "mata-mata");
  if (jaTemMataMata) return campeonato;

  const grupos = buildGroups(campeonato, times);
  if (!grupos.length) return campeonato;

  const partidas: Partida[] = [];
  const totalTimes = times.length;

  if (totalTimes <= 4) {
    const tabelaGeral = grupos.flatMap((g) => g.equipes).sort((a, b) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      if (b.saldo !== a.saldo) return b.saldo - a.saldo;
      return b.golsPro - a.golsPro;
    });

    const timeA = tabelaGeral[0]?.equipe || null;
    const timeB = tabelaGeral[1]?.equipe || null;

    if (timeA && timeB) {
      partidas.push({
        id: uid(),
        fase: "mata-mata",
        faseNome: "Final",
        rodada: 1,
        mandanteId: String(timeA.id),
        visitanteId: String(timeB.id),
        golsMandante: 0,
        golsVisitante: 0,
        status: "pendente",
        data: "",
        estatisticasMandante: gerarEstatisticasVazias(timeA),
        estatisticasVisitante: gerarEstatisticasVazias(timeB),
      });
    }

    return { ...campeonato, partidas: [...(campeonato.partidas || []), ...partidas] };
  }

  if (grupos.length === 2) {
    const g1 = grupos[0].equipes;
    const g2 = grupos[1].equipes;

    const confrontos = [
      [g1[0]?.equipe || null, g2[1]?.equipe || null],
      [g1[1]?.equipe || null, g2[0]?.equipe || null],
    ];

    confrontos.forEach(([a, b]) => {
      if (!a || !b) return;
      partidas.push({
        id: uid(),
        fase: "mata-mata",
        faseNome: "Semifinal",
        rodada: 1,
        mandanteId: String(a.id),
        visitanteId: String(b.id),
        golsMandante: 0,
        golsVisitante: 0,
        status: "pendente",
        data: "",
        estatisticasMandante: gerarEstatisticasVazias(a),
        estatisticasVisitante: gerarEstatisticasVazias(b),
      });
    });

    return { ...campeonato, partidas: [...(campeonato.partidas || []), ...partidas] };
  }

  if (grupos.length === 4) {
    const g1 = grupos[0].equipes;
    const g2 = grupos[1].equipes;
    const g3 = grupos[2].equipes;
    const g4 = grupos[3].equipes;

    const confrontos = [
      [g1[0]?.equipe || null, g2[1]?.equipe || null],
      [g2[0]?.equipe || null, g1[1]?.equipe || null],
      [g3[0]?.equipe || null, g4[1]?.equipe || null],
      [g4[0]?.equipe || null, g3[1]?.equipe || null],
    ];

    confrontos.forEach(([a, b]) => {
      if (!a || !b) return;
      partidas.push({
        id: uid(),
        fase: "mata-mata",
        faseNome: "Quartas de final",
        rodada: 1,
        mandanteId: String(a.id),
        visitanteId: String(b.id),
        golsMandante: 0,
        golsVisitante: 0,
        status: "pendente",
        data: "",
        estatisticasMandante: gerarEstatisticasVazias(a),
        estatisticasVisitante: gerarEstatisticasVazias(b),
      });
    });

    return { ...campeonato, partidas: [...(campeonato.partidas || []), ...partidas] };
  }

  if (grupos.length === 8) {
    const confrontos: [Equipe | null, Equipe | null][] = [];

    for (let i = 0; i < 8; i += 2) {
      const ga = grupos[i]?.equipes || [];
      const gb = grupos[i + 1]?.equipes || [];
      confrontos.push([ga[0]?.equipe || null, gb[1]?.equipe || null]);
      confrontos.push([gb[0]?.equipe || null, ga[1]?.equipe || null]);
    }

    confrontos.forEach(([a, b]) => {
      if (!a || !b) return;
      partidas.push({
        id: uid(),
        fase: "mata-mata",
        faseNome: "Oitavas de final",
        rodada: 1,
        mandanteId: String(a.id),
        visitanteId: String(b.id),
        golsMandante: 0,
        golsVisitante: 0,
        status: "pendente",
        data: "",
        estatisticasMandante: gerarEstatisticasVazias(a),
        estatisticasVisitante: gerarEstatisticasVazias(b),
      });
    });

    return { ...campeonato, partidas: [...(campeonato.partidas || []), ...partidas] };
  }

  return campeonato;
}

function avancarMataMata(campeonato: Campeonato, times: Equipe[]): Campeonato {
  const partidas = campeonato.partidas || [];
  const fasesOrdem = ["Oitavas de final", "Quartas de final", "Semifinal", "Final"];

  for (let i = 0; i < fasesOrdem.length; i++) {
    const fase = fasesOrdem[i];
    const partidasDaFase = partidas.filter((p) => p.fase === "mata-mata" && p.faseNome === fase);

    if (!partidasDaFase.length) continue;
    if (!partidasDaFase.every((p) => p.status === "finalizado")) return campeonato;

    const proximaFase = fasesOrdem[i + 1];
    if (!proximaFase) return campeonato;

    const jaExisteProxima = partidas.some((p) => p.fase === "mata-mata" && p.faseNome === proximaFase);
    if (jaExisteProxima) continue;

    const vencedores = partidasDaFase
      .map((p) => {
        if (p.golsMandante === p.golsVisitante) return null;
        const id = p.golsMandante > p.golsVisitante ? p.mandanteId : p.visitanteId;
        return times.find((t) => String(t.id) === String(id)) || null;
      })
      .filter(Boolean) as Equipe[];

    if (vencedores.length < 2) return campeonato;

    const novas: Partida[] = [];
    for (let j = 0; j < vencedores.length; j += 2) {
      const a = vencedores[j];
      const b = vencedores[j + 1];
      if (!a || !b) continue;

      novas.push({
        id: uid(),
        fase: "mata-mata",
        faseNome: proximaFase,
        rodada: i + 2,
        mandanteId: String(a.id),
        visitanteId: String(b.id),
        golsMandante: 0,
        golsVisitante: 0,
        status: "pendente",
        data: "",
        estatisticasMandante: gerarEstatisticasVazias(a),
        estatisticasVisitante: gerarEstatisticasVazias(b),
      });
    }

    return { ...campeonato, partidas: [...partidas, ...novas] };
  }

  return campeonato;
}

const posicoesCampo352: Record<string, { top: string; left: string; transform?: string }> = {
  GK: { top: "86%", left: "50%", transform: "translate(-50%, -50%)" },
  "CB-1": { top: "70%", left: "28%", transform: "translate(-50%, -50%)" },
  "CB-2": { top: "70%", left: "50%", transform: "translate(-50%, -50%)" },
  "CB-3": { top: "70%", left: "72%", transform: "translate(-50%, -50%)" },
  CDM: { top: "56%", left: "50%", transform: "translate(-50%, -50%)" },
  "CAM-1": { top: "44%", left: "38%", transform: "translate(-50%, -50%)" },
  "CAM-2": { top: "44%", left: "62%", transform: "translate(-50%, -50%)" },
  LW: { top: "48%", left: "12%", transform: "translate(-50%, -50%)" },
  RW: { top: "48%", left: "88%", transform: "translate(-50%, -50%)" },
  "ST-1": { top: "18%", left: "38%", transform: "translate(-50%, -50%)" },
  "ST-2": { top: "18%", left: "62%", transform: "translate(-50%, -50%)" },
};

export default function CampeonatoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const campeonatoId = String(params?.id || "");

  const [jogadorLogado, setJogadorLogado] = useState<JogadorLogado | null>(null);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [campeonato, setCampeonato] = useState<Campeonato | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [tabAtiva, setTabAtiva] = useState<TabKey>("grupos");
  const [rankingCategoria, setRankingCategoria] = useState<RankingCategoria>("goleiro");

  const [faseAtiva, setFaseAtiva] = useState("");
  const [buscaTime, setBuscaTime] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [grupoSelecionado, setGrupoSelecionado] = useState("Group 1");
  const [rodadaSelecionada, setRodadaSelecionada] = useState(1);

  const [partidaSelecionada, setPartidaSelecionada] = useState<Partida | null>(null);
  const [placarMandanteEdicao, setPlacarMandanteEdicao] = useState(0);
  const [placarVisitanteEdicao, setPlacarVisitanteEdicao] = useState(0);
  const [statsMandanteEdicao, setStatsMandanteEdicao] = useState<EstatisticaJogador[]>([]);
  const [statsVisitanteEdicao, setStatsVisitanteEdicao] = useState<EstatisticaJogador[]>([]);

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        setMensagem("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const isAdmin = normalizarTexto(user?.email) === normalizarTexto(ADMIN_EMAIL);

        setJogadorLogado(
          user
            ? {
                id: user.id,
                nome: user.email?.split("@")[0] || "User",
                email: user.email || "",
                isAdmin,
              }
            : null
        );

        const { data: campeonatoBanco, error: campeonatoError } = await supabase
          .from("campeonatos")
          .select("*")
          .eq("id", campeonatoId)
          .maybeSingle();

        if (campeonatoError) {
          console.error(campeonatoError);
          setCampeonato(null);
          return;
        }

        if (!campeonatoBanco) {
          setCampeonato(null);
          return;
        }

        const campeonatoNormalizado = normalizarCampeonato(campeonatoBanco);
        setCampeonato(campeonatoNormalizado);

        const { data: equipesBanco, error: equipesError } = await supabase
          .from("equipes")
          .select("*")
          .order("created_at", { ascending: false });

        if (equipesError) {
          console.error(equipesError);
          setEquipes([]);
        } else {
          setEquipes(Array.isArray(equipesBanco) ? equipesBanco.map(normalizarEquipe) : []);
        }

        const tabs = getVisibleTabs(campeonatoNormalizado.formato);
        setTabAtiva(tabs[0]);
      } catch (error) {
        console.error(error);
        setMensagem("Error loading tournament.");
      } finally {
        setCarregando(false);
      }
    }

    if (campeonatoId) carregarDados();
  }, [campeonatoId, supabase]);

  const visibleTabs = useMemo(() => {
    if (!campeonato) return ["grupos"] as TabKey[];
    return getVisibleTabs(campeonato.formato);
  }, [campeonato]);

  const timesNoCampeonato = useMemo(() => {
    if (!campeonato) return [];
    const ids = campeonato.timeIds || [];
    return equipes.filter((equipe) => ids.includes(String(equipe.id)));
  }, [campeonato, equipes]);

  const vagasRestantes = campeonato
    ? Math.max(0, Math.min(MAX_TIMES, campeonato.numeroParticipantes) - timesNoCampeonato.length)
    : 0;

  const grupos = useMemo(() => {
    if (!campeonato) return [];
    if (campeonato.formato === "pontos-corridos") {
      return [
        {
          nome: "League Table",
          equipes: buildTabelaGeralPontosCorridos(campeonato, timesNoCampeonato),
        },
      ];
    }
    return buildGroups(campeonato, timesNoCampeonato);
  }, [campeonato, timesNoCampeonato]);

  useEffect(() => {
    if (grupos.length && !grupos.some((g) => g.nome === grupoSelecionado)) {
      setGrupoSelecionado(grupos[0].nome);
    }
  }, [grupos, grupoSelecionado]);

  const partidasMataMata = useMemo(() => {
    if (!campeonato) return [];
    return (campeonato.partidas || []).filter((p) => p.fase === "mata-mata");
  }, [campeonato]);

  const fasesMataMata = useMemo(() => {
    const fasesUnicas = Array.from(new Set((partidasMataMata || []).map((p) => p.faseNome).filter(Boolean))) as string[];
    const ordem = ["Oitavas de final", "Quartas de final", "Semifinal", "Final"];
    return ordem.filter((fase) => fasesUnicas.includes(fase));
  }, [partidasMataMata]);

  useEffect(() => {
    if (fasesMataMata.length && !fasesMataMata.includes(faseAtiva)) {
      setFaseAtiva(fasesMataMata[0]);
    }
  }, [fasesMataMata, faseAtiva]);

  const partidasDaFaseAtiva = useMemo(() => {
    if (!faseAtiva) return partidasMataMata;
    return partidasMataMata.filter((p) => p.faseNome === faseAtiva);
  }, [partidasMataMata, faseAtiva]);

  const rankingRows = useMemo(() => {
    if (!campeonato) return [];

    const base = getAllPlayerStats(campeonato, timesNoCampeonato);
    const filtradas = base.filter((item) =>
      jogadorPassaNoFiltroDeRanking(rankingCategoria, item.posicao, {
        gols: item.gols,
        assistencias: item.assistencias,
        desarmes: item.desarmes,
        cartoes: item.cartoes,
        defesas: item.defesas,
      })
    );

    let ordenadas = [...filtradas];

    if (rankingCategoria === "artilheiro") {
      ordenadas.sort(
        (a, b) => b.gols - a.gols || b.assistencias - a.assistencias || b.pontos - a.pontos || a.jogador.localeCompare(b.jogador)
      );
    } else if (rankingCategoria === "lider-assistencias") {
      ordenadas.sort(
        (a, b) => b.assistencias - a.assistencias || b.gols - a.gols || b.pontos - a.pontos || a.jogador.localeCompare(b.jogador)
      );
    } else {
      ordenadas.sort(
        (a, b) => b.pontos - a.pontos || b.gols - a.gols || b.assistencias - a.assistencias || a.jogador.localeCompare(b.jogador)
      );
    }

    return ordenadas.slice(0, 15).map((item, index) => ({
      posicao: index + 1,
      jogador: item.jogador,
      equipe: item.equipe,
      pontos: Number(item.pontos.toFixed(1)),
      gols: item.gols,
      assistencias: item.assistencias,
      desarmes: item.desarmes,
      cartoes: item.cartoes,
      defesas: item.defesas,
    }));
  }, [campeonato, rankingCategoria, timesNoCampeonato]);

  const escalacaoDoCampeonato = useMemo(() => {
    if (!campeonato) return [];
    const base = getAllPlayerStats(campeonato, timesNoCampeonato);
    return montarEscalacao352(base);
  }, [campeonato, timesNoCampeonato]);

  const equipesFiltradas = useMemo(() => {
    const termo = normalizarTexto(buscaAplicada);

    return equipes.filter((equipe) => {
      const jaEsta = timesNoCampeonato.some((t) => String(t.id) === String(equipe.id));
      if (jaEsta) return false;
      if (!termo) return true;

      return (
        normalizarTexto(equipe.nome).includes(termo) ||
        normalizarTexto(equipe.pais).includes(termo) ||
        normalizarTexto(equipe.plataforma).includes(termo)
      );
    });
  }, [equipes, buscaAplicada, timesNoCampeonato]);

  async function salvarCampeonatoAtualizado(campeonatoAtualizado: Campeonato) {
    try {
      const payload = {
        id: campeonatoAtualizado.id,
        titulo: campeonatoAtualizado.titulo,
        imagem: campeonatoAtualizado.imagem || "",
        numeroparticipantes: campeonatoAtualizado.numeroParticipantes,
        formato: campeonatoAtualizado.formato,
        criadopor: campeonatoAtualizado.criadoPor || "",
        datacriacao: campeonatoAtualizado.dataCriacao || "",
        timeids: campeonatoAtualizado.timeIds || [],
        gruposdata: campeonatoAtualizado.gruposData || [],
        partidas: campeonatoAtualizado.partidas || [],
      };

      const { error } = await supabase.from("campeonatos").upsert(payload, { onConflict: "id" });

      if (error) {
        console.error(error);
        setMensagem("Error saving tournament to database.");
        return;
      }

      setCampeonato(campeonatoAtualizado);
    } catch (error) {
      console.error(error);
      setMensagem("Could not save the tournament.");
    }
  }

  function pesquisarTimes() {
    setBuscaAplicada(buscaTime);
  }

  async function convidarTime(time: Equipe) {
    if (!campeonato) return;

    if (!jogadorLogado?.isAdmin) {
      setMensagem("Only the administrator can invite teams.");
      return;
    }

    const limite = Math.min(MAX_TIMES, Number(campeonato.numeroParticipantes || 0));
    const idsAtuais = campeonato.timeIds || [];

    if (idsAtuais.length >= limite) {
      setMensagem("This tournament has reached the participant limit.");
      return;
    }

    const existe = idsAtuais.some((id) => String(id) === String(time.id));
    if (existe) {
      setMensagem("This team is already in the tournament.");
      return;
    }

    const atualizado: Campeonato = {
      ...campeonato,
      timeIds: [...idsAtuais, String(time.id)],
    };

    await salvarCampeonatoAtualizado(atualizado);
    setMensagem(`Team "${time.nome}" added successfully.`);
  }

  async function removerTime(timeId: string) {
    if (!campeonato) return;

    const atualizado: Campeonato = {
      ...campeonato,
      timeIds: (campeonato.timeIds || []).filter((id) => String(id) !== String(timeId)),
      gruposData: (campeonato.gruposData || []).map((grupo) => ({
        ...grupo,
        timeIds: grupo.timeIds.filter((id) => String(id) !== String(timeId)),
      })),
      partidas: (campeonato.partidas || []).filter(
        (p) => String(p.mandanteId) !== String(timeId) && String(p.visitanteId) !== String(timeId)
      ),
    };

    await salvarCampeonatoAtualizado(atualizado);
    setMensagem("Team removed from the tournament.");
  }

  async function excluirCampeonato() {
    if (!campeonato) return;
    if (!jogadorLogado?.isAdmin) return;

    const confirmar = window.confirm(`Delete tournament "${campeonato.titulo}"?`);
    if (!confirmar) return;

    const { error } = await supabase.from("campeonatos").delete().eq("id", campeonato.id);

    if (error) {
      console.error(error);
      setMensagem("Error deleting tournament.");
      return;
    }

    router.push("/");
  }

  async function sortearTimesNosGrupos() {
    if (!campeonato) return;
    if (!jogadorLogado?.isAdmin) return;

    const times = shuffleArray(timesNoCampeonato);
    if (times.length < 2) {
      setMensagem("Add more teams before drawing groups.");
      return;
    }

    if (campeonato.formato === "eliminatorias") {
      setMensagem("In knockout mode, use generate matches to create the bracket.");
      return;
    }

    const quantidadeGrupos = campeonato.formato === "pontos-corridos" ? 1 : getNumeroGrupos(times.length);

    const gruposData: GrupoData[] = Array.from({ length: quantidadeGrupos }).map((_, index) => ({
      nome: campeonato.formato === "pontos-corridos" ? "League Table" : `Group ${index + 1}`,
      timeIds: [],
    }));

    times.forEach((time, index) => {
      gruposData[index % quantidadeGrupos].timeIds.push(String(time.id));
    });

    const atualizado: Campeonato = {
      ...campeonato,
      gruposData,
      partidas: (campeonato.partidas || []).filter((p) => p.fase !== "grupos"),
    };

    await salvarCampeonatoAtualizado(atualizado);
    setGrupoSelecionado(gruposData[0]?.nome || "Group 1");
    setRodadaSelecionada(1);
    setMensagem("Teams drawn successfully.");
  }

  async function gerarPartidasCampeonato() {
    if (!campeonato) return;
    if (!jogadorLogado?.isAdmin) return;

    if (campeonato.formato === "eliminatorias") {
      const atualizado = gerarMataMataPuro(campeonato, timesNoCampeonato);
      await salvarCampeonatoAtualizado(atualizado);
      setMensagem("Knockout matches generated successfully.");
      return;
    }

    const gruposData = campeonato.gruposData || [];
    if (!gruposData.length) {
      setMensagem("Draw teams first.");
      return;
    }

    const partidasGrupos = gruposData.flatMap((grupo) => criarPartidasRoundRobin(grupo.nome, grupo.timeIds, timesNoCampeonato));

    const atualizado: Campeonato = {
      ...campeonato,
      partidas: [...(campeonato.partidas || []).filter((p) => p.fase !== "grupos"), ...partidasGrupos],
    };

    await salvarCampeonatoAtualizado(atualizado);
    setRodadaSelecionada(1);
    setMensagem("Matches generated successfully.");
  }

  function abrirPartida(partida: Partida) {
    const mandante = timesNoCampeonato.find((t) => String(t.id) === String(partida.mandanteId)) || null;
    const visitante = timesNoCampeonato.find((t) => String(t.id) === String(partida.visitanteId)) || null;

    setPartidaSelecionada(partida);
    setPlacarMandanteEdicao(partida.golsMandante || 0);
    setPlacarVisitanteEdicao(partida.golsVisitante || 0);
    setStatsMandanteEdicao(
      partida.estatisticasMandante?.length
        ? partida.estatisticasMandante.map((item) => ({ ...item, posicao: getPosicaoExibicao(item.posicao) }))
        : gerarEstatisticasVazias(mandante)
    );
    setStatsVisitanteEdicao(
      partida.estatisticasVisitante?.length
        ? partida.estatisticasVisitante.map((item) => ({ ...item, posicao: getPosicaoExibicao(item.posicao) }))
        : gerarEstatisticasVazias(visitante)
    );
  }

  function atualizarStat(lado: "mandante" | "visitante", index: number, campo: keyof EstatisticaJogador, valor: string | number) {
    const lista = lado === "mandante" ? [...statsMandanteEdicao] : [...statsVisitanteEdicao];

    lista[index] = {
      ...lista[index],
      [campo]: campo === "jogadorId" || campo === "jogadorNome" || campo === "posicao" ? String(valor) : Number(valor),
    };

    if (lado === "mandante") setStatsMandanteEdicao(lista);
    else setStatsVisitanteEdicao(lista);
  }

  async function salvarResultadoPartida() {
    if (!campeonato || !partidaSelecionada) return;
    if (!jogadorLogado?.isAdmin) return;

    let atualizado: Campeonato = {
      ...campeonato,
      partidas: (campeonato.partidas || []).map((p) =>
        String(p.id) === String(partidaSelecionada.id)
          ? {
              ...p,
              golsMandante: placarMandanteEdicao,
              golsVisitante: placarVisitanteEdicao,
              status: "finalizado",
              estatisticasMandante: statsMandanteEdicao.map((item) => ({ ...item, posicao: getPosicaoExibicao(item.posicao) })),
              estatisticasVisitante: statsVisitanteEdicao.map((item) => ({ ...item, posicao: getPosicaoExibicao(item.posicao) })),
            }
          : p
      ),
    };

    atualizado = gerarMataMataMistoAutomatico(atualizado, timesNoCampeonato);
    atualizado = avancarMataMata(atualizado, timesNoCampeonato);

    await salvarCampeonatoAtualizado(atualizado);
    setMensagem("Result saved successfully and ranking updated.");
    setPartidaSelecionada(null);
  }

  function renderRankingHeaders() {
    if (rankingCategoria === "artilheiro") {
      return (
        <tr style={tableHeadRowStyle}>
          <th style={thStyle}>#</th>
          <th style={thStyle}>Players</th>
          <th style={thStyle}>Team</th>
          <th style={thStyle}>Goals</th>
        </tr>
      );
    }

    if (rankingCategoria === "lider-assistencias") {
      return (
        <tr style={tableHeadRowStyle}>
          <th style={thStyle}>#</th>
          <th style={thStyle}>Players</th>
          <th style={thStyle}>Team</th>
          <th style={thStyle}>Assists</th>
        </tr>
      );
    }

    return (
      <tr style={tableHeadRowStyle}>
        <th style={thStyle}>#</th>
        <th style={thStyle}>Players</th>
        <th style={thStyle}>Team</th>
        <th style={thStyle}>PTS</th>
        <th style={thStyle}>Goals</th>
        <th style={thStyle}>Assists</th>
        <th style={thStyle}>Tackles</th>
        <th style={thStyle}>Cards</th>
        <th style={thStyle}>Saves</th>
      </tr>
    );
  }

  function renderRankingRow(row: RankingRow) {
    if (rankingCategoria === "artilheiro") {
      return (
        <tr key={`ranking-${row.posicao}-${row.jogador}`}>
          <td style={tdStyle}>{row.posicao}</td>
          <td style={tdStyle}>{row.jogador}</td>
          <td style={tdStyle}>{row.equipe}</td>
          <td style={tdStyle}>{row.gols}</td>
        </tr>
      );
    }

    if (rankingCategoria === "lider-assistencias") {
      return (
        <tr key={`ranking-${row.posicao}-${row.jogador}`}>
          <td style={tdStyle}>{row.posicao}</td>
          <td style={tdStyle}>{row.jogador}</td>
          <td style={tdStyle}>{row.equipe}</td>
          <td style={tdStyle}>{row.assistencias}</td>
        </tr>
      );
    }

    return (
      <tr key={`ranking-${row.posicao}-${row.jogador}`}>
        <td style={tdStyle}>{row.posicao}</td>
        <td style={tdStyle}>{row.jogador}</td>
        <td style={tdStyle}>{row.equipe}</td>
        <td style={tdStyle}>{row.pontos}</td>
        <td style={tdStyle}>{row.gols}</td>
        <td style={tdStyle}>{row.assistencias}</td>
        <td style={tdStyle}>{row.desarmes}</td>
        <td style={tdStyle}>{row.cartoes}</td>
        <td style={tdStyle}>{row.defesas}</td>
      </tr>
    );
  }

  const campeao = campeonato ? getCampeao(campeonato, timesNoCampeonato) : null;

  if (carregando) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <Link href="/" style={backLinkStyle}>← Back</Link>
          <div style={sectionStyle}>Loading tournament...</div>
        </div>
      </main>
    );
  }

  if (!campeonato) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <Link href="/" style={backLinkStyle}>← Back</Link>
          <div style={sectionStyle}>Tournament not found.</div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <Link href="/" style={backLinkStyle}>← Back</Link>

        <section style={heroStyle}>
          <div style={heroGlowStyle} />
          <div style={heroGridStyle}>
            <div style={posterBoxStyle}>
              {campeonato.imagem ? <img src={campeonato.imagem} alt={campeonato.titulo} style={posterImgStyle} /> : null}
            </div>

            <div>
              <div style={eyebrowStyle}>EUROPA LEAGUE STYLE TOURNAMENT</div>
              <h1 style={titleStyle}>{campeonato.titulo}</h1>
              <div style={formatBadgeStyle}>{getFormatoLabel(campeonato.formato)}</div>

              <div style={infoGridStyle}>
                <div style={infoCardStyle}><strong>Teams</strong><span>{Math.min(MAX_TIMES, campeonato.numeroParticipantes)}</span></div>
                <div style={infoCardStyle}><strong>Current Teams</strong><span>{timesNoCampeonato.length}</span></div>
                <div style={infoCardStyle}><strong>Start</strong><span>{campeonato.dataCriacao || "-"}</span></div>
                <div style={infoCardStyle}><strong>Default XI</strong><span>3-5-2</span></div>
              </div>

              <div style={tabsWrapStyle}>
                {visibleTabs.includes("grupos") && <button onClick={() => setTabAtiva("grupos")} style={tabButtonStyle(tabAtiva === "grupos")}>Groups</button>}
                {visibleTabs.includes("mata-mata") && <button onClick={() => setTabAtiva("mata-mata")} style={tabButtonStyle(tabAtiva === "mata-mata")}>Knockout</button>}
                <button onClick={() => setTabAtiva("ranking")} style={tabButtonStyle(tabAtiva === "ranking")}>Ranking</button>
                <button onClick={() => setTabAtiva("trofeus")} style={tabButtonStyle(tabAtiva === "trofeus")}>Trophies</button>
              </div>

              {jogadorLogado?.isAdmin && (
                <div style={adminActionsStyle}>
                  <button onClick={excluirCampeonato} style={dangerButtonStyle}>Delete Tournament</button>
                  {(campeonato.formato === "pontos-corridos" || campeonato.formato === "pontos-corridos-eliminatorias") && (
                    <>
                      <button onClick={sortearTimesNosGrupos} style={actionButtonStyle}>Draw Teams</button>
                      <button onClick={gerarPartidasCampeonato} style={actionButtonStyle}>Generate Matches</button>
                    </>
                  )}
                  {campeonato.formato === "eliminatorias" && <button onClick={gerarPartidasCampeonato} style={actionButtonStyle}>Generate Matches</button>}
                </div>
              )}

              {mensagem ? <div style={messageStyle}>{mensagem}</div> : null}
            </div>
          </div>
        </section>

        {tabAtiva === "grupos" && visibleTabs.includes("grupos") && (
          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>Groups & Fixtures</h2>
              <span style={sectionPillStyle}>League Stage</span>
            </div>

            <div style={{ display: "grid", gap: 18 }}>
              {grupos.map((grupo) => {
                const totalRodadasDoGrupo =
                  campeonato.formato === "pontos-corridos"
                    ? Math.max(1, ...((campeonato.partidas || []).filter((p) => p.fase === "grupos").map((p) => p.rodada) || [1]))
                    : Math.max(1, ...((campeonato.partidas || []).filter((p) => p.fase === "grupos" && p.grupoNome === grupo.nome).map((p) => p.rodada) || [1]));

                const partidasDoGrupo = (campeonato.partidas || []).filter((p) => {
                  if (campeonato.formato === "pontos-corridos") return p.fase === "grupos" && p.rodada === rodadaSelecionada;
                  return p.fase === "grupos" && p.grupoNome === grupo.nome && p.rodada === rodadaSelecionada;
                });

                return (
                  <div key={grupo.nome} style={boxStyle}>
                    <h3 style={boxTitleStyle}>{grupo.nome}</h3>

                    <div style={tableWrapStyle}>
                      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                        <thead>
                          <tr style={tableHeadRowStyle}>
                            <th style={thStyle}>#</th>
                            <th style={thStyle}>Teams</th>
                            <th style={thStyle}>PTS</th>
                            <th style={thStyle}>P</th>
                            <th style={thStyle}>W</th>
                            <th style={thStyle}>D</th>
                            <th style={thStyle}>L</th>
                            <th style={thStyle}>GF</th>
                            <th style={thStyle}>GA</th>
                            <th style={thStyle}>GD</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grupo.equipes.map((row) => (
                            <tr key={`${grupo.nome}-${row.posicao}`}>
                              <td style={tdStyle}>{row.posicao}</td>
                              <td style={tdStyle}>
                                <div style={teamCellStyle}>
                                  <div style={clubMiniLogoStyle}>{row.equipe?.imagem ? <img src={row.equipe.imagem} alt={row.equipe.nome} style={clubMiniLogoImgStyle} /> : null}</div>
                                  <span>{row.equipe?.nome || ""}</span>
                                </div>
                              </td>
                              <td style={tdStyle}>{row.pontos}</td>
                              <td style={tdStyle}>{row.jogos}</td>
                              <td style={tdStyle}>{row.vitorias}</td>
                              <td style={tdStyle}>{row.empates}</td>
                              <td style={tdStyle}>{row.derrotas}</td>
                              <td style={tdStyle}>{row.golsPro}</td>
                              <td style={tdStyle}>{row.golsContra}</td>
                              <td style={tdStyle}>{row.saldo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginTop: 18 }}>
                      <h3 style={fixtureTitleStyle}>Fixtures</h3>
                      <div style={roundTabsStyle}>
                        {Array.from({ length: totalRodadasDoGrupo }).map((_, index) => {
                          const rodada = index + 1;
                          return (
                            <button
                              key={`${grupo.nome}-round-${rodada}`}
                              onClick={() => {
                                setGrupoSelecionado(grupo.nome);
                                setRodadaSelecionada(rodada);
                              }}
                              style={smallTabStyle(grupoSelecionado === grupo.nome && rodadaSelecionada === rodada)}
                            >
                              Round {rodada}
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ display: "grid", gap: 12 }}>
                        {partidasDoGrupo.map((partida) => {
                          const mandante = timesNoCampeonato.find((t) => String(t.id) === String(partida.mandanteId)) || null;
                          const visitante = timesNoCampeonato.find((t) => String(t.id) === String(partida.visitanteId)) || null;

                          return (
                            <button key={partida.id} onClick={() => abrirPartida(partida)} style={matchCardStyle}>
                              <div style={matchRowStyle}>
                                <div style={matchLogoBoxStyle}>{mandante?.imagem ? <img src={mandante.imagem} alt={mandante.nome} style={matchLogoImgStyle} /> : null}</div>
                                <div style={matchHomeNameStyle}>{mandante?.nome || "Team"}</div>
                                <div style={matchScoreStyle}>{partida.status === "finalizado" ? `${partida.golsMandante} x ${partida.golsVisitante}` : "0 x 0"}</div>
                                <div style={matchAwayNameStyle}>{visitante?.nome || "Team"}</div>
                                <div style={matchLogoBoxStyle}>{visitante?.imagem ? <img src={visitante.imagem} alt={visitante.nome} style={matchLogoImgStyle} /> : null}</div>
                              </div>
                            </button>
                          );
                        })}

                        {partidasDoGrupo.length === 0 && <div style={emptyStateStyle}>No matches generated for this round.</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ ...boxStyle, marginTop: 18 }}>
              <h3 style={boxTitleStyle}>Teams in Tournament</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {timesNoCampeonato.map((time) => (
                  <div key={time.id} style={inviteRowStyle}>
                    <div style={inviteTeamInfoStyle}>
                      <div style={inviteLogoStyle}>{time.imagem ? <img src={time.imagem} alt={time.nome} style={inviteLogoImgStyle} /> : null}</div>
                      <div>
                        <div style={{ fontWeight: 800 }}>{time.nome}</div>
                        <div style={mutedSmallStyle}>{time.pais} • {time.plataforma}</div>
                      </div>
                    </div>

                    {jogadorLogado?.isAdmin && <button onClick={() => removerTime(String(time.id))} style={removeButtonStyle}>Remove</button>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tabAtiva === "mata-mata" && visibleTabs.includes("mata-mata") && (
          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>Knockout Stage</h2>
              <span style={sectionPillStyle}>Road to the Final</span>
            </div>

            {fasesMataMata.length > 0 && (
              <div style={roundTabsStyle}>
                {fasesMataMata.map((fase) => (
                  <button key={fase} onClick={() => setFaseAtiva(fase)} style={smallTabStyle(faseAtiva === fase)}>
                    {getFaseLabel(fase)}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: "grid", gap: 14 }}>
              {partidasMataMata.length === 0 ? (
                <div style={emptyStateStyle}>
                  {campeonato.formato === "pontos-corridos-eliminatorias"
                    ? "The knockout stage will be created automatically after all group matches are completed."
                    : "Click generate matches to create the knockout bracket."}
                </div>
              ) : (
                partidasDaFaseAtiva.map((partida, index) => {
                  const mandante = timesNoCampeonato.find((t) => String(t.id) === String(partida.mandanteId)) || null;
                  const visitante = timesNoCampeonato.find((t) => String(t.id) === String(partida.visitanteId)) || null;

                  return (
                    <button key={partida.id} onClick={() => abrirPartida(partida)} style={knockoutCardStyle}>
                      <div style={knockoutPhaseStyle}>{getFaseLabel(partida.faseNome) || `Match ${index + 1}`}</div>
                      <div style={knockoutGridStyle}>
                        <div style={knockoutTeamStyle}>
                          <div style={matchBigLogoStyle}>{mandante?.imagem ? <img src={mandante.imagem} alt={mandante.nome} style={matchLogoImgStyle} /> : null}</div>
                          <div style={{ fontWeight: 800 }}>{mandante?.nome || ""}</div>
                        </div>

                        <div style={scorePillStyle}>{partida.status === "finalizado" ? `${partida.golsMandante} x ${partida.golsVisitante}` : "0 x 0"}</div>

                        <div style={knockoutTeamStyle}>
                          <div style={matchBigLogoStyle}>{visitante?.imagem ? <img src={visitante.imagem} alt={visitante.nome} style={matchLogoImgStyle} /> : null}</div>
                          <div style={{ fontWeight: 800 }}>{visitante?.nome || ""}</div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        )}

        {tabAtiva === "ranking" && (
          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>Tournament Ranking</h2>
              <span style={sectionPillStyle}>{getRankingCategoriaLabel(rankingCategoria)}</span>
            </div>

            <div style={roundTabsStyle}>
              <button onClick={() => setRankingCategoria("goleiro")} style={smallTabStyle(rankingCategoria === "goleiro")}>Goalkeepers</button>
              <button onClick={() => setRankingCategoria("defensores")} style={smallTabStyle(rankingCategoria === "defensores")}>Defenders</button>
              <button onClick={() => setRankingCategoria("meias-defensivos")} style={smallTabStyle(rankingCategoria === "meias-defensivos")}>Defensive Midfielders</button>
              <button onClick={() => setRankingCategoria("meio-campistas")} style={smallTabStyle(rankingCategoria === "meio-campistas")}>Midfielders</button>
              <button onClick={() => setRankingCategoria("atacantes")} style={smallTabStyle(rankingCategoria === "atacantes")}>Forwards</button>
              <button onClick={() => setRankingCategoria("artilheiro")} style={smallTabStyle(rankingCategoria === "artilheiro")}>Top Scorers</button>
              <button onClick={() => setRankingCategoria("lider-assistencias")} style={smallTabStyle(rankingCategoria === "lider-assistencias")}>Assist Leaders</button>
            </div>

            <div style={tableWrapStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: rankingCategoria === "artilheiro" || rankingCategoria === "lider-assistencias" ? 620 : 900 }}>
                <thead>{renderRankingHeaders()}</thead>
                <tbody>{rankingRows.map((row) => renderRankingRow(row))}</tbody>
              </table>
            </div>

            <div style={lineupPanelStyle}>
              <h3 style={boxTitleStyle}>Team of the Tournament</h3>
              <div style={lineupGridStyle}>
                <div>
                  <div style={lineupTitleStyle}>3 - 5 - 2 Formation</div>
                  <div style={campoWrapperStyle}>
                    <div style={campoInternoStyle}>
                      {escalacaoDoCampeonato.map((item) => {
                        const pos = posicoesCampo352[item.slot];
                        if (!pos) return null;

                        return (
                          <div key={item.slot} style={{ ...jogadorCampoStyle, top: pos.top, left: pos.left, transform: pos.transform }}>
                            <div style={camisaCampoStyle}>◆</div>
                            <div style={nomeCampoStyle}>{item.jogador}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={tableWrapStyle}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={tableHeadRowStyle}>
                        <th style={thStyle}>POS</th>
                        <th style={thStyle}>NAME</th>
                        <th style={thStyle}>TEAM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {escalacaoDoCampeonato.map((item) => (
                        <tr key={`lineup-${item.slot}`}>
                          <td style={tdStyle}>{item.posicaoLabel}</td>
                          <td style={tdStyle}>{item.jogador}</td>
                          <td style={tdStyle}>{item.equipe}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {tabAtiva === "trofeus" && (
          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>Trophies</h2>
              <span style={sectionPillStyle}>Champion</span>
            </div>

            {!campeao ? (
              <div style={emptyStateStyle}>The champion will appear automatically after the final or after all league matches are completed.</div>
            ) : (
              <div style={championCardStyle}>
                <div style={championLogoStyle}>{campeao.imagem ? <img src={campeao.imagem} alt={campeao.nome} style={championLogoImgStyle} /> : null}</div>
                <div>
                  <div style={championLabelStyle}>Tournament Champion</div>
                  <div style={championNameStyle}>{campeao.nome}</div>
                  <div style={mutedSmallStyle}>{campeao.pais} • {campeao.plataforma}</div>
                </div>
              </div>
            )}
          </section>
        )}

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>Invitation Management</h2>
            <span style={sectionPillStyle}>{vagasRestantes} slots left</span>
          </div>

          <div style={searchGridStyle}>
            <input value={buscaTime} onChange={(e) => setBuscaTime(e.target.value)} placeholder="Search team by name, country or platform" style={inputStyle} />
            <button onClick={pesquisarTimes} style={actionButtonStyle}>Search</button>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {equipesFiltradas.map((time) => (
              <div key={time.id} style={inviteRowStyle}>
                <div style={inviteTeamInfoStyle}>
                  <div style={inviteLogoStyle}>{time.imagem ? <img src={time.imagem} alt={time.nome} style={inviteLogoImgStyle} /> : null}</div>
                  <div>
                    <div style={{ fontWeight: 800 }}>{time.nome}</div>
                    <div style={mutedSmallStyle}>{time.pais} • {time.plataforma}</div>
                  </div>
                </div>

                <button onClick={() => convidarTime(time)} style={actionButtonStyle}>Invite</button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {partidaSelecionada && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0 }}>Edit Match</h3>
              <button onClick={() => setPartidaSelecionada(null)} style={closeButtonStyle}>Close</button>
            </div>

            {(() => {
              const mandante = timesNoCampeonato.find((t) => String(t.id) === String(partidaSelecionada.mandanteId)) || null;
              const visitante = timesNoCampeonato.find((t) => String(t.id) === String(partidaSelecionada.visitanteId)) || null;

              return (
                <>
                  <div style={editScoreGridStyle}>
                    <div style={{ textAlign: "center" }}>
                      <div style={editTeamNameStyle}>{mandante?.nome || ""}</div>
                      <input type="number" value={placarMandanteEdicao} onChange={(e) => setPlacarMandanteEdicao(Number(e.target.value))} style={scoreInputStyle} />
                    </div>

                    <div style={scoreXStyle}>x</div>

                    <div style={{ textAlign: "center" }}>
                      <div style={editTeamNameStyle}>{visitante?.nome || ""}</div>
                      <input type="number" value={placarVisitanteEdicao} onChange={(e) => setPlacarVisitanteEdicao(Number(e.target.value))} style={scoreInputStyle} />
                    </div>
                  </div>

                  <div style={statsGridStyle}>
                    <div style={statsBoxStyle}>
                      <div style={statsBoxTitleStyle}>{mandante?.nome || ""}</div>
                      <div style={statsHeaderStyle}><span>Name</span><span>Pos</span><span>G</span><span>A</span><span>TK</span><span>C</span><span>SV</span></div>
                      <div style={{ display: "grid", gap: 8 }}>
                        {statsMandanteEdicao.map((stat, index) => (
                          <div key={`${stat.jogadorId}-${index}`} style={statsRowStyle}>
                            <input value={stat.jogadorNome} disabled style={statInputNameStyle} />
                            <input value={getPosicaoExibicao(stat.posicao)} disabled style={statInputPosStyle} />
                            <input type="number" value={stat.gols} onChange={(e) => atualizarStat("mandante", index, "gols", e.target.value)} style={statInputMiniStyle} />
                            <input type="number" value={stat.assistencias} onChange={(e) => atualizarStat("mandante", index, "assistencias", e.target.value)} style={statInputMiniStyle} />
                            <input type="number" value={stat.desarmes} onChange={(e) => atualizarStat("mandante", index, "desarmes", e.target.value)} style={statInputMiniStyle} />
                            <input type="number" value={stat.cartoes} onChange={(e) => atualizarStat("mandante", index, "cartoes", e.target.value)} style={statInputMiniStyle} />
                            <input type="number" value={stat.defesas} onChange={(e) => atualizarStat("mandante", index, "defesas", e.target.value)} style={statInputMiniStyle} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={statsBoxStyle}>
                      <div style={statsBoxTitleStyle}>{visitante?.nome || ""}</div>
                      <div style={statsHeaderStyle}><span>Name</span><span>Pos</span><span>G</span><span>A</span><span>TK</span><span>C</span><span>SV</span></div>
                      <div style={{ display: "grid", gap: 8 }}>
                        {statsVisitanteEdicao.map((stat, index) => (
                          <div key={`${stat.jogadorId}-${index}`} style={statsRowStyle}>
                            <input value={stat.jogadorNome} disabled style={statInputNameStyle} />
                            <input value={getPosicaoExibicao(stat.posicao)} disabled style={statInputPosStyle} />
                            <input type="number" value={stat.gols} onChange={(e) => atualizarStat("visitante", index, "gols", e.target.value)} style={statInputMiniStyle} />
                            <input type="number" value={stat.assistencias} onChange={(e) => atualizarStat("visitante", index, "assistencias", e.target.value)} style={statInputMiniStyle} />
                            <input type="number" value={stat.desarmes} onChange={(e) => atualizarStat("visitante", index, "desarmes", e.target.value)} style={statInputMiniStyle} />
                            <input type="number" value={stat.cartoes} onChange={(e) => atualizarStat("visitante", index, "cartoes", e.target.value)} style={statInputMiniStyle} />
                            <input type="number" value={stat.defesas} onChange={(e) => atualizarStat("visitante", index, "defesas", e.target.value)} style={statInputMiniStyle} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={modalFooterStyle}>
                    <button onClick={salvarResultadoPartida} style={actionButtonStyle}>Save Result</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </main>
  );
}

const ORANGE = "#ff6900";
const ORANGE_DARK = "#c44700";
const BLACK = "#050505";
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
  overflowX: "hidden",
};

const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1180px",
  margin: "0 auto",
  boxSizing: "border-box",
  overflowX: "hidden",
};

const backLinkStyle: CSSProperties = {
  display: "inline-block",
  color: ORANGE,
  textDecoration: "none",
  fontWeight: 800,
  marginBottom: 18,
};

const heroStyle: CSSProperties = {
  position: "relative",
  background: "linear-gradient(135deg, rgba(255,105,0,0.22), rgba(5,5,5,0.98) 38%, rgba(15,15,18,1))",
  border: `1px solid rgba(255,105,0,0.35)`,
  borderRadius: 28,
  padding: 24,
  marginBottom: 24,
  width: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "0 24px 80px rgba(255,105,0,0.12)",
};

const heroGlowStyle: CSSProperties = {
  position: "absolute",
  width: 240,
  height: 240,
  borderRadius: "50%",
  background: "rgba(255,105,0,0.18)",
  filter: "blur(40px)",
  right: -80,
  top: -90,
  pointerEvents: "none",
};

const heroGridStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateColumns: "140px 1fr",
  gap: 22,
  alignItems: "start",
};

const sectionStyle: CSSProperties = {
  background: "linear-gradient(180deg, rgba(18,18,22,0.98), rgba(5,5,5,0.98))",
  border: `1px solid ${LINE}`,
  borderRadius: 24,
  padding: 22,
  marginBottom: 24,
  width: "100%",
  boxSizing: "border-box",
  overflowX: "hidden",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 18,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  letterSpacing: "-0.02em",
};

const sectionPillStyle: CSSProperties = {
  border: `1px solid rgba(255,105,0,0.55)`,
  color: ORANGE,
  borderRadius: 999,
  padding: "7px 12px",
  fontWeight: 800,
  fontSize: 12,
  textTransform: "uppercase",
};

const boxStyle: CSSProperties = {
  background: PANEL,
  border: `1px solid ${LINE}`,
  borderRadius: 20,
  padding: 18,
  width: "100%",
  boxSizing: "border-box",
};

const boxTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 14,
  fontSize: 20,
};

const posterBoxStyle: CSSProperties = {
  width: 124,
  height: 176,
  borderRadius: 20,
  background: "linear-gradient(135deg, #1a1a1a, #050505)",
  overflow: "hidden",
  border: `1px solid rgba(255,105,0,0.32)`,
  boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
};

const posterImgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const eyebrowStyle: CSSProperties = {
  color: ORANGE,
  fontWeight: 900,
  letterSpacing: "0.14em",
  fontSize: 12,
  marginBottom: 8,
};

const titleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 10,
  fontSize: "clamp(30px, 5vw, 54px)",
  lineHeight: 1,
};

const formatBadgeStyle: CSSProperties = {
  display: "inline-flex",
  color: "#080808",
  background: ORANGE,
  fontWeight: 900,
  padding: "8px 13px",
  borderRadius: 999,
  marginBottom: 14,
};

const infoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: 10,
  marginTop: 10,
};

const infoCardStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(0,0,0,0.25)",
  borderRadius: 16,
  padding: 12,
  display: "grid",
  gap: 5,
  color: MUTED,
};

const tabsWrapStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 18,
};

const adminActionsStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 14,
};

const messageStyle: CSSProperties = {
  marginTop: 12,
  color: "#fff",
  background: "rgba(255,105,0,0.11)",
  border: "1px solid rgba(255,105,0,0.22)",
  borderRadius: 14,
  padding: "10px 12px",
};

function tabButtonStyle(active: boolean): CSSProperties {
  return {
    background: active ? ORANGE : "rgba(0,0,0,0.15)",
    color: active ? "#080808" : "#fff",
    border: `1px solid ${active ? ORANGE : "rgba(255,105,0,0.55)"}`,
    borderRadius: 999,
    padding: "10px 16px",
    fontWeight: 900,
    cursor: "pointer",
  };
}

function smallTabStyle(active: boolean): CSSProperties {
  return {
    background: active ? ORANGE : "transparent",
    color: active ? "#080808" : "#fff",
    border: `1px solid ${active ? ORANGE : "rgba(255,105,0,0.55)"}`,
    borderRadius: 999,
    padding: "8px 12px",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 13,
  };
}

const actionButtonStyle: CSSProperties = {
  background: ORANGE,
  color: "#080808",
  border: "none",
  borderRadius: 13,
  padding: "10px 14px",
  fontWeight: 900,
  cursor: "pointer",
};

const dangerButtonStyle: CSSProperties = {
  background: "rgba(156, 31, 31, 0.35)",
  color: "#fff",
  border: "1px solid rgba(255,105,0,0.6)",
  borderRadius: 13,
  padding: "10px 14px",
  fontWeight: 900,
  cursor: "pointer",
};

const removeButtonStyle: CSSProperties = {
  background: "transparent",
  color: ORANGE,
  border: `1px solid ${ORANGE}`,
  borderRadius: 12,
  padding: "8px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const inputStyle: CSSProperties = {
  width: "100%",
  background: "#09090b",
  color: "#fff",
  border: "1px solid #2d2826",
  borderRadius: 13,
  padding: "12px 14px",
  outline: "none",
  boxSizing: "border-box",
};

const tableWrapStyle: CSSProperties = {
  width: "100%",
  overflowX: "auto",
  overflowY: "hidden",
  borderRadius: 16,
  border: `1px solid ${LINE}`,
  boxSizing: "border-box",
  background: "#070707",
  WebkitOverflowScrolling: "touch",
};

const tableHeadRowStyle: CSSProperties = {
  background: "linear-gradient(90deg, rgba(255,105,0,0.22), rgba(12,12,12,1))",
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "14px 12px",
  color: "#f2e8e0",
  fontSize: 13,
  borderBottom: "1px solid #272020",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid #171316",
  color: "#fff",
  fontSize: 14,
  whiteSpace: "nowrap",
};

const teamCellStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const clubMiniLogoStyle: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 9,
  background: "#111",
  overflow: "hidden",
  flexShrink: 0,
  border: "1px solid rgba(255,105,0,0.2)",
};

const clubMiniLogoImgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const fixtureTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
};

const roundTabsStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 16,
};

const matchCardStyle: CSSProperties = {
  width: "100%",
  border: "1px solid rgba(255,105,0,0.18)",
  borderRadius: 18,
  padding: 16,
  background: "linear-gradient(90deg, rgba(255,105,0,0.08), rgba(7,7,7,1))",
  color: "#fff",
  cursor: "pointer",
  boxSizing: "border-box",
};

const matchRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "42px 1fr auto 1fr 42px",
  gap: 10,
  alignItems: "center",
};

const matchLogoBoxStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 12,
  background: "#111",
  overflow: "hidden",
  border: "1px solid rgba(255,105,0,0.22)",
};

const matchBigLogoStyle: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 13,
  background: "#111",
  overflow: "hidden",
  margin: "0 auto 10px",
  border: "1px solid rgba(255,105,0,0.28)",
};

const matchLogoImgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const matchHomeNameStyle: CSSProperties = {
  textAlign: "left",
  fontWeight: 800,
};

const matchAwayNameStyle: CSSProperties = {
  textAlign: "right",
  fontWeight: 800,
};

const matchScoreStyle: CSSProperties = {
  minWidth: 90,
  textAlign: "center",
  fontWeight: 900,
  fontSize: 22,
  color: ORANGE,
};

const knockoutCardStyle: CSSProperties = {
  ...matchCardStyle,
  padding: 18,
};

const knockoutPhaseStyle: CSSProperties = {
  color: ORANGE,
  marginBottom: 12,
  textAlign: "center",
  fontWeight: 900,
  textTransform: "uppercase",
  fontSize: 12,
  letterSpacing: "0.08em",
};

const knockoutGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  gap: 18,
  alignItems: "center",
};

const knockoutTeamStyle: CSSProperties = {
  textAlign: "center",
};

const scorePillStyle: CSSProperties = {
  background: ORANGE,
  color: "#080808",
  padding: "8px 18px",
  borderRadius: 999,
  fontWeight: 900,
  minWidth: 110,
  textAlign: "center",
};

const emptyStateStyle: CSSProperties = {
  color: MUTED,
  background: "rgba(255,255,255,0.03)",
  border: "1px dashed rgba(255,105,0,0.25)",
  borderRadius: 16,
  padding: 16,
};

const inviteRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  border: `1px solid ${LINE}`,
  borderRadius: 18,
  padding: 14,
  background: "#08080b",
  width: "100%",
  boxSizing: "border-box",
};

const inviteTeamInfoStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
};

const inviteLogoStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 12,
  background: "#111",
  overflow: "hidden",
  border: "1px solid rgba(255,105,0,0.24)",
};

const inviteLogoImgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const mutedSmallStyle: CSSProperties = {
  color: MUTED,
  fontSize: 13,
};

const searchGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 10,
  marginBottom: 16,
};

const championCardStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  background: "linear-gradient(135deg, rgba(255,105,0,0.18), #070707)",
  border: "1px solid rgba(255,105,0,0.32)",
  borderRadius: 20,
  padding: 18,
  maxWidth: 560,
};

const championLogoStyle: CSSProperties = {
  width: 76,
  height: 76,
  borderRadius: 16,
  overflow: "hidden",
  background: "#111",
  flexShrink: 0,
  border: "1px solid rgba(255,105,0,0.28)",
};

const championLogoImgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const championLabelStyle: CSSProperties = {
  color: ORANGE,
  fontWeight: 900,
  marginBottom: 4,
  textTransform: "uppercase",
  fontSize: 12,
  letterSpacing: "0.08em",
};

const championNameStyle: CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
};

const lineupPanelStyle: CSSProperties = {
  marginTop: 24,
  background: PANEL,
  border: `1px solid ${LINE}`,
  borderRadius: 20,
  padding: 18,
};

const lineupGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 18,
  alignItems: "start",
  width: "100%",
};

const lineupTitleStyle: CSSProperties = {
  textAlign: "center",
  fontWeight: 900,
  marginBottom: 10,
};

const campoWrapperStyle: CSSProperties = {
  width: "100%",
  maxWidth: 320,
  margin: "0 auto",
  borderRadius: 18,
  overflow: "hidden",
  border: "1px solid rgba(255,105,0,0.3)",
  background: "linear-gradient(180deg, #1c421b 0%, #153515 50%, #1c421b 100%)",
  padding: 8,
  boxSizing: "border-box",
};

const campoInternoStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "0.7 / 1",
  border: "2px solid rgba(255,255,255,0.25)",
  boxSizing: "border-box",
  background: "repeating-linear-gradient(180deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 36px, transparent 36px, transparent 72px)",
};

const jogadorCampoStyle: CSSProperties = {
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
  width: 64,
  textAlign: "center",
};

const camisaCampoStyle: CSSProperties = {
  fontSize: 20,
  lineHeight: 1,
  color: ORANGE,
};

const nomeCampoStyle: CSSProperties = {
  fontSize: 10,
  color: "#fff",
  fontWeight: 800,
  textShadow: "0 1px 2px rgba(0,0,0,0.85)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.78)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  zIndex: 9999,
};

const modalContentStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1180,
  maxHeight: "90vh",
  overflowY: "auto",
  background: BLACK,
  border: "1px solid rgba(255,105,0,0.28)",
  borderRadius: 24,
  padding: 22,
  boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
};

const modalHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 18,
};

const closeButtonStyle: CSSProperties = {
  background: "transparent",
  color: "#fff",
  border: "1px solid #3a302b",
  borderRadius: 10,
  padding: "8px 12px",
  cursor: "pointer",
};

const editScoreGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  gap: 16,
  alignItems: "center",
  marginBottom: 20,
};

const editTeamNameStyle: CSSProperties = {
  fontWeight: 900,
  marginBottom: 8,
};

const scoreInputStyle: CSSProperties = {
  width: 90,
  background: "#0a0a0a",
  color: "#fff",
  border: "1px solid #2f2823",
  borderRadius: 12,
  padding: "12px 14px",
  textAlign: "center",
  fontSize: 20,
  fontWeight: 900,
};

const scoreXStyle: CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  color: ORANGE,
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
};

const statsBoxStyle: CSSProperties = {
  background: PANEL,
  border: `1px solid ${LINE}`,
  borderRadius: 18,
  padding: 16,
  overflowX: "auto",
};

const statsBoxTitleStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: 18,
  marginBottom: 12,
};

const statsHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.8fr 70px repeat(5, 50px)",
  gap: 8,
  marginBottom: 10,
  color: "#f0e6df",
  fontWeight: 900,
  fontSize: 13,
  minWidth: 560,
};

const statsRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.8fr 70px repeat(5, 50px)",
  gap: 8,
  minWidth: 560,
};

const statInputNameStyle: CSSProperties = {
  background: "#121216",
  color: "#fff",
  border: "1px solid #2d2826",
  borderRadius: 10,
  padding: "10px 12px",
};

const statInputPosStyle: CSSProperties = {
  background: "#121216",
  color: "#fff",
  border: "1px solid #2d2826",
  borderRadius: 10,
  padding: "10px 8px",
  width: "100%",
  textAlign: "center",
  fontWeight: 900,
};

const statInputMiniStyle: CSSProperties = {
  background: "#121216",
  color: "#fff",
  border: "1px solid #2d2826",
  borderRadius: 10,
  padding: "10px 12px",
  width: "100%",
};

const modalFooterStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: 18,
};
