// COPIE AS DUAS PRIMEIRAS LINHAS DO batch.js AQUI
// (o import do client do Supabase — o nome do arquivo varia)
import { supabase } from "../_lib/supabase.js";

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from("drills")
      .select("position, action, street");

    if (error) throw error;

    const map = {};
    for (const r of data) {
      const k = `${r.position}|${r.action}|${r.street}`;
      map[k] = (map[k] || 0) + 1;
    }

    const facets = Object.entries(map).map(([k, n]) => {
      const [position, action, street] = k.split("|");
      return { position, action, street, n };
    });

    res.status(200).json(facets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
