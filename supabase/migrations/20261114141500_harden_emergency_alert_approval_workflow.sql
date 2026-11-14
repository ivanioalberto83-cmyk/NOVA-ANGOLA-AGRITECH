-- Harden emergency-alert approval and issuance workflow.
alter table angola_agritech.emergency_notification_log
  drop constraint if exists emergency_notification_log_channel_check;
alter table angola_agritech.emergency_notification_log
  add constraint emergency_notification_log_channel_check
  check(channel in ('sms','cell_broadcast','mobile_push','radio','email','siren','other'));

create or replace function angola_agritech.enforce_emergency_alert_approval()
returns trigger
language plpgsql
set search_path = angola_agritech, public
as $$
declare
  approvals_count integer;
begin
  if new.status in ('approved','issued') and (tg_op='INSERT' or old.status is distinct from new.status) then
    select count(distinct approver_user_id)
      into approvals_count
      from angola_agritech.emergency_alert_approvals
     where alert_id=new.id
       and decision='approve'
       and approver_user_id <> new.created_by;

    if approvals_count < 2 then
      raise exception 'São necessárias duas aprovações independentes antes de aprovar ou emitir um alerta.';
    end if;
    if new.approved_at is null then
      raise exception 'A data de aprovação é obrigatória.';
    end if;
  end if;

  if new.status='issued' and (new.issued_by is null or new.issued_by=new.created_by) then
    raise exception 'A emissão deve ser efectuada por um responsável diferente do autor do alerta.';
  end if;

  if tg_op='UPDATE' and old.status='issued' and new.status not in ('issued','cancelled','expired') then
    raise exception 'Um alerta já emitido não pode regressar a um estado anterior.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_emergency_alert_approval on angola_agritech.emergency_alerts;
create trigger trg_enforce_emergency_alert_approval
before insert or update of status,approved_at,issued_by
on angola_agritech.emergency_alerts
for each row execute function angola_agritech.enforce_emergency_alert_approval();
