-- Public administrative reference catalogue is readable to authenticated NOVA users.
-- Operational records remain restricted by administrative_scope_assignments.
do $$
declare t text;
begin
 foreach t in array array['provinces','municipalities','communes'] loop
  execute format('alter table angola_agritech.%I enable row level security',t);
  execute format('drop policy if exists authenticated_reference_read on angola_agritech.%I',t);
  execute format('create policy authenticated_reference_read on angola_agritech.%I for select to authenticated using (true)',t);
  execute format('grant select on angola_agritech.%I to authenticated',t);
 end loop;
end $$;
