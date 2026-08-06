import { requireAuth } from "../_middleware/requireAuth.js";
import { db } from "../_db/index.js";

// GET /api/drills/facets
// Devolve as combinações position × action × street que existem de fato
// na base, com a contagem de cada uma. O FilterDrawer usa isso para
// desabilitar opções sem spot (ex: SB + vs Open não existe).
export default async function handler(req, res) {
  await requireAuth(req, res, async () => {
    if (req.method !== "GET") return res.status(405).end();

    try {
      const facets = await db.drills.facets({ userId: req.userId });
      return res.status(200).json(facets);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
}
