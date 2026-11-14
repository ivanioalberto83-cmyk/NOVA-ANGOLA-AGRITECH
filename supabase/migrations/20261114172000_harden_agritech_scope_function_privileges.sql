-- NOVA ANGOLA AGRITECH
-- Security hardening for territorial scope helper functions.
-- Applied to Supabase project rojyxfjaidyvtmsmefcf (schema angola_agritech).
-- The scope helpers only read the caller's own active assignments; they do not
-- require SECURITY DEFINER because administrative_scope_assignments has a
-- self-read RLS policy. The trigger function is callable only by its trigger.
ALTER FUNCTION angola_agritech.can_access_scope(uuid, uuid, uuid)
  SECURITY INVOKER;
ALTER FUNCTION angola_agritech.can_access_scope(uuid, uuid, uuid)
  SET search_path = '';
REVOKE EXECUTE ON FUNCTION angola_agritech.can_access_scope(uuid, uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION angola_agritech.can_access_scope(uuid, uuid, uuid)
  TO authenticated;

ALTER FUNCTION angola_agritech.can_manage_scope(uuid, uuid, uuid)
  SECURITY INVOKER;
ALTER FUNCTION angola_agritech.can_manage_scope(uuid, uuid, uuid)
  SET search_path = '';
REVOKE EXECUTE ON FUNCTION angola_agritech.can_manage_scope(uuid, uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION angola_agritech.can_manage_scope(uuid, uuid, uuid)
  TO authenticated;

ALTER FUNCTION angola_agritech.enforce_emergency_alert_approval()
  SET search_path = '';
REVOKE EXECUTE ON FUNCTION angola_agritech.enforce_emergency_alert_approval()
  FROM PUBLIC, anon, authenticated;
