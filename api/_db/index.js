// Camada de acesso a dados (stub). Substitua pela sua implementação real
// (Supabase client, Prisma, Drizzle, etc.). Mantida isolada de propósito.
export const db = {
  drillResults: {
    async insert(row) {
      // TODO: INSERT INTO drill_results ...
      return row;
    },
    async findByUser(userId) {
      // TODO: SELECT * FROM drill_results WHERE user_id = $1
      return [];
    },
  },
};
