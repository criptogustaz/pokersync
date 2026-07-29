import { aggregate, evolutionSeries, groupStats } from "./calc.js";
import { fmtMoney, fmtPct } from "./format.js";

const MIN_SAMPLE = 12; // sessões mínimas p/ confiar no ROI de um formato
const DD_WARN = 10;    // drawdown (em buy-ins) p/ alerta
const DD_ACTION = 20;  // drawdown (em buy-ins) p/ sugerir descer de limite
const LOW_VOLUME = 20; // sessões p/ considerar amostra pequena

// Maior queda desde um pico (drawdown), convertida em buy-ins.
export function drawdownBuyIns(sessions, avgBuyIn) {
  const series = evolutionSeries(sessions);
  let peak = 0, dd = 0;
  for (const p of series) {
    if (p.value > peak) peak = p.value;
    dd = Math.max(dd, peak - p.value);
  }
  return avgBuyIn > 0 ? dd / avgBuyIn : 0;
}

export function buildCoachTips(sessions, opts = {}) {
  const a = aggregate(sessions);
  if (a.n === 0) {
    return [{ id: "empty", level: "info", title: "Sem dados ainda",
      text: "Registre sua primeira sessão para o Coach analisar sua banca." }];
  }

  const tips = [];

  // 1) Drawdown / downswing
  const ddBI = drawdownBuyIns(sessions, a.avgBuyIn);
  if (ddBI >= DD_ACTION) {
    tips.push({ id: "dd", level: "bad",
      title: `Downswing de ${Math.round(ddBI)} buy-ins`,
      text: "Considere descer de limite temporariamente e revisar sua seleção de mesas até estabilizar." });
  } else if (ddBI >= DD_WARN) {
    tips.push({ id: "dd", level: "warn",
      title: `Atenção: ${Math.round(ddBI)} buy-ins abaixo do topo`,
      text: "Variância dentro do normal, mas monitore seu BRM se o downswing continuar." });
  }

  // 2) Melhor e pior formato por ROI (só com amostra suficiente)
  const perFmt = groupStats(sessions, "format");
  const eligible = perFmt.filter((g) => g.n >= MIN_SAMPLE);
  const best = [...eligible].sort((x, y) => y.roi - x.roi)[0];
  const worst = [...eligible].sort((x, y) => x.roi - y.roi)[0];
  if (best && best.roi > 0) {
    tips.push({ id: "best", level: "good",
      title: `${best.key} é seu formato mais lucrativo`,
      text: `ROI de ${fmtPct(best.roi)} em ${best.n} sessões. Priorize este formato neste mês.` });
  }
  if (worst && worst.roi < 0 && (!best || worst.key !== best.key)) {
    tips.push({ id: "worst", level: "bad",
      title: `Vazamento em ${worst.key}`,
      text: `ROI de ${fmtPct(worst.roi)} em ${worst.n} sessões. Reduza volume ou revise a estratégia.` });
  }

  // 3) Saúde da banca (se o bankroll for informado)
  if (opts.bankroll && a.avgBuyIn > 0) {
    const buyIns = opts.bankroll / a.avgBuyIn;
    if (buyIns < 30) {
      tips.push({ id: "health", level: "warn",
        title: `Banca cobre ~${buyIns.toFixed(0)} buy-ins do seu stake médio`,
        text: "Padrão recomenda 30+ para cash e 100+ para MTT. Reforce a banca ou reduza o buy-in." });
    }
  }

  // 4) Momentum positivo
  if (a.profit > 0 && ddBI < DD_WARN) {
    tips.push({ id: "up", level: "good",
      title: `Banca em alta: ${fmtMoney(a.profit)}`,
      text: `ROI geral de ${fmtPct(a.roi)}. Mantenha a disciplina de BRM e o volume.` });
  }

  // 5) Amostra pequena
  if (a.n < LOW_VOLUME) {
    tips.push({ id: "sample", level: "info",
      title: "Amostra ainda pequena",
      text: `Com ${a.n} sessões, os números têm alta variância. Use como tendência, não como verdade.` });
  }

  return tips;
}
