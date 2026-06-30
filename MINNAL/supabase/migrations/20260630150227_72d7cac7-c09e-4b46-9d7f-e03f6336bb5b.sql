
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.workspace_role_of(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_task(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_confirmed_invitee(text) TO authenticated;
