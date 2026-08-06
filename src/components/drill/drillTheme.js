/* ==================================================================
   src/components/drill/drillTheme.js

   Camada fina sobre o theme.js do projeto. Importa C e font reais e
   preenche APENAS as chaves que ainda não existem no tema, para o
   módulo de treino não quebrar caso alguma delas falte.

   Quando as chaves abaixo entrarem oficialmente no theme.js, este
   arquivo pode ser reduzido a um simples re-export.
===================================================================*/
import { C as BASE, font as BASE_FONT } from "../theme";

const fb = (v, d) => (v === undefined || v === null ? d : v);

export const T = {
  bg:       fb(BASE.bg, "#0B0D10"),
  panel:    fb(BASE.panel, "#12161C"),
  panelAlt: fb(BASE.panelAlt ?? BASE.card, "#161B22"),
  line:     fb(BASE.line ?? BASE.border, "#232A33"),
  text:     fb(BASE.text, "#E9EEF5"),
  dim:      fb(BASE.dim ?? BASE.muted, "#8A94A3"),
  accent:   fb(BASE.accent ?? BASE.primary, "#A855F7"),
  ok:       fb(BASE.ok ?? BASE.success, "#22C55E"),
  warn:     fb(BASE.warn ?? BASE.warning, "#EAB308"),
  bad:      fb(BASE.bad ?? BASE.danger ?? BASE.error, "#EF4444"),
};

export const F = fb(BASE_FONT, "'Inter', system-ui, sans-serif");

/* Cor por posição — gradiente de temperatura seguindo a ordem de ação:
   early frio, late quente. Vira código visual reconhecível sem leitura. */
export const POS = {
  UTG:     { base: "#3B82F6", glow: "#60A5FA" },
  "UTG+1": { base: "#06B6D4", glow: "#22D3EE" },
  MP:      { base: "#10B981", glow: "#34D399" },
  HJ:      { base: "#EAB308", glow: "#FACC15" },
  CO:      { base: "#F97316", glow: "#FB923C" },
  BTN:     { base: "#A855F7", glow: "#C084FC" },
  SB:      { base: "#EC4899", glow: "#F472B6" },
  BB:      { base: "#EF4444", glow: "#F87171" },
};

/* Four-color deck saturado para ganhar contraste sobre o feltro */
export const SUITS = {
  h: { g: "♥", c: "#FF3B57" },
  d: { g: "♦", c: "#2E9BFF" },
  c: { g: "♣", c: "#22C55E" },
  s: { g: "♠", c: "#111820" },
};

/* Números tabulares: colunas de EV e stack alinham verticalmente */
export const num = {
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: "'tnum'",
};

export const fmtEv = (v) =>
  v === 0 ? "0.00" : `${v < 0 ? "−" : "+"}${Math.abs(v).toFixed(2)}`;

/* Escala semântica de custo do erro: 0 = linha do solver,
   desvio pequeno = âmbar, desvio caro = vermelho. */
export const evColor = (v) =>
  v === 0 ? T.ok : Math.abs(v) < 0.3 ? T.warn : T.bad;

/* Estilos de badge por tipo de ação */
export const ACT = {
  fold:  { label: "Fold",  fg: T.dim,     bd: "rgba(150,160,175,.35)", bg: "rgba(120,130,145,.16)" },
  check: { label: "Check", fg: "#7DD3FC", bd: "rgba(56,189,248,.45)",  bg: "rgba(56,189,248,.14)" },
  call:  { label: "Call",  fg: "#4ADE80", bd: "rgba(34,197,94,.50)",   bg: "rgba(34,197,94,.16)" },
  bet:   { label: "Bet",   fg: "#FDBA74", bd: "rgba(249,115,22,.55)",  bg: "rgba(249,115,22,.18)" },
  raise: { label: "Raise", fg: "#FCA5A5", bd: "rgba(239,68,68,.55)",   bg: "rgba(239,68,68,.18)" },
};
