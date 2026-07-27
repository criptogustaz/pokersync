-- Row Level Security: cada usuário só acessa suas próprias linhas.
alter table drill_results enable row level security;

create policy "own_rows"
  on drill_results
  for all
  using (auth.uid() = user_id);
