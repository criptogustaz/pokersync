export const FORMATS = ["MTT", "Cash", "SNG", "Spin"];

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function fmtMoney(v) {
  return money.format(Number(v) || 0);
}
export function fmtSignedMoney(v) {
  const n = Number(v) || 0;
  return (n > 0 ? "+" : "") + money.format(n);
}
export function fmtPct(v, digits = 1) {
  const n = Number(v) || 0;
  return (n > 0 ? "+" : "") + n.toFixed(digits) + "%";
}

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export function weekdayIndex(dateStr) {
  return new Date((dateStr || "") + "T12:00:00").getDay();
}
export function weekdayName(dateStr) {
  return WEEKDAYS[weekdayIndex(dateStr)] ?? "—";
}

export const TIME_BUCKETS = ["Madrugada", "Manhã", "Tarde", "Noite"];
export function hourOf(session) {
  if (!session?.time) return null;
  const h = parseInt(String(session.time).slice(0, 2), 10);
  return Number.isNaN(h) ? null : h;
}
export function timeBucket(hour) {
  if (hour == null || Number.isNaN(hour)) return null;
  if (hour < 6) return "Madrugada";
  if (hour < 12) return "Manhã";
  if (hour < 18) return "Tarde";
  return "Noite";
}

// Smart entry: formato mais frequente nas últimas N sessões
export function suggestFormat(sessions, lookback = 10) {
  if (!sessions?.length) return "MTT";
  const recent = sessions.slice(-lookback);
  const count = {};
  for (const s of recent) count[s.format] = (count[s.format] || 0) + 1;
  return Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
}
// Último buy-in usado para um formato
export function suggestBuyIn(sessions, format) {
  const last = [...(sessions || [])].reverse().find((s) => s.format === format);
  return last ? last.buyIn : "";
}
export function knownVenues(sessions) {
  return [...new Set((sessions || []).map((s) => s.venue).filter(Boolean))];
}
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
