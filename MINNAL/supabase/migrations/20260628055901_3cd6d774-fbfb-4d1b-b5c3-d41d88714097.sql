
-- 1) Revoke EXECUTE on SECURITY DEFINER helper functions from API roles.
-- These are inlined into RLS policies (LANGUAGE sql STABLE) so RLS continues to work,
-- but direct RPC calls from anon/authenticated are blocked.
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_workspace_admin(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.workspace_role_of(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_access_task(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.workspace_role_of(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_access_task(uuid, uuid) TO service_role;

-- 2) Invitations: require a confirmed email on auth.users for invitee match.
CREATE OR REPLACE FUNCTION public.is_confirmed_invitee(_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
      AND u.email_confirmed_at IS NOT NULL
      AND lower(u.email) = lower(_email)
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_confirmed_invitee(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_confirmed_invitee(text) TO service_role;

DROP POLICY IF EXISTS invitations_select_admin_or_invitee ON public.invitations;
CREATE POLICY invitations_select_admin_or_invitee ON public.invitations
  FOR SELECT
  USING (
    public.is_workspace_admin(workspace_id, auth.uid())
    OR public.is_confirmed_invitee(email)
  );

DROP POLICY IF EXISTS invitations_update_admin_or_invitee ON public.invitations;
CREATE POLICY invitations_update_admin_or_invitee ON public.invitations
  FOR UPDATE
  USING (
    public.is_workspace_admin(workspace_id, auth.uid())
    OR public.is_confirmed_invitee(email)
  );

-- 3) Lock down realtime.messages: deny broadcast/presence subscriptions by default.
-- The app only uses postgres_changes (governed by source-table RLS), so a deny-all
-- policy on realtime.messages prevents unauthorized broadcast/presence channel access.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny all realtime messages" ON realtime.messages;
CREATE POLICY "deny all realtime messages" ON realtime.messages
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);
