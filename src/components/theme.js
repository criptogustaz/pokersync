// ============================================================
// PokerSync — Design tokens
// Paleta estritamente monocromática (#111 / #1E1E1E / #FFF).
// Cores só para micro-detalhes de status + mesa de jogo.
// ============================================================
export const C = {
  // Superfícies
  bg: "#111111",
  panel: "#1E1E1E",
  panel2: "#252525",
  shadow: "#000000",
  line: "rgba(255,255,255,0.08)",

  // Texto
  text: "#FFFFFF",
  sub: "rgba(255,255,255,0.45)",

  // Acento principal — branco (botões, CTAs, destaques da UI geral)
  accent: "#FFFFFF",
  accentHover: "#E0E0E0",
  accentText: "#111111",

  // Aliases legados (compat com componentes existentes)
  gold: "#FFFFFF",
  goldSoft: "rgba(255,255,255,0.6)",

  // Mesa de jogo — feltro verde-petróleo escuro
  felt: "#0E3A32",
  feltEdge: "#12574A",

  // Semânticas — SOMENTE micro-detalhes de status
  pos: "#2FB89A",
  posSoft: "#5AD1B6",
  neg: "#E0555A",
  negSoft: "#F0868A",
  warn: "#E0B24C",
  info: "#5AA6E0",

  // Baralho de 4 cores (padrão de estudo GTO)
  suit: {
    s: "#1A1A1A",
    h: "#D23B4E",
    d: "#2E7DD1",
    c: "#2E9E5B",
  },
};

export const font = {
  fontFamily: '"Space Grotesk", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  fontWeight: 600,
};

export const motion = "150ms ease";
export const signColor = (v) => (v > 0 ? C.pos : v < 0 ? C.neg : C.sub);
