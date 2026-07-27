import { groupStats } from "./calc.js";

const DIMENSIONS = ["format", "weekday", "time"];

// Retorna grupos com prejuízo (net < 0) e amostra mínima, do pior ao "menos pior".
export function findLeaks(sessions, { minSample = 3 } = {}) {
  const leaks = [];
  for (const dimension of DIMENSIONS) {
    for (const g of groupStats(sessions, dimension)) {
      if (g.n >= minSample && g.net < 0) leaks.push({ dimension, ...g });
    }
  }
  return leaks.sort((a, b) => a.net - b.net);
}
