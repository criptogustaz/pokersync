-- 20260731_04_bankroll_missions_and_trigger.sql
-- 6 missões de gestão de banca + trigger que atualiza progresso
-- automaticamente ao inserir em bankroll_sessions.

insert into missions (code, title, description, kind, category, goal_metric, goal_base, goal_scale, xp_reward, validation, icon)
values
  ('daily_bankroll_session',   'Sessão registrada',       'Registre 1 sessão de jogo hoje.',                        'daily',  'bankroll', 'bankroll_sessions',          1,  0.00, 30,  'auto', 'notebook'),
  ('daily_bankroll_positive',  'Fechou no verde',         'Encerre 1 sessão hoje com cashout maior que o buy-in.',  'daily',  'bankroll', 'bankroll_positive_sessions', 1,  0.00, 60,  'auto', 'trending-up'),
  ('weekly_bankroll_days',     'Semana ativa',            'Registre sessões em pelo menos 4 dias diferentes.',      'weekly', 'bankroll', 'bankroll_active_days',       4,  0.10, 200, 'auto', 'calendar'),
  ('weekly_bankroll_count',    'Consistência de registro','Registre 5 sessões esta semana.',                        'weekly', 'bankroll', 'bankroll_sessions',          5,  0.15, 200, 'auto', 'clipboard-list'),
  ('weekly_bankroll_hours',    'Volume da semana',        'Acumule 10 horas de jogo na semana.',                    'weekly', 'bankroll', 'bankroll_hours',             10, 0.20, 250, 'auto', 'clock'),
  ('weekly_bankroll_streak',   'Sequência positiva',      'Feche 3 sessões positivas seguidas.',                    'weekly', 'bankroll', 'bankroll_positive_streak',   3,  0.10, 220, 'auto', 'flame')
on conflict (code) do update set
  title=excluded.title, description=excluded.description, kind=excluded.kind, category=excluded.category,
  goal_metric=excluded.goal_metric, goal_base=excluded.goal_base, goal_scale=excluded.goal_scale,
  xp_reward=excluded.xp_reward, icon=excluded.icon;

create or replace function public.on_bankroll_session_insert()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $func$
declare
  v_uid uuid := new.user_id;
  v_invested numeric := coalesce(new.buy_in, 0) * (1 + coalesce(new.reentries, 0));
  v_is_positive boolean := coalesce(new.cashout, 0) > v_invested;
  v_first_on_day boolean;
  v_m record;
  v_inc numeric;
begin
  select not exists (
    select 1 from bankroll_sessions
    where user_id = v_uid and date = new.date and id <> new.id
  ) into v_first_on_day;

  for v_m in
    select um.id as um_id, um.progress, um.goal_value,
           m.goal_metric, m.category, m.xp_reward, m.id as mission_id, m.title
    from user_missions um
    join missions m on m.id = um.mission_id
    where um.user_id = v_uid
      and um.status = 'active'
      and m.goal_metric in (
        'bankroll_sessions', 'bankroll_positive_sessions',
        'bankroll_active_days', 'bankroll_hours', 'bankroll_positive_streak'
      )
  loop
    v_inc := case v_m.goal_metric
      when 'bankroll_sessions'          then 1
      when 'bankroll_positive_sessions' then case when v_is_positive then 1 else 0 end
      when 'bankroll_active_days'       then case when v_first_on_day then 1 else 0 end
      when 'bankroll_hours'             then coalesce(new.hours, 0)
      when 'bankroll_positive_streak'   then case when v_is_positive then 1 else -v_m.progress end
      else 0
    end;

    if v_inc <> 0 then
      update user_missions
        set progress = greatest(0, progress + v_inc::integer),
            status = case when progress + v_inc::integer >= goal_value then 'completed' else status end,
            completed_at = case when progress + v_inc::integer >= goal_value and status = 'active' then now() else completed_at end
        where id = v_m.um_id;

      if v_inc > 0
         and v_m.progress + v_inc::integer >= v_m.goal_value
         and v_m.progress < v_m.goal_value then
        perform award_xp('mission', coalesce(v_m.category, 'other'), v_m.xp_reward, v_m.mission_id);
        insert into notifications (user_id, title, body, kind)
          values (v_uid, 'Missão concluída', v_m.title || ' — +' || v_m.xp_reward || ' XP', 'success');
      end if;
    end if;
  end loop;

  return new;
end;
$func$;

drop trigger if exists trg_bankroll_session_missions on public.bankroll_sessions;

create trigger trg_bankroll_session_missions
after insert on public.bankroll_sessions
for each row execute function public.on_bankroll_session_insert();
-- fim
