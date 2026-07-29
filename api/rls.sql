-- ============================================================
-- PokerSync — RLS (fonte única). Rode no SQL Editor do Supabase.
-- Idempotente: pode rodar de novo sem erro.
-- Regra: o servidor usa a service_role (ignora RLS) para ler/gravar;
--        o RLS só protege acessos diretos do browser via chave anon.
-- ============================================================

-- drills: catálogo de mãos resolvidas. Leitura pública (dados de treino,
-- não sensíveis); escrita só pela service_role (nenhuma policy de escrita).
alter table drills enable row level security;

drop policy if exists "drills_public_read" on drills;
create policy "drills_public_read"
  on drills for select
  using (true);

-- drill_results: histórico por usuário. Cada um só enxerga as próprias linhas.
alter table drill_results enable row level security;

-- limpa policies antigas/duplicadas desta fase do projeto
drop policy if exists "own_rows" on drill_results;
drop policy if exists "results_own_select" on drill_results;

create policy "results_own_select"
  on drill_results for select
  using (auth.uid() = user_id);

-- (Escrita continua exclusiva da service_role via API; sem policy de insert.)
