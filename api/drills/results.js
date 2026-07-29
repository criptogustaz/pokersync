import { requireAuth } from "../_middleware/requireAuth.js";
import { db } from "../_db/index.js";

export default async function handler(req, res) {
  await requireAuth(req, res, async () => {
    if (req.method === "POST") {
      const { drillId, actionResult, evLoss } = req.body; // user_id IGNORADO se vier
      await db.drillResults.insert({
        user_id: req.userId, // sempre do token
        drill_id: drillId,
        result: actionResult,
        ev_loss: evLoss,
        created_at: new Date().toISOString(),
      });
      return res.status(201).json({ ok: true });
    }
    if (req.method === "GET") {
      const rows = await db.drillResults.findByUser(req.userId);
      return res.status(200).json(rows);
    }
    res.status(405).end();
  });
}
