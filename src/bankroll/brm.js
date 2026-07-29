import { FORMATS } from "./format.js";

export const RISK_PROFILES = ["Agressivo", "Padrão", "Conservador"];

// Buy-ins mínimos recomendados por formato e perfil de risco.
// Quanto maior a variância do formato, mais buy-ins são exigidos.
export const REQUIRED_BUYINS = {
  Agressivo:   { MTT: 50,  Cash: 20, SNG: 30,  Spin: 60  },
  Padrão:      { MTT: 100, Cash: 30, SNG: 50,  Spin: 100 },
  Conservador: { MTT: 200, Cash: 50, SNG: 100, Spin: 200 },
};

// Dado o valor total da banca e o perfil, sugere o buy-in máximo por formato.
export function suggestLimits(bankroll, profile) {
  const b = Number(bankroll) || 0;
  const req = REQUIRED_BUYINS[profile] || REQUIRED_BUYINS.Padrão;
  return FORMATS.map((format) => ({
    format,
    requiredBuyIns: req[format],
    maxBuyIn: req[format] > 0 ? +(b / req[format]).toFixed(2) : 0,
  }));
}

// Saúde da banca vs stake médio praticado (referência: MTT do perfil).
export function bankrollHealth(bankroll, avgBuyIn, profile = "Padrão") {
  const b = Number(bankroll) || 0;
  if (!avgBuyIn) return { buyIns: 0, status: "info" };
  const buyIns = b / avgBuyIn;
  const req = REQUIRED_BUYINS[profile].MTT;
  let status = "good";
  if (buyIns < req * 0.5) status = "bad";
  else if (buyIns < req) status = "warn";
  return { buyIns: +buyIns.toFixed(1), status };
}
