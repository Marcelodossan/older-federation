"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type JogadorElenco = {
  jogadorId: string;
  idOnline?: string;
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
  idOnline: string;
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
    pais: item.pais || "Brasil",
    plataforma: item.plataforma || "PC",
    imagem: item.imagem || "",
    instagram: item.instagram || "",
    vitorias: Number(item.vitorias || 0),
    empates: Number(item.empates || 0),
    derrotas: Number(item.derrotas || 0),
    titulos: Number(item.titulos || 0),
    criadoPor: item.criadoPor || "",
    user_id: item.user_id || "",
    elenco: Array.isArray(item.elenco) ? item.elenco : [],
  };
}

function normalizarCampeonato(item: any): Campeonato {
  return {
    id: String(item.id),
    titulo: item.titulo || "Campeonato",
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
      return "Eliminatórias";
    case "pontos-corridos":
      return "Pontos corridos";
    case "pontos-corridos-eliminatorias":
      return "Pontos corridos + eliminatórias";
    default:
      return formato;
  }
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
  if (["ZAG", "ZAGUEIRO"].includes(p)) return "ZAG";
  if (
    ["LAT", "LD", "LE", "LATERAL", "LATERAL DIREITO", "LATERAL ESQUERDO"].includes(
      p
    )
  )
    return "LAT";
  if (["VOL", "VOLANTE", "MEIA DEFENSIVO", "MEIA-DEFENSIVO"].includes(p))
    return "VOL";
  if (["MC", "MEIO CAMPISTA", "MEIO-CAMPISTA"].includes(p)) return "MC";
  if (["MEI", "MEIA"].includes(p)) return "MEI";
  if (["PE", "PONTA ESQUERDA"].includes(p)) return "PE";
  if (["PD", "PONTA DIREITA"].includes(p)) return "PD";
  if (["ATA", "ATACANTE", "CENTROAVANTE", "ST", "CF"].includes(p)) return "ATA";

  return p || "-";
}

function getGrupoRankingPorPosicao(posicao?: string) {
  const p = getPosicaoExibicao(posicao);

  if (p === "GK") return "goleiro";
  if (p === "ZAG" || p === "LAT") return "defensores";
  if (p === "VOL") return "meias-defensivos";
  if (p === "MC" || p === "MEI") return "meio-campistas";
  if (p === "PE" || p === "PD" || p === "ATA") return "atacantes";

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

      const mandante =
        times.find((t) => String(t.id) === String(mandanteId)) || null;
      const visitante =
        times.find((t) => String(t.id) === String(visitanteId)) || null;

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

function buildGroups(
  campeonato: Campeonato,
  times: Equipe[]
): { nome: string; equipes: GrupoRow[] }[] {
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
      (p) =>
        p.fase === "grupos" &&
        p.grupoNome === grupo.nome &&
        p.status === "finalizado"
    );

    partidasGrupo.forEach((p) => {
      const mandante = rows.find(
        (r) => String(r.equipe?.id) === String(p.mandanteId)
      );
      const visitante = rows.find(
        (r) => String(r.equipe?.id) === String(p.visitanteId)
      );

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
      return String(a.equipe?.nome || "").localeCompare(
        String(b.equipe?.nome || "")
      );
    });

    return {
      nome: grupo.nome,
      equipes: rows.map((row, index) => ({
        ...row,
        posicao: index + 1,
      })),
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
      const mandante = rows.find(
        (r) => String(r.equipe?.id) === String(p.mandanteId)
      );
      const visitante = rows.find(
        (r) => String(r.equipe?.id) === String(p.visitanteId)
      );

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
    return String(a.equipe?.nome || "").localeCompare(
      String(b.equipe?.nome || "")
    );
  });

  return rows.map((row, index) => ({
    ...row,
    posicao: index + 1,
  }));
}

function getMapaJogadoresDoCampeonato(times: Equipe[]) {
  const mapa = new Map<
    string,
    {
      equipeNome: string;
      posicao: string;
      jogadorNome: string;
      idOnline: string;
    }
  >();

  times.forEach((time) => {
    (time.elenco || []).forEach((jogador) => {
      mapa.set(String(jogador.jogadorId), {
        equipeNome: time.nome,
        posicao: getPosicaoExibicao(jogador.posicao || ""),
        jogadorNome: jogador.nome,
        idOnline: jogador.idOnline || jogador.nome,
      });
    });
  });

  return mapa;
}

