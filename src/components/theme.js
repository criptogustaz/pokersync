// ============================================================
// PokerSync — Design tokens
// Base dark monocromática + acento verde (marca) e mesa de jogo colorida.
// ============================================================
export const C = {
  // Superfícies
  bg: "#111111",
  panel: "#1E1E1E",
  panel2: "#1E1E1E",
  shadow: "#000000",
  line: "rgba(255,255,255,0.12)",

  // Texto
  text: "#FFFFFF",
  sub: "rgba(255,255,255,0.55)",

  // Acento verde-petróleo (marca). 'gold/goldSoft' mantidos como ALIAS p/ compat.
  accent: "#1F8A70",       // verde-petróleo
  accentSoft: "#2FB89A",   // hover / brilho
  accentText: "#0B1512",   // texto sobre o verde
  gold: "#1F8A70",
  goldSoft: "#2FB89A",

  // Mesa de jogo — feltro verde-petróleo escuro.
  felt: "#0E3A32",
  feltEdge: "#12574A",

  // Semânticas
  pos: "#2FB89A",   // lucro (alinhado ao acento)
  posSoft: "#5AD1B6",
  neg: "#E0555A",   // prejuízo / fold
  negSoft: "#F0868A",
  warn: "#E0B24C",
  info: "#5AA6E0",

  // Baralho de 4 cores (padrão de estudo GTO).
  suit: {
    s: "#1A1A1A", // ♠ preto
    h: "#D23B4E", // ♥ vermelho
    d: "#2E7DD1", // ♦ azul
    c: "#2E9E5B", // ♣ verde
  },
};

export const font = {
  fontFamily: '"Space Grotesk", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  fontWeight: 600,
};

export const motion = "150ms ease";
export const signColor = (v) => (v > 0 ? C.pos : v < 0 ? C.neg : C.sub);
