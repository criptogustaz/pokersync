import { createClient } from "@supabase/supabase-js";

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
    /**
     * Lote de mãos com filtros opcionais.
     * Colunas de filtro na tabela drills (a serem adicionadas):
     *   solution text,   -- 'MTT' | 'Cash'
     *   format text,     -- 'HeadsUP' | 'ChipEV' | 'ICM'
     *   stack_bb int,    -- effective stack em BB
     *   position text,   -- 'UTG' | 'CO' | 'BU' | 'SB' | 'BB' etc.
     *   street text,     -- 'Pré-Flop' | 'Pós-Flop'
     *   action text      -- 'RFI' | 'vs Open' | 'vs 3-Bet' etc.
     */
    async findBatch({ userId, size, filters = {} }) {
      let query = supabaseAdmin
        .from("drills")
        .select("spot_id, board, pot, effective_stack, gto_nodes")
        .not("gto_nodes", "is", null);

      // Aplica filtros dinâmicos (só se a coluna existir no banco)
      if (filters.solution) query = query.eq("solution", filters.solution);
      if (filters.format) query = query.eq("format", filters.format);
      if (filters.stack) query = query.eq("stack_bb", filters.stack);
      if (filters.position) query = query.eq("position", filters.position);
      if (filters.street) query = query.eq("street", filters.street);
      if (filters.action) query = query.eq("action", filters.action);

      query = query.limit(size);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },

    /**
     * Combinações position × action × street que existem de fato na
     * base, com a contagem de cada uma. Usado pelo FilterDrawer para
     * desabilitar opções sem spot (ex: SB nunca tem 'vs Open').
     *
     * CORREÇÃO: este método estava colado FORA do objeto `drills`
     * (como db.facets em vez de db.drills.facets), causando erro
     * "not a function" toda vez que a rota era chamada — por isso o
     * 500 se repetia de forma idêntica em todas as tentativas.
     */
    async facets() {
      const { data, error } = await supabaseAdmin
        .from("drills")
        .select("position, action, street")
        .not("gto_nodes", "is", null);
      if (error) throw new Error(error.message);

      const map = {};
      for (const r of data ?? []) {
        const k = `${r.position}|${r.action}|${r.street}`;
        map[k] = (map[k] || 0) + 1;
      }
      return Object.entries(map).map(([k, n]) => {
        const [position, action, street] = k.split("|");
        return { position, action, street, n };
      });
    },
  },
};
