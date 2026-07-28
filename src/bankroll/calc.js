import { weekdayName, hourOf, timeBucket } from "./format.js";

const TOURNEY = new Set(["MTT", "SNG", "Spin"]);

// Valor investido = buy-in x (1 + reentradas)
export function invested(s) {
  return (Number(s.buyIn) || 0) * (1 + (Number(s.reentries) || 0));
}
// Número de "balas" (entradas)
export function entries(s) {
  return 1 + (Number(s.reentries) || 0);
}
// Resultado líquido da sessão = cashout - investido
export function net(s) {
  return (Number(s.cashout) || 0) - invested(s);
}

export function aggregate(sessions) {
  const list = sessions || [];
  let totalInvested = 0, totalCashout = 0, buyInSum = 0, tourneyCount = 0, itmCount = 0;
  for (const s of list) {
    totalInvested += invested(s);
    totalCashout += Number(s.cashout) || 0;
    buyInSum += Number(s.buyIn) || 0;
    if (TOURNEY.has(s.format)) {
      tourneyCount += 1;
      if ((Number(s.cashout) || 0) > 0) itmCount += 1;
    }
  }
  const n = list.length;
  const profit = totalCashout - totalInvested;
  return {
    n,
    totalInvested,
    totalCashout,
    profit,
    roi: totalInvested > 0 ? (profit / totalInvested) * 100 : 0,
    itm: tourneyCount > 0 ? (itmCount / tourneyCount) * 100 : 0,
    avgBuyIn: n > 0 ? buyInSum / n : 0,
    tourneyCount,
    itmCount,
  };
}

const sortKey = (s) => (s.date || "") + "T" + (s.time || "00:00");

// Série de banca acumulada (relativa a `start`), ordenada por data/hora
export function evolutionSeries(sessions, start = 0) {
  const sorted = [...(sessions || [])].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  let cum = start;
  return sorted.map((s) => {
    cum += net(s);
    return {
      date: s.date,
      label: (s.date || "").slice(5),
      value: +cum.toFixed(2),
      net: +net(s).toFixed(2),
      format: s.format,
    };
  });
}

function groupKey(s, dimension) {
  if (dimension === "format") return s.format || "—";
  if (dimension === "weekday") return weekdayName(s.date);
  if (dimension === "time") return timeBucket(hourOf(s)) ?? "Sem horário";
  return "—";
}

// Estatísticas por grupo. Retorna ordenado do pior (mais negativo) ao melhor.
export function groupStats(sessions, dimension) {
  const groups = {};
  for (const s of sessions || []) {
    const key = groupKey(s, dimension);
    (groups[key] ||= []).push(s);
  }
  return Object.entries(groups)
    .map(([key, arr]) => {
      const a = aggregate(arr);
      return { key, n: arr.length, invested: a.totalInvested, net: a.profit, roi: a.roi };
    })
    .sort((a, b) => a.net - b.net);
}

// Filtra a série de evolução por janela de tempo relativa à última sessão.
// range: "7D" | "30D" | "1Y" | "all"
export function filterSeriesByRange(series, range) {
  if (!series?.length || range === "all") return series;
  const days = { "7D": 7, "30D": 30, "1Y": 365 }[range];
  if (!days) return series;
  const ref = new Date(series[series.length - 1].date + "T12:00:00");
  const cutoff = new Date(ref);
  cutoff.setDate(ref.getDate() - days);
  return series.filter((p) => new Date(p.date + "T12:00:00") >= cutoff);
}
