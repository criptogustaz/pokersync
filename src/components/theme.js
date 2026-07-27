export const C = {
  bg: "#0B0C0F",
  panel: "#16181D",
  panel2: "#1E2128",
  line: "#2A2E37",
  text: "#ECEEF2",
  sub: "#8A909C",
  gold: "#C9A227",
  goldSoft: "#E4C55A",
  felt: "#0F3D2E",
  feltEdge: "#1C5C46",
  // Semânticas (dashboard financeiro)
  pos: "#22C55E",     // lucro
  posSoft: "#4ADE80",
  neg: "#EF4444",     // prejuízo
  negSoft: "#F87171",
  warn: "#F59E0B",    // alerta
  info: "#60A5FA",    // neutro/informativo
};

export const font = {
  fontFamily: 'Inter, "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif',
};

// Cor dinâmica por sinal do valor
export const signColor = (v) => (v > 0 ? C.pos : v < 0 ? C.neg : C.sub);
