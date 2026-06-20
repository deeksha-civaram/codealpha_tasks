
-- Add is_banned to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

-- Ensure RLS is enabled on all public tables
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows   ENABLE ROW LEVEL SECURITY;

-- Helper: check if a user is banned. SECURITY DEFINER so it bypasses RLS for the lookup.
CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_banned FROM public.profiles WHERE id = _user_id), false);
$$;

-- Trigger function: block banned users from inserting interactive content
CREATE OR REPLACE FUNCTION public.block_banned_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_user_banned(auth.uid()) THEN
    RAISE EXCEPTION 'Your account has been suspended.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to user-content tables (drop-if-exists for idempotency)
DROP TRIGGER IF EXISTS block_banned_posts     ON public.posts;
DROP TRIGGER IF EXISTS block_banned_comments  ON public.comments;
DROP TRIGGER IF EXISTS block_banned_likes     ON public.likes;
DROP TRIGGER IF EXISTS block_banned_bookmarks ON public.bookmarks;
DROP TRIGGER IF EXISTS block_banned_follows   ON public.follows;

CREATE TRIGGER block_banned_posts
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_users();

CREATE TRIGGER block_banned_comments
  BEFORE INSERT OR UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_users();

CREATE TRIGGER block_banned_likes
  BEFORE INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_users();

CREATE TRIGGER block_banned_bookmarks
  BEFORE INSERT ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_users();

CREATE TRIGGER block_banned_follows
  BEFORE INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_users();
