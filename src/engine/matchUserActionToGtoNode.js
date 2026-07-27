const SIZING_TOLERANCE = 0.15; // ±15% de desvio de sizing tolerado
const EV_TOLERANCE = 0;        // perda de EV (bb) considerada aceitável para "PERFECT"

export function matchUserActionToGtoNode(userAction, gtoNodes) {
  if (!Array.isArray(gtoNodes) || gtoNodes.length === 0) {
    return { verdict: "UNKNOWN", node: null, evLoss: 0 };
  }

  const best = gtoNodes.reduce((a, b) => (a.ev >= b.ev ? a : b));

  const sameAction = gtoNodes.filter((n) => n.action === userAction.action);
  const nearest = sameAction
    .map((n) => {
      const diff =
        n.sizing === 0
          ? Math.abs(n.sizing - userAction.sizing)
          : Math.abs(n.sizing - userAction.sizing) / n.sizing;
      return { node: n, diff };
    })
    .sort((a, b) => a.diff - b.diff)[0];

  const chosen = nearest?.node ?? best;
  const withinSizing = nearest ? nearest.diff <= SIZING_TOLERANCE : false;
  const evLoss = +(best.ev - chosen.ev).toFixed(2);

  // "PERFECT" exige jogar a mesma ação dentro da tolerância de sizing E não perder EV.
  // Casar exatamente um nó dominado (ex.: FOLD em spot +EV) NÃO é perfeito: é blunder.
  const verdict = withinSizing && evLoss <= EV_TOLERANCE ? "PERFECT" : "BLUNDER";

  return { verdict, node: chosen, evLoss };
}
