-- 20260731_01_missions_link_to_drills.sql
-- Adiciona coluna filter_payload em missions e atualiza register_training
-- para incrementar user_missions dos alvos correspondentes.

alter table public.missions add column if not exists filter_payload jsonb;

comment on column public.missions.filter_payload is
'Filtro opcional que liga a missão a drills específicos. Ex.: {"spot_ids":["btn_vs_bb_3bp_flop_monotone"]} ou {"position":"BTN","street":"flop"}. Null = missão genérica (conta qualquer drill).';

create or replace function public.register_training(
  p_spot_id text,
  p_verdict text,
  p_ev_loss numeric,
  p_user_action text,
  p_user_sizing numeric
) returns table(xp_final integer, level_up boolean, new_level integer, combo_gto integer)
language plpgsql
security definer
set search_path to 'public'
as $func$
declare
  v_uid uuid := auth.uid();
  v_base integer;
  v_session_id uuid;
  v_new_combo integer;
  v_result record;
  v_m record;
  v_inc integer;
begin
  if v_uid is null then raise exception 'NO_SESSION'; end if;

  v_base := case p_verdict when 'PERFECT' then 25 when 'OK' then 15 else 10 end;

  if p_verdict = 'PERFECT' then
    update user_progress set combo_gto = combo_gto + 1
      where user_id = v_uid returning combo_gto into v_new_combo;
  elsif p_verdict = 'BLUNDER' then
    update user_progress set combo_gto = 0 where user_id = v_uid;
    v_new_combo := 0;
  else
    select combo_gto into v_new_combo from user_progress where user_id = v_uid;
  end if;

  insert into training_sessions (user_id, spot_id, verdict, ev_loss, user_action, user_sizing, combo_at_time)
    values (v_uid, p_spot_id, p_verdict, p_ev_loss, p_user_action, p_user_sizing, coalesce(v_new_combo, 0))
    returning id into v_session_id;

  select * into v_result from award_xp('drill', 'drill', v_base, v_session_id);
  update training_sessions set xp_awarded = v_result.xp_final where id = v_session_id;

  for v_m in
    select um.id as um_id, um.progress, um.goal_value,
           m.goal_metric, m.category, m.xp_reward, m.id as mission_id, m.title
    from user_missions um
    join missions m on m.id = um.mission_id
    where um.user_id = v_uid
      and um.status = 'active'
      and um.period_start = current_date
      and (
        m.filter_payload is null
        or (m.filter_payload ? 'spot_ids'
            and (m.filter_payload->'spot_ids') @> to_jsonb(p_spot_id))
      )
  loop
    v_inc := case v_m.goal_metric
      when 'drills_completed'  then 1
      when 'gto_perfect'       then case when p_verdict = 'PERFECT' then 1 else 0 end
      when 'gto_ok_or_better'  then case when p_verdict in ('PERFECT','OK') then 1 else 0 end
      else 0
    end;

    if v_inc > 0 then
      update user_missions
        set progress = progress + v_inc,
            status = case when progress + v_inc >= goal_value then 'completed' else status end,
            completed_at = case when progress + v_inc >= goal_value and status = 'active' then now() else completed_at end
        where id = v_m.um_id;

      if v_m.progress + v_inc >= v_m.goal_value and v_m.progress < v_m.goal_value then
        perform award_xp('mission', coalesce(v_m.category, 'other'), v_m.xp_reward, v_m.mission_id);
        insert into notifications (user_id, title, body, kind)
          values (v_uid, 'Missão concluída', v_m.title || ' — +' || v_m.xp_reward || ' XP', 'success');
      end if;
    end if;
  end loop;

  xp_final := v_result.xp_final;
  level_up := v_result.level_up;
  new_level := v_result.new_level;
  combo_gto := coalesce(v_new_combo, 0);
  return next;
end;
$func$;
-- fim