function getAllPlayerStats(campeonato: Campeonato, times: Equipe[]) {
  const mapa = new Map<
    string,
    {
      jogadorId: string;
      jogador: string;
      idOnline: string;
      equipe: string;
      posicao: string;
      gols: number;
      assistencias: number;
      desarmes: number;
      cartoes: number;
      defesas: number;
      pontos: number;
    }
  >();

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
            mapa.get(chave) || {
              jogadorId: String(item.jogadorId),
              jogador: base.jogadorNome || item.jogadorNome,
              idOnline: base.idOnline || base.jogadorNome || item.jogadorNome,
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

function ordenarRankingCategoria(
  itens: RankingPlayerStats[],
  categoria: RankingCategoria
) {
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

function pegarPrimeiroDisponivel(
  lista: RankingPlayerStats[],
  usados: Set<string>
): RankingPlayerStats | null {
  for (const item of lista) {
    if (!usados.has(item.jogadorId)) {
      usados.add(item.jogadorId);
      return item;
    }
  }
  return null;
}

function montarEscalacao352(base: RankingPlayerStats[]): EscalacaoSlot[] {
  const goleiros = ordenarRankingCategoria(base, "goleiro");
  const defensores = ordenarRankingCategoria(base, "defensores");
  const meiasDefensivos = ordenarRankingCategoria(base, "meias-defensivos");
  const meioCampistas = ordenarRankingCategoria(base, "meio-campistas");
  const atacantes = ordenarRankingCategoria(base, "atacantes");

  const usados = new Set<string>();

  const gk = pegarPrimeiroDisponivel(goleiros, usados);

  const zag1 = pegarPrimeiroDisponivel(defensores, usados);
  const zag2 = pegarPrimeiroDisponivel(defensores, usados);
  const zag3 = pegarPrimeiroDisponivel(defensores, usados);

  const vol = pegarPrimeiroDisponivel(meiasDefensivos, usados);

  const mei1 = pegarPrimeiroDisponivel(meioCampistas, usados);
  const mei2 = pegarPrimeiroDisponivel(meioCampistas, usados);

  const ataque1 = pegarPrimeiroDisponivel(atacantes, usados);
  const ataque2 = pegarPrimeiroDisponivel(atacantes, usados);
  const pontaEsquerda = pegarPrimeiroDisponivel(atacantes, usados);
  const pontaDireita = pegarPrimeiroDisponivel(atacantes, usados);

  const montar = (
    slot: string,
    posicaoLabel: string,
    jogador: RankingPlayerStats | null
  ): EscalacaoSlot => ({
    slot,
    posicaoLabel,
    jogador: jogador?.jogador || "-",
    equipe: jogador?.equipe || "-",
  });

  return [
    montar("GK", "GK", gk),
    montar("ZAG-1", "ZAG", zag1),
    montar("ZAG-2", "ZAG", zag2),
    montar("ZAG-3", "ZAG", zag3),
    montar("VOL", "VOL", vol),
    montar("MEI-1", "MEI", mei1),
    montar("MEI-2", "MEI", mei2),
    montar("PD", "PD", pontaDireita),
    montar("PE", "PE", pontaEsquerda),
    montar("ATA-1", "ATA", ataque1),
    montar("ATA-2", "ATA", ataque2),
  ];
}

function getCampeao(campeonato: Campeonato, times: Equipe[]): Equipe | null {
  const partidas = campeonato.partidas || [];

  if (campeonato.formato === "pontos-corridos") {
    const tabela = buildTabelaGeralPontosCorridos(campeonato, times);
    return tabela[0]?.equipe || null;
  }

  const finais = partidas.filter(
    (p) =>
      p.fase === "mata-mata" &&
      p.faseNome === "Final" &&
      p.status === "finalizado"
  );

  if (!finais.length) return null;

  const final = finais[0];
  if (final.golsMandante === final.golsVisitante) return null;

  const campeaoId =
    final.golsMandante > final.golsVisitante
      ? final.mandanteId
      : final.visitanteId;

  return times.find((time) => String(time.id) === String(campeaoId)) || null;
}

function todasPartidasDeGrupoFinalizadas(campeonato: Campeonato) {
  const partidasGrupo = (campeonato.partidas || []).filter(
    (p) => p.fase === "grupos"
  );
  return (
    partidasGrupo.length > 0 &&
    partidasGrupo.every((p) => p.status === "finalizado")
  );
}

function getNomeFaseInicialEliminatorias(totalTimes: number) {
  if (totalTimes >= 16) return "Oitavas de final";
  if (totalTimes >= 8) return "Quartas de final";
  if (totalTimes >= 4) return "Semifinal";
  return "Final";
}

function gerarMataMataPuro(
  campeonato: Campeonato,
  timesBase: Equipe[]
): Campeonato {
  const times = shuffleArray(timesBase);
  if (times.length < 2) return campeonato;

  const partidasExistentes = (campeonato.partidas || []).filter(
    (p) => p.fase === "mata-mata"
  );
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

function gerarMataMataMistoAutomatico(
  campeonato: Campeonato,
  times: Equipe[]
): Campeonato {
  if (campeonato.formato !== "pontos-corridos-eliminatorias") return campeonato;
  if (!todasPartidasDeGrupoFinalizadas(campeonato)) return campeonato;

  const jaTemMataMata = (campeonato.partidas || []).some(
    (p) => p.fase === "mata-mata"
  );
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

    return {
      ...campeonato,
      partidas: [...(campeonato.partidas || []), ...partidas],
    };
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

    return {
      ...campeonato,
      partidas: [...(campeonato.partidas || []), ...partidas],
    };
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

    return {
      ...campeonato,
      partidas: [...(campeonato.partidas || []), ...partidas],
    };
  }

  if (grupos.length === 8) {
    const g1 = grupos[0].equipes;
    const g2 = grupos[1].equipes;
    const g3 = grupos[2].equipes;
    const g4 = grupos[3].equipes;
    const g5 = grupos[4].equipes;
    const g6 = grupos[5].equipes;
    const g7 = grupos[6].equipes;
    const g8 = grupos[7].equipes;

    const confrontos = [
      [g1[0]?.equipe || null, g2[1]?.equipe || null],
      [g2[0]?.equipe || null, g1[1]?.equipe || null],
      [g3[0]?.equipe || null, g4[1]?.equipe || null],
      [g4[0]?.equipe || null, g3[1]?.equipe || null],
      [g5[0]?.equipe || null, g6[1]?.equipe || null],
      [g6[0]?.equipe || null, g5[1]?.equipe || null],
      [g7[0]?.equipe || null, g8[1]?.equipe || null],
      [g8[0]?.equipe || null, g7[1]?.equipe || null],
    ];

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

    return {
      ...campeonato,
      partidas: [...(campeonato.partidas || []), ...partidas],
    };
  }

  return campeonato;
}

function avancarMataMata(campeonato: Campeonato, times: Equipe[]): Campeonato {
  const partidas = campeonato.partidas || [];
  const fasesOrdem = [
    "Oitavas de final",
    "Quartas de final",
    "Semifinal",
    "Final",
  ];

  for (let i = 0; i < fasesOrdem.length; i++) {
    const fase = fasesOrdem[i];
    const partidasDaFase = partidas.filter(
      (p) => p.fase === "mata-mata" && p.faseNome === fase
    );

    if (!partidasDaFase.length) continue;
    if (!partidasDaFase.every((p) => p.status === "finalizado")) {
      return campeonato;
    }

    const proximaFase = fasesOrdem[i + 1];
    if (!proximaFase) return campeonato;

    const jaExisteProxima = partidas.some(
      (p) => p.fase === "mata-mata" && p.faseNome === proximaFase
    );

    if (jaExisteProxima) continue;

    const vencedores = partidasDaFase
      .map((p) => {
        if (p.golsMandante === p.golsVisitante) return null;
        const id =
          p.golsMandante > p.golsVisitante ? p.mandanteId : p.visitanteId;
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

    return {
      ...campeonato,
      partidas: [...partidas, ...novas],
    };
  }

  return campeonato;
}

const posicoesCampo352: Record<
  string,
  { top: string; left: string; transform?: string }
> = {
  GK: { top: "86%", left: "50%", transform: "translate(-50%, -50%)" },
  "ZAG-1": { top: "70%", left: "28%", transform: "translate(-50%, -50%)" },
  "ZAG-2": { top: "70%", left: "50%", transform: "translate(-50%, -50%)" },
  "ZAG-3": { top: "70%", left: "72%", transform: "translate(-50%, -50%)" },
  VOL: { top: "56%", left: "50%", transform: "translate(-50%, -50%)" },
  "MEI-1": { top: "44%", left: "38%", transform: "translate(-50%, -50%)" },
  "MEI-2": { top: "44%", left: "62%", transform: "translate(-50%, -50%)" },
  PE: { top: "48%", left: "12%", transform: "translate(-50%, -50%)" },
  PD: { top: "48%", left: "88%", transform: "translate(-50%, -50%)" },
  "ATA-1": { top: "18%", left: "38%", transform: "translate(-50%, -50%)" },
  "ATA-2": { top: "18%", left: "62%", transform: "translate(-50%, -50%)" },
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
  const [rankingCategoria, setRankingCategoria] =
    useState<RankingCategoria>("goleiro");

  const [faseAtiva, setFaseAtiva] = useState("");
  const [buscaTime, setBuscaTime] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [grupoSelecionado, setGrupoSelecionado] = useState("Grupo 1");
  const [rodadaSelecionada, setRodadaSelecionada] = useState(1);

  const [partidaSelecionada, setPartidaSelecionada] = useState<Partida | null>(
    null
  );
  const [placarMandanteEdicao, setPlacarMandanteEdicao] = useState(0);
  const [placarVisitanteEdicao, setPlacarVisitanteEdicao] = useState(0);
  const [statsMandanteEdicao, setStatsMandanteEdicao] = useState<
    EstatisticaJogador[]
  >([]);
  const [statsVisitanteEdicao, setStatsVisitanteEdicao] = useState<
    EstatisticaJogador[]
  >([]);

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        setMensagem("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const isAdmin =
          normalizarTexto(user?.email) === normalizarTexto(ADMIN_EMAIL);

        setJogadorLogado(
          user
            ? {
                id: user.id,
                nome: user.email?.split("@")[0] || "Usuário",
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
          setEquipes(
            Array.isArray(equipesBanco)
              ? equipesBanco.map(normalizarEquipe)
              : []
          );
        }

        const tabs = getVisibleTabs(campeonatoNormalizado.formato);
        setTabAtiva(tabs[0]);
      } catch (error) {
        console.error(error);
        setMensagem("Erro ao carregar campeonato.");
      } finally {
        setCarregando(false);
      }
    }

    if (campeonatoId) {
      carregarDados();
    }
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
    ? Math.max(
        0,
        Math.min(MAX_TIMES, campeonato.numeroParticipantes) -
          timesNoCampeonato.length
      )
    : 0;

  const grupos = useMemo(() => {
    if (!campeonato) return [];
    if (campeonato.formato === "pontos-corridos") {
      return [
        {
          nome: "Tabela geral",
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
    const fasesUnicas = Array.from(
      new Set((partidasMataMata || []).map((p) => p.faseNome).filter(Boolean))
    ) as string[];

    const ordem = [
      "Oitavas de final",
      "Quartas de final",
      "Semifinal",
      "Final",
    ];

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
        (a, b) =>
          b.gols - a.gols ||
          b.assistencias - a.assistencias ||
          b.pontos - a.pontos ||
          a.jogador.localeCompare(b.jogador)
      );
    } else if (rankingCategoria === "lider-assistencias") {
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

    return ordenadas.slice(0, 15).map((item, index) => ({
      posicao: index + 1,
      jogador: item.idOnline || item.jogador,
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
      const jaEsta = timesNoCampeonato.some(
        (t) => String(t.id) === String(equipe.id)
      );
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

      const { error } = await supabase
        .from("campeonatos")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        console.error(error);
        setMensagem("Erro ao salvar campeonato no banco.");
        return;
      }

      setCampeonato(campeonatoAtualizado);
    } catch (error) {
      console.error(error);
      setMensagem("Não foi possível salvar o campeonato.");
    }
  }

  function pesquisarTimes() {
    setBuscaAplicada(buscaTime);
  }

  async function convidarTime(time: Equipe) {
    if (!campeonato) return;

    if (!jogadorLogado?.isAdmin) {
      setMensagem("Apenas o administrador pode convidar times.");
      return;
    }

    const limite = Math.min(
      MAX_TIMES,
      Number(campeonato.numeroParticipantes || 0)
    );
    const idsAtuais = campeonato.timeIds || [];

    if (idsAtuais.length >= limite) {
      setMensagem("O campeonato já atingiu o limite de participantes.");
      return;
    }

    const existe = idsAtuais.some((id) => String(id) === String(time.id));
    if (existe) {
      setMensagem("Esse time já está no campeonato.");
      return;
    }

    const atualizado: Campeonato = {
      ...campeonato,
      timeIds: [...idsAtuais, String(time.id)],
    };

    await salvarCampeonatoAtualizado(atualizado);
    setMensagem(`Time "${time.nome}" adicionado com sucesso.`);
  }

  async function removerTime(timeId: string) {
    if (!campeonato) return;

    const atualizado: Campeonato = {
      ...campeonato,
      timeIds: (campeonato.timeIds || []).filter(
        (id) => String(id) !== String(timeId)
      ),
      gruposData: (campeonato.gruposData || []).map((grupo) => ({
        ...grupo,
        timeIds: grupo.timeIds.filter((id) => String(id) !== String(timeId)),
      })),
      partidas: (campeonato.partidas || []).filter(
        (p) =>
          String(p.mandanteId) !== String(timeId) &&
          String(p.visitanteId) !== String(timeId)
      ),
    };

    await salvarCampeonatoAtualizado(atualizado);
    setMensagem("Time removido do campeonato.");
  }

  async function excluirCampeonato() {
    if (!campeonato) return;
    if (!jogadorLogado?.isAdmin) return;

    const confirmar = window.confirm(
      `Excluir o campeonato "${campeonato.titulo}"?`
    );
    if (!confirmar) return;

    const { error } = await supabase
      .from("campeonatos")
      .delete()
      .eq("id", campeonato.id);

    if (error) {
      console.error(error);
      setMensagem("Erro ao excluir campeonato.");
      return;
    }

    router.push("/");
  }

  async function sortearTimesNosGrupos() {
    if (!campeonato) return;
    if (!jogadorLogado?.isAdmin) return;

    const times = shuffleArray(timesNoCampeonato);
    if (times.length < 2) {
      setMensagem("Adicione mais times antes de sortear.");
      return;
    }

    if (campeonato.formato === "eliminatorias") {
      setMensagem(
        "No modo eliminatórias, use gerar partidas para montar o mata-mata."
      );
      return;
    }

    const quantidadeGrupos =
      campeonato.formato === "pontos-corridos" ? 1 : getNumeroGrupos(times.length);

    const gruposData: GrupoData[] = Array.from({
      length: quantidadeGrupos,
    }).map((_, index) => ({
      nome:
        campeonato.formato === "pontos-corridos"
          ? "Tabela geral"
          : `Grupo ${index + 1}`,
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
    setGrupoSelecionado(gruposData[0]?.nome || "Grupo 1");
    setRodadaSelecionada(1);
    setMensagem("Times sorteados com sucesso.");
  }

  async function gerarPartidasCampeonato() {
    if (!campeonato) return;
    if (!jogadorLogado?.isAdmin) return;

    if (campeonato.formato === "eliminatorias") {
      const atualizado = gerarMataMataPuro(campeonato, timesNoCampeonato);
      await salvarCampeonatoAtualizado(atualizado);
      setMensagem("Partidas do mata-mata geradas com sucesso.");
      return;
    }

    const gruposData = campeonato.gruposData || [];
    if (!gruposData.length) {
      setMensagem("Primeiro sorteie os times.");
      return;
    }

    const partidasGrupos = gruposData.flatMap((grupo) =>
      criarPartidasRoundRobin(grupo.nome, grupo.timeIds, timesNoCampeonato)
    );

    const atualizado: Campeonato = {
      ...campeonato,
      partidas: [
        ...(campeonato.partidas || []).filter((p) => p.fase !== "grupos"),
        ...partidasGrupos,
      ],
    };

    await salvarCampeonatoAtualizado(atualizado);
    setRodadaSelecionada(1);
    setMensagem("Partidas geradas com sucesso.");
  }

  function abrirPartida(partida: Partida) {
    const mandante =
      timesNoCampeonato.find((t) => String(t.id) === String(partida.mandanteId)) ||
      null;
    const visitante =
      timesNoCampeonato.find(
        (t) => String(t.id) === String(partida.visitanteId)
      ) || null;

    setPartidaSelecionada(partida);
    setPlacarMandanteEdicao(partida.golsMandante || 0);
    setPlacarVisitanteEdicao(partida.golsVisitante || 0);
    setStatsMandanteEdicao(
      partida.estatisticasMandante?.length
        ? partida.estatisticasMandante.map((item) => ({
            ...item,
            posicao: getPosicaoExibicao(item.posicao),
          }))
        : gerarEstatisticasVazias(mandante)
    );
    setStatsVisitanteEdicao(
      partida.estatisticasVisitante?.length
        ? partida.estatisticasVisitante.map((item) => ({
            ...item,
            posicao: getPosicaoExibicao(item.posicao),
          }))
        : gerarEstatisticasVazias(visitante)
    );
  }

  function atualizarStat(
    lado: "mandante" | "visitante",
    index: number,
    campo: keyof EstatisticaJogador,
    valor: string | number
  ) {
    const lista =
      lado === "mandante" ? [...statsMandanteEdicao] : [...statsVisitanteEdicao];

    lista[index] = {
      ...lista[index],
      [campo]:
        campo === "jogadorId" || campo === "jogadorNome" || campo === "posicao"
          ? String(valor)
          : Number(valor),
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
              estatisticasMandante: statsMandanteEdicao.map((item) => ({
                ...item,
                posicao: getPosicaoExibicao(item.posicao),
              })),
              estatisticasVisitante: statsVisitanteEdicao.map((item) => ({
                ...item,
                posicao: getPosicaoExibicao(item.posicao),
              })),
            }
          : p
      ),
    };

    atualizado = gerarMataMataMistoAutomatico(atualizado, timesNoCampeonato);
    atualizado = avancarMataMata(atualizado, timesNoCampeonato);

    await salvarCampeonatoAtualizado(atualizado);
    setMensagem("Resultado salvo com sucesso e ranking atualizado.");
    setPartidaSelecionada(null);
  }

  function renderRankingHeaders() {
    if (rankingCategoria === "artilheiro") {
      return (
        <tr style={{ background: "#0b0b0b" }}>
          <th style={thStyle}>#</th>
          <th style={thStyle}>ID Online</th>
          <th style={thStyle}>Equipe</th>
          <th style={thStyle}>Gols</th>
        </tr>
      );
    }

    if (rankingCategoria === "lider-assistencias") {
      return (
        <tr style={{ background: "#0b0b0b" }}>
          <th style={thStyle}>#</th>
          <th style={thStyle}>ID Online</th>
          <th style={thStyle}>Equipe</th>
          <th style={thStyle}>Assistências</th>
        </tr>
      );
    }

    return (
      <tr style={{ background: "#0b0b0b" }}>
        <th style={thStyle}>#</th>
        <th style={thStyle}>ID Online</th>
        <th style={thStyle}>Equipe</th>
        <th style={thStyle}>PTS</th>
        <th style={thStyle}>Gols</th>
        <th style={thStyle}>Assistências</th>
        <th style={thStyle}>Desarmes</th>
        <th style={thStyle}>Cartões</th>
        <th style={thStyle}>Defesas</th>
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
          <Link href="/" style={backLinkStyle}>
            ← Voltar
          </Link>
          <div style={sectionStyle}>Carregando campeonato...</div>
        </div>
      </main>
    );
  }

  if (!campeonato) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <Link href="/" style={backLinkStyle}>
            ← Voltar
          </Link>
          <div style={sectionStyle}>Campeonato não encontrado.</div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <Link href="/" style={backLinkStyle}>
          ← Voltar
        </Link>

        <section style={sectionStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
              alignItems: "start",
            }}
          >
            <div style={posterBoxStyle}>
              {campeonato.imagem ? (
                <img
                  src={campeonato.imagem}
                  alt={campeonato.titulo}
                  style={posterImgStyle}
                />
              ) : null}
            </div>

            <div>
              <h1 style={{ marginTop: 0, marginBottom: 10 }}>{campeonato.titulo}</h1>
              <div style={{ color: "#ff4fd8", fontWeight: 700, marginBottom: 6 }}>
                Tipo: {getFormatoLabel(campeonato.formato)}
              </div>
              <div style={subInfoStyle}>
                Equipes: {Math.min(MAX_TIMES, campeonato.numeroParticipantes)}
              </div>
              <div style={subInfoStyle}>
                Participantes atuais: {timesNoCampeonato.length}
              </div>
              <div style={subInfoStyle}>Começa: {campeonato.dataCriacao}</div>
              <div style={subInfoStyle}>Formação padrão: 3-5-2</div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                {visibleTabs.includes("grupos") && (
                  <button
                    onClick={() => setTabAtiva("grupos")}
                    style={tabButtonStyle(tabAtiva === "grupos")}
                  >
                    Grupos
                  </button>
                )}
                {visibleTabs.includes("mata-mata") && (
                  <button
                    onClick={() => setTabAtiva("mata-mata")}
                    style={tabButtonStyle(tabAtiva === "mata-mata")}
                  >
                    Mata-mata
                  </button>
                )}
                <button
                  onClick={() => setTabAtiva("ranking")}
                  style={tabButtonStyle(tabAtiva === "ranking")}
                >
                  Ranking
                </button>
                <button
                  onClick={() => setTabAtiva("trofeus")}
                  style={tabButtonStyle(tabAtiva === "trofeus")}
                >
                  Troféus
                </button>
              </div>

              {jogadorLogado?.isAdmin && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                  <button onClick={excluirCampeonato} style={dangerButtonStyle}>
                    Excluir campeonato
                  </button>

                  {(campeonato.formato === "pontos-corridos" ||
                    campeonato.formato === "pontos-corridos-eliminatorias") && (
                    <>
                      <button onClick={sortearTimesNosGrupos} style={actionButtonStyle}>
                        Sortear times
                      </button>
                      <button onClick={gerarPartidasCampeonato} style={actionButtonStyle}>
                        Gerar partidas
                      </button>
                    </>
                  )}

                  {campeonato.formato === "eliminatorias" && (
                    <button onClick={gerarPartidasCampeonato} style={actionButtonStyle}>
                      Gerar partidas
                    </button>
                  )}
                </div>
              )}

              {mensagem ? (
                <div style={{ marginTop: 12, color: "#dcdcdc" }}>{mensagem}</div>
              ) : null}
            </div>
          </div>
        </section>

        {tabAtiva === "grupos" && visibleTabs.includes("grupos") && (
          <section
            style={{
              ...sectionStyle,
              display: "grid",
              gap: 18,
              width: "100%",
              boxSizing: "border-box",
              overflowX: "hidden",
            }}
          >
            {grupos.map((grupo) => {
              const totalRodadasDoGrupo =
                campeonato.formato === "pontos-corridos"
                  ? Math.max(
                      1,
                      ...((campeonato.partidas || [])
                        .filter((p) => p.fase === "grupos")
                        .map((p) => p.rodada) || [1])
                    )
                  : Math.max(
                      1,
                      ...((campeonato.partidas || [])
                        .filter((p) => p.fase === "grupos" && p.grupoNome === grupo.nome)
                        .map((p) => p.rodada) || [1])
                    );

              const partidasDoGrupo = (campeonato.partidas || []).filter((p) => {
                if (campeonato.formato === "pontos-corridos") {
                  return p.fase === "grupos" && p.rodada === rodadaSelecionada;
                }

                return (
                  p.fase === "grupos" &&
                  p.grupoNome === grupo.nome &&
                  p.rodada === rodadaSelecionada
                );
              });

              return (
                <div key={grupo.nome} style={boxStyle}>
                  <h2 style={{ marginTop: 0 }}>{grupo.nome}</h2>

                  <div style={tableWrapStyle}>
                    <table
                      style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}
                    >
                      <thead>
                        <tr style={{ background: "#0b0b0b" }}>
                          <th style={thStyle}>#</th>
                          <th style={thStyle}>Equipes</th>
                          <th style={thStyle}>P</th>
                          <th style={thStyle}>J</th>
                          <th style={thStyle}>V</th>
                          <th style={thStyle}>E</th>
                          <th style={thStyle}>D</th>
                          <th style={thStyle}>GP</th>
                          <th style={thStyle}>GC</th>
                          <th style={thStyle}>SG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.equipes.map((row) => (
                          <tr key={`${grupo.nome}-${row.posicao}`}>
                            <td style={tdStyle}>{row.posicao}</td>
                            <td style={tdStyle}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={clubMiniLogoStyle}>
                                  {row.equipe?.imagem ? (
                                    <img
                                      src={row.equipe.imagem}
                                      alt={row.equipe.nome}
                                      style={clubMiniLogoImgStyle}
                                    />
                                  ) : null}
                                </div>
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
                    <h3 style={{ marginTop: 0, marginBottom: 12 }}>Jogos</h3>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                      {Array.from({ length: totalRodadasDoGrupo }).map((_, index) => {
                        const rodada = index + 1;
                        return (
                          <button
                            key={`${grupo.nome}-rodada-${rodada}`}
                            onClick={() => {
                              setGrupoSelecionado(grupo.nome);
                              setRodadaSelecionada(rodada);
                            }}
                            style={smallTabStyle(
                              grupoSelecionado === grupo.nome &&
                                rodadaSelecionada === rodada
                            )}
                          >
                            {rodada}ª Rodada
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ display: "grid", gap: 12 }}>
                      {partidasDoGrupo.map((partida) => {
                        const mandante =
                          timesNoCampeonato.find(
                            (t) => String(t.id) === String(partida.mandanteId)
                          ) || null;
                        const visitante =
                          timesNoCampeonato.find(
                            (t) => String(t.id) === String(partida.visitanteId)
                          ) || null;

                        return (
                          <button
                            key={partida.id}
                            onClick={() => abrirPartida(partida)}
                            style={matchCardStyle}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "42px 1fr auto 1fr 42px",
                                gap: 10,
                                alignItems: "center",
                              }}
                            >
                              <div style={matchLogoBoxStyle}>
                                {mandante?.imagem ? (
                                  <img
                                    src={mandante.imagem}
                                    alt={mandante.nome}
                                    style={matchLogoImgStyle}
                                  />
                                ) : null}
                              </div>

                              <div style={{ textAlign: "left", fontWeight: 700 }}>
                                {mandante?.nome || "Time"}
                              </div>

                              <div style={matchScoreStyle}>
                                {partida.status === "finalizado"
                                  ? `${partida.golsMandante} x ${partida.golsVisitante}`
                                  : "0 x 0"}
                              </div>

                              <div style={{ textAlign: "right", fontWeight: 700 }}>
                                {visitante?.nome || "Time"}
                              </div>

                              <div style={matchLogoBoxStyle}>
                                {visitante?.imagem ? (
                                  <img
                                    src={visitante.imagem}
                                    alt={visitante.nome}
                                    style={matchLogoImgStyle}
                                  />
                                ) : null}
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      {partidasDoGrupo.length === 0 && (
                        <div style={{ color: "#bdbdbd" }}>Nenhuma partida gerada nesta rodada.</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={boxStyle}>
              <h2 style={{ marginTop: 0 }}>Times no campeonato</h2>

              <div style={{ display: "grid", gap: 10 }}>
                {timesNoCampeonato.map((time) => (
                  <div key={time.id} style={inviteRowStyle}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={inviteLogoStyle}>
                        {time.imagem ? (
                          <img src={time.imagem} alt={time.nome} style={inviteLogoImgStyle} />
                        ) : null}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{time.nome}</div>
                        <div style={{ color: "#bbb", fontSize: 13 }}>
                          {time.pais} • {time.plataforma}
                        </div>
                      </div>
                    </div>

                    {jogadorLogado?.isAdmin && (
                      <button
                        onClick={() => removerTime(String(time.id))}
                        style={removeButtonStyle}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tabAtiva === "mata-mata" && visibleTabs.includes("mata-mata") && (
          <section
            style={{
              ...sectionStyle,
              width: "100%",
              boxSizing: "border-box",
              overflowX: "hidden",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Mata-mata</h2>

            {fasesMataMata.length > 0 && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
                {fasesMataMata.map((fase) => (
                  <button
                    key={fase}
                    onClick={() => setFaseAtiva(fase)}
                    style={smallTabStyle(faseAtiva === fase)}
                  >
                    {fase}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: "grid", gap: 14 }}>
              {partidasMataMata.length === 0 ? (
                <div style={{ color: "#cfcfcf" }}>
                  {campeonato.formato === "pontos-corridos-eliminatorias"
                    ? "O mata-mata será criado automaticamente após o fim da fase de grupos."
                    : "Clique em gerar partidas para montar o mata-mata."}
                </div>
              ) : (
                partidasDaFaseAtiva.map((partida, index) => {
                  const mandante =
                    timesNoCampeonato.find(
                      (t) => String(t.id) === String(partida.mandanteId)
                    ) || null;
                  const visitante =
                    timesNoCampeonato.find(
                      (t) => String(t.id) === String(partida.visitanteId)
                    ) || null;

                  return (
                    <button
                      key={partida.id}
                      onClick={() => abrirPartida(partida)}
                      style={matchCardStyle}
                    >
                      <div style={{ color: "#bdbdbd", marginBottom: 10, textAlign: "center" }}>
                        {partida.faseNome || `Match ${index + 1}`}
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto 1fr",
                          gap: 18,
                          alignItems: "center",
                        }}
                      >
                        <div style={{ textAlign: "center" }}>
                          <div style={matchBigLogoStyle}>
                            {mandante?.imagem ? (
                              <img
                                src={mandante.imagem}
                                alt={mandante.nome}
                                style={matchLogoImgStyle}
                              />
                            ) : null}
                          </div>
                          <div style={{ fontWeight: 700 }}>{mandante?.nome || ""}</div>
                        </div>

                        <div style={{ textAlign: "center" }}>
                          <div style={scorePillStyle}>
                            {partida.status === "finalizado"
                              ? `${partida.golsMandante} x ${partida.golsVisitante}`
                              : "0 x 0"}
                          </div>
                        </div>

                        <div style={{ textAlign: "center" }}>
                          <div style={matchBigLogoStyle}>
                            {visitante?.imagem ? (
                              <img
                                src={visitante.imagem}
                                alt={visitante.nome}
                                style={matchLogoImgStyle}
                              />
                            ) : null}
                          </div>
                          <div style={{ fontWeight: 700 }}>{visitante?.nome || ""}</div>
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
            <h2 style={{ marginTop: 0 }}>Ranking do campeonato</h2>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <button
                onClick={() => setRankingCategoria("goleiro")}
                style={smallTabStyle(rankingCategoria === "goleiro")}
              >
                Goleiro
              </button>
              <button
                onClick={() => setRankingCategoria("defensores")}
                style={smallTabStyle(rankingCategoria === "defensores")}
              >
                Defensores
              </button>
              <button
                onClick={() => setRankingCategoria("meias-defensivos")}
                style={smallTabStyle(rankingCategoria === "meias-defensivos")}
              >
                Meias Defensivos
              </button>
              <button
                onClick={() => setRankingCategoria("meio-campistas")}
                style={smallTabStyle(rankingCategoria === "meio-campistas")}
              >
                Meio campistas
              </button>
              <button
                onClick={() => setRankingCategoria("atacantes")}
                style={smallTabStyle(rankingCategoria === "atacantes")}
              >
                Atacantes
              </button>
              <button
                onClick={() => setRankingCategoria("artilheiro")}
                style={smallTabStyle(rankingCategoria === "artilheiro")}
              >
                Artilheiro
              </button>
              <button
                onClick={() => setRankingCategoria("lider-assistencias")}
                style={smallTabStyle(rankingCategoria === "lider-assistencias")}
              >
                Líder Assistências
              </button>
            </div>

            <div style={tableWrapStyle}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth:
                    rankingCategoria === "artilheiro" ||
                    rankingCategoria === "lider-assistencias"
                      ? 620
                      : 900,
                }}
              >
                <thead>{renderRankingHeaders()}</thead>
                <tbody>{rankingRows.map((row) => renderRankingRow(row))}</tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: 24,
                background: "#070707",
                border: "1px solid #1b1b1b",
                borderRadius: 18,
                padding: 18,
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Escalação do campeonato</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 18,
                  alignItems: "start",
                  width: "100%",
                }}
              >
                <div>
                  <div
                    style={{
                      textAlign: "center",
                      fontWeight: 700,
                      marginBottom: 10,
                    }}
                  >
                    Escalação 3 - 5 - 2
                  </div>

                  <div style={campoWrapperStyle}>
                    <div style={campoInternoStyle}>
                      {escalacaoDoCampeonato.map((item) => {
                        const pos = posicoesCampo352[item.slot];
                        if (!pos) return null;

                        return (
                          <div
                            key={item.slot}
                            style={{
                              ...jogadorCampoStyle,
                              top: pos.top,
                              left: pos.left,
                              transform: pos.transform,
                            }}
                          >
                            <div style={camisaCampoStyle}>👕</div>
                            <div style={nomeCampoStyle}>{item.jogador}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#0b0b0b" }}>
                        <th style={thStyle}>POS</th>
                        <th style={thStyle}>NOME</th>
                        <th style={thStyle}>TIME</th>
                      </tr>
                    </thead>
                    <tbody>
                      {escalacaoDoCampeonato.map((item) => (
                        <tr key={`esc-${item.slot}`}>
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
            <h2 style={{ marginTop: 0 }}>Troféus</h2>

            {!campeao ? (
              <div style={{ color: "#cfcfcf" }}>
                O campeão aparecerá automaticamente ao fim da final ou ao término
                de todos os jogos do pontos corridos.
              </div>
            ) : (
              <div style={championCardStyle}>
                <div style={championLogoStyle}>
                  {campeao.imagem ? (
                    <img
                      src={campeao.imagem}
                      alt={campeao.nome}
                      style={championLogoImgStyle}
                    />
                  ) : null}
                </div>

                <div>
                  <div style={{ color: "#ff4fd8", fontWeight: 800, marginBottom: 4 }}>
                    Campeão do campeonato
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{campeao.nome}</div>
                  <div style={{ color: "#bdbdbd", fontSize: 14 }}>
                    {campeao.pais} • {campeao.plataforma}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>Gerenciamento de convites</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <input
              value={buscaTime}
              onChange={(e) => setBuscaTime(e.target.value)}
              placeholder="Buscar time por nome, país ou plataforma"
              style={inputStyle}
            />
            <button onClick={pesquisarTimes} style={actionButtonStyle}>
              Buscar
            </button>
          </div>

          <div style={{ color: "#cfcfcf", marginBottom: 16 }}>
            Vagas restantes: {vagasRestantes}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {equipesFiltradas.map((time) => (
              <div key={time.id} style={inviteRowStyle}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={inviteLogoStyle}>
                    {time.imagem ? (
                      <img src={time.imagem} alt={time.nome} style={inviteLogoImgStyle} />
                    ) : null}
                  </div>

                  <div>
                    <div style={{ fontWeight: 700 }}>{time.nome}</div>
                    <div style={{ color: "#bbb", fontSize: 13 }}>
                      {time.pais} • {time.plataforma}
                    </div>
                  </div>
                </div>

                <button onClick={() => convidarTime(time)} style={actionButtonStyle}>
                  Convidar
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {partidaSelecionada && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <h3 style={{ margin: 0 }}>Editar partida</h3>
              <button onClick={() => setPartidaSelecionada(null)} style={closeButtonStyle}>
                Fechar
              </button>
            </div>

            {(() => {
              const mandante =
                timesNoCampeonato.find(
                  (t) => String(t.id) === String(partidaSelecionada.mandanteId)
                ) || null;
              const visitante =
                timesNoCampeonato.find(
                  (t) => String(t.id) === String(partidaSelecionada.visitanteId)
                ) || null;

              return (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto 1fr",
                      gap: 16,
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>
                        {mandante?.nome || ""}
                      </div>
                      <input
                        type="number"
                        value={placarMandanteEdicao}
                        onChange={(e) => setPlacarMandanteEdicao(Number(e.target.value))}
                        style={scoreInputStyle}
                      />
                    </div>

                    <div style={{ fontSize: 28, fontWeight: 800 }}>x</div>

                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>
                        {visitante?.nome || ""}
                      </div>
                      <input
                        type="number"
                        value={placarVisitanteEdicao}
                        onChange={(e) => setPlacarVisitanteEdicao(Number(e.target.value))}
                        style={scoreInputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={statsBoxStyle}>
                      <div style={statsBoxTitleStyle}>{mandante?.nome || ""}</div>
                      <div style={statsHeaderStyle}>
                        <span>Nome</span>
                        <span>Pos</span>
                        <span>G</span>
                        <span>A</span>
                        <span>DE</span>
                        <span>C</span>
                        <span>DF</span>
                      </div>

                      <div style={{ display: "grid", gap: 8 }}>
                        {statsMandanteEdicao.map((stat, index) => (
                          <div key={`${stat.jogadorId}-${index}`} style={statsRowStyle}>
                            <input value={stat.jogadorNome} disabled style={statInputNameStyle} />
                            <input
                              value={getPosicaoExibicao(stat.posicao)}
                              disabled
                              style={statInputPosStyle}
                            />
                            <input
                              type="number"
                              value={stat.gols}
                              onChange={(e) =>
                                atualizarStat("mandante", index, "gols", e.target.value)
                              }
                              style={statInputMiniStyle}
                            />
                            <input
                              type="number"
                              value={stat.assistencias}
                              onChange={(e) =>
                                atualizarStat(
                                  "mandante",
                                  index,
                                  "assistencias",
                                  e.target.value
                                )
                              }
                              style={statInputMiniStyle}
                            />
                            <input
                              type="number"
                              value={stat.desarmes}
                              onChange={(e) =>
                                atualizarStat("mandante", index, "desarmes", e.target.value)
                              }
                              style={statInputMiniStyle}
                            />
                            <input
                              type="number"
                              value={stat.cartoes}
                              onChange={(e) =>
                                atualizarStat("mandante", index, "cartoes", e.target.value)
                              }
                              style={statInputMiniStyle}
                            />
                            <input
                              type="number"
                              value={stat.defesas}
                              onChange={(e) =>
                                atualizarStat("mandante", index, "defesas", e.target.value)
                              }
                              style={statInputMiniStyle}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={statsBoxStyle}>
                      <div style={statsBoxTitleStyle}>{visitante?.nome || ""}</div>
                      <div style={statsHeaderStyle}>
                        <span>Nome</span>
                        <span>Pos</span>
                        <span>G</span>
                        <span>A</span>
                        <span>DE</span>
                        <span>C</span>
                        <span>DF</span>
                      </div>

                      <div style={{ display: "grid", gap: 8 }}>
                        {statsVisitanteEdicao.map((stat, index) => (
                          <div key={`${stat.jogadorId}-${index}`} style={statsRowStyle}>
                            <input value={stat.jogadorNome} disabled style={statInputNameStyle} />
                            <input
                              value={getPosicaoExibicao(stat.posicao)}
                              disabled
                              style={statInputPosStyle}
                            />
                            <input
                              type="number"
                              value={stat.gols}
                              onChange={(e) =>
                                atualizarStat("visitante", index, "gols", e.target.value)
                              }
                              style={statInputMiniStyle}
                            />
                            <input
                              type="number"
                              value={stat.assistencias}
                              onChange={(e) =>
                                atualizarStat(
                                  "visitante",
                                  index,
                                  "assistencias",
                                  e.target.value
                                )
                              }
                              style={statInputMiniStyle}
                            />
                            <input
                              type="number"
                              value={stat.desarmes}
                              onChange={(e) =>
                                atualizarStat("visitante", index, "desarmes", e.target.value)
                              }
                              style={statInputMiniStyle}
                            />
                            <input
                              type="number"
                              value={stat.cartoes}
                              onChange={(e) =>
                                atualizarStat("visitante", index, "cartoes", e.target.value)
                              }
                              style={statInputMiniStyle}
                            />
                            <input
                              type="number"
                              value={stat.defesas}
                              onChange={(e) =>
                                atualizarStat("visitante", index, "defesas", e.target.value)
                              }
                              style={statInputMiniStyle}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                    <button onClick={salvarResultadoPartida} style={actionButtonStyle}>
                      Salvar
                    </button>
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

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#000",
  color: "#fff",
  fontFamily: "Arial, sans-serif",
  padding: "24px 12px 40px",
  overflowX: "hidden",
};

const containerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1180px",
  margin: "0 auto",
  boxSizing: "border-box",
  overflowX: "hidden",
};

const backLinkStyle: React.CSSProperties = {
  display: "inline-block",
  color: "#ff4fd8",
  textDecoration: "none",
  fontWeight: 700,
  marginBottom: 18,
};

const sectionStyle: React.CSSProperties = {
  background: "#050505",
  border: "1px solid #161616",
  borderRadius: 22,
  padding: 22,
  marginBottom: 24,
  width: "100%",
  boxSizing: "border-box",
  overflowX: "hidden",
};

const boxStyle: React.CSSProperties = {
  background: "#070707",
  border: "1px solid #1b1b1b",
  borderRadius: 18,
  padding: 18,
  width: "100%",
  boxSizing: "border-box",
};

const posterBoxStyle: React.CSSProperties = {
  width: 114,
  height: 164,
  borderRadius: 16,
  background: "#111",
  overflow: "hidden",
};

const posterImgStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const subInfoStyle: React.CSSProperties = {
  color: "#d7d7d7",
  marginBottom: 6,
};

function tabButtonStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "#ff4fd8" : "transparent",
    color: active ? "#000" : "#fff",
    border: "1px solid #ff4fd8",
    borderRadius: 999,
    padding: "10px 16px",
    fontWeight: 700,
    cursor: "pointer",
  };
}

function smallTabStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "#ff4fd8" : "transparent",
    color: active ? "#000" : "#fff",
    border: "1px solid #ff4fd8",
    borderRadius: 999,
    padding: "8px 12px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
  };
}

const actionButtonStyle: React.CSSProperties = {
  background: "#ff4fd8",
  color: "#000",
  border: "none",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  background: "#7a103f",
  color: "#fff",
  border: "1px solid #ff4fd8",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const removeButtonStyle: React.CSSProperties = {
  background: "transparent",
  color: "#ff4fd8",
  border: "1px solid #ff4fd8",
  borderRadius: 12,
  padding: "8px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0a0a0a",
  color: "#fff",
  border: "1px solid #252525",
  borderRadius: 12,
  padding: "12px 14px",
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  background: "#0a0a0a",
  color: "#fff",
  border: "1px solid #252525",
  borderRadius: 12,
  padding: "12px 14px",
  outline: "none",
};

const tableWrapStyle: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
  overflowY: "hidden",
  borderRadius: 16,
  border: "1px solid #1c1c1c",
  boxSizing: "border-box",
  background: "#070707",
  WebkitOverflowScrolling: "touch",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 12px",
  color: "#bdbdbd",
  fontSize: 13,
  borderBottom: "1px solid #1f1f1f",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid #161616",
  color: "#fff",
  fontSize: 14,
};

const clubMiniLogoStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  background: "#111",
  overflow: "hidden",
  flexShrink: 0,
};

const clubMiniLogoImgStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const matchCardStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #1d1d1d",
  borderRadius: 18,
  padding: 16,
  background: "#070707",
  cursor: "pointer",
  boxSizing: "border-box",
};

const matchLogoBoxStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 10,
  background: "#111",
  overflow: "hidden",
};

const matchBigLogoStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 10,
  background: "#111",
  overflow: "hidden",
  margin: "0 auto 10px",
};

const matchLogoImgStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const matchScoreStyle: React.CSSProperties = {
  minWidth: 90,
  textAlign: "center",
  fontWeight: 800,
  fontSize: 22,
};

const scorePillStyle: React.CSSProperties = {
  background: "#ff4fd8",
  color: "#000",
  padding: "8px 18px",
  borderRadius: 999,
  fontWeight: 800,
  minWidth: 110,
};

const inviteRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  border: "1px solid #1c1c1c",
  borderRadius: 18,
  padding: 14,
  background: "#070707",
  width: "100%",
  boxSizing: "border-box",
};

const inviteLogoStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 10,
  background: "#111",
  overflow: "hidden",
};

const inviteLogoImgStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const championCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  background: "#070707",
  border: "1px solid #1d1d1d",
  borderRadius: 18,
  padding: 18,
  maxWidth: 520,
};

const championLogoStyle: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: 14,
  overflow: "hidden",
  background: "#111",
  flexShrink: 0,
};

const championLogoImgStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  zIndex: 9999,
};

const modalContentStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 1180,
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#050505",
  border: "1px solid #1f1f1f",
  borderRadius: 22,
  padding: 22,
};

const closeButtonStyle: React.CSSProperties = {
  background: "transparent",
  color: "#fff",
  border: "1px solid #303030",
  borderRadius: 10,
  padding: "8px 12px",
  cursor: "pointer",
};

const scoreInputStyle: React.CSSProperties = {
  width: 90,
  background: "#0a0a0a",
  color: "#fff",
  border: "1px solid #252525",
  borderRadius: 12,
  padding: "12px 14px",
  textAlign: "center",
  fontSize: 20,
  fontWeight: 800,
};

const statsBoxStyle: React.CSSProperties = {
  background: "#0b0b0b",
  border: "1px solid #1d1d1d",
  borderRadius: 18,
  padding: 16,
};

const statsBoxTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 18,
  marginBottom: 12,
};

const statsHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.8fr 70px repeat(5, 50px)",
  gap: 8,
  marginBottom: 10,
  color: "#ddd",
  fontWeight: 700,
  fontSize: 13,
};

const statsRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.8fr 70px repeat(5, 50px)",
  gap: 8,
};

const statInputNameStyle: React.CSSProperties = {
  background: "#121212",
  color: "#fff",
  border: "1px solid #252525",
  borderRadius: 10,
  padding: "10px 12px",
};

const statInputPosStyle: React.CSSProperties = {
  background: "#121212",
  color: "#fff",
  border: "1px solid #252525",
  borderRadius: 10,
  padding: "10px 8px",
  width: "100%",
  textAlign: "center",
  fontWeight: 700,
};

const statInputMiniStyle: React.CSSProperties = {
  background: "#121212",
  color: "#fff",
  border: "1px solid #252525",
  borderRadius: 10,
  padding: "10px 12px",
  width: "100%",
};

const campoWrapperStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 320,
  margin: "0 auto",
  borderRadius: 14,
  overflow: "hidden",
  border: "1px solid #2a2a2a",
  background: "linear-gradient(180deg, #3b7d2a 0%, #2f6c22 50%, #3b7d2a 100%)",
  padding: 8,
  boxSizing: "border-box",
};

const campoInternoStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "0.7 / 1",
  border: "2px solid rgba(255,255,255,0.25)",
  boxSizing: "border-box",
  background:
    "repeating-linear-gradient(180deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 36px, transparent 36px, transparent 72px)",
};

const jogadorCampoStyle: React.CSSProperties = {
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
  width: 64,
  textAlign: "center",
};

const camisaCampoStyle: React.CSSProperties = {
  fontSize: 20,
  lineHeight: 1,
};

const nomeCampoStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#fff",
  fontWeight: 700,
  textShadow: "0 1px 2px rgba(0,0,0,0.85)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
};