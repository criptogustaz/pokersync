import { requireAuth } from "../_middleware/requireAuth.js";
import { db } from "../_db/index.js";

// GET /api/drills/batch?size=20&solution=MTT&format=ChipEV&stack=25&position=CO&street=Pré-Flop&action=RFI
export default async function handler(req, res) {
  await requireAuth(req, res, async () => {
    if (req.method !== "GET") return res.status(405).end();

    const raw = parseInt(req.query.size, 10);
    const size = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 50) : 20;

    // Extrai filtros opcionais
    const filters = {};
    if (req.query.solution) filters.solution = req.query.solution;
    if (req.query.format) filters.format = req.query.format;
    if (req.query.stack) filters.stack = parseInt(req.query.stack, 10);
    if (req.query.position) filters.position = req.query.position;
    if (req.query.street) filters.street = req.query.street;
    if (req.query.action) filters.action = req.query.action;

    const rows = await db.drills.findBatch({ userId: req.userId, size, filters });

    // gto_nodes agora é um objeto { actions, player, strategy }, não uma lista.
    // Válido = objeto existe, tem pelo menos 1 ação, e tem estratégia por mão.
    const isValidGtoNode = (n) =>
      n &&
      typeof n === "object" &&
      Array.isArray(n.actions) &&
      n.actions.length > 0 &&
      n.strategy &&
      typeof n.strategy === "object" &&
      Object.keys(n.strategy).length > 0;

    // Sorteia uma mão (combo específico, ex: "AsKd") dentre as que o
    // solver calculou estratégia para este spot. Distribuição uniforme
    // entre os combos presentes — aproximação aceitável para treino.
    const dealHeroCombo = (strategy) => {
      const combos = Object.keys(strategy);
      const idx = Math.floor(Math.random() * combos.length);
      return combos[idx];
    };

    const hands = rows
      .filter((r) => isValidGtoNode(r.gto_nodes))
      .map((r) => {
        const heroCombo = dealHeroCombo(r.gto_nodes.strategy);
        return {
          drillId: r.spot_id,
          board: r.board,
          pot: r.pot,
          effectiveStack: r.effective_stack,
          gtoNodes: r.gto_nodes,
          heroCards: heroCombo, // ex: "AsKd" -> primeiras 2 letras = 1a carta, últimas 2 = 2a carta
        };
      });

    return res.status(200).json(hands);
  });
}
