import { createClient } from "@supabase/supabase-js";

// Client de servidor (service_role): ignora RLS. NUNCA expor no front.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const db = {
  drillResults: {
    async insert(row) {
      const { error } = await supabaseAdmin.from("drill_results").insert(row);
      if (error) throw new Error(error.message);
      return row;
    },
    async findByUser(userId) {
      const { data, error } = await supabaseAdmin
        .from("drill_results")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  },

  drills: {
    // Lote de mãos que já têm solução (gto_nodes preenchido).
    async findBatch({ userId, size }) {
      const { data, error } = await supabaseAdmin
        .from("drills")
        .select("spot_id, board, pot, effective_stack, gto_nodes")
        .not("gto_nodes", "is", null)
        .limit(size);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  },
};
