
REVOKE EXECUTE ON FUNCTION public.is_user_banned(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.block_banned_users() FROM PUBLIC, anon, authenticated;
