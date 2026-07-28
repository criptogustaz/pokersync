import { requireAuth } from "../_middleware/requireAuth.js";
import { db } from "../_db/index.js";

// GET /api/drills/batch?size=20
// Devolve um lote de mãos para o Modo Treino, cada uma já com seus gtoNodes
// (a solução pré-computada do TexasSolver, gravada na coluna gto_nodes).
export default async function handler(req, res) {
  await requireAuth(req, res, async () => {
    if (req.method !== "GET") return res.status(405).end();

    // clamp defensivo do tamanho do lote (1..50)
    const raw = parseInt(req.query.size, 10);
    const size = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 50) : 20;

    const rows = await db.drills.findBatch({ userId: req.userId, size });

    // Normaliza gto_nodes (coluna jsonb) -> gtoNodes (shape do engine).
    // Só serve mãos que já têm solução; mãos sem gtoNodes ficam de fora.
    const hands = rows
      .filter((r) => Array.isArray(r.gto_nodes) && r.gto_nodes.length > 0)
      .map((r) => ({
        drillId: r.spot_id,
        board: r.board,
        pot: r.pot,
        effectiveStack: r.effective_stack,
        gtoNodes: r.gto_nodes, // [{ action, sizing, ev }]
      }));

    return res.status(200).json(hands);
  });
}
