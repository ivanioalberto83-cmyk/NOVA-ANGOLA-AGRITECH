create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create or replace function private.is_user_assigned_to_dispatch(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
 select exists (
  select 1
  from angola_agritech.emergency_dispatch_assignments da
  join angola_agritech.institution_user_assignments ua
    on ua.institution_id=da.institution_id
  where da.request_id=p_request_id
    and ua.user_id=(select auth.uid())
    and ua.is_active
 );
$$;
revoke all on function private.is_user_assigned_to_dispatch(uuid) from public;
grant execute on function private.is_user_assigned_to_dispatch(uuid) to authenticated;
create policy dispatch_requests_read_assigned_institution
on angola_agritech.emergency_dispatch_requests
for select to authenticated
using (private.is_user_assigned_to_dispatch(id));
create policy dispatch_assignments_update_assigned_institution
on angola_agritech.emergency_dispatch_assignments
for update to authenticated
using (private.is_user_assigned_to_dispatch(request_id))
with check (private.is_user_assigned_to_dispatch(request_id));
