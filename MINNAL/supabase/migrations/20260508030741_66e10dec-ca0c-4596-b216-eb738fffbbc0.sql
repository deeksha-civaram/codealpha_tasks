
-- Enums
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'revoked', 'expired');

ALTER TYPE public.activity_action ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE public.activity_action ADD VALUE IF NOT EXISTS 'unassigned';

-- Workspaces
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.workspace_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.workspace_role NOT NULL DEFAULT 'member',
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status public.invitation_status NOT NULL DEFAULT 'pending',
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE INDEX invitations_email_idx ON public.invitations (lower(email));
CREATE INDEX invitations_workspace_idx ON public.invitations (workspace_id);

-- Extend tasks + activities
ALTER TABLE public.tasks ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN assignee_id uuid;
CREATE INDEX tasks_workspace_idx ON public.tasks (workspace_id);

ALTER TABLE public.activities ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
CREATE INDEX activities_workspace_idx ON public.activities (workspace_id);

-- Helper functions (SECURITY DEFINER, avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_workspace_member(_ws uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _ws AND user_id = _uid
  );
$$;

CREATE OR REPLACE FUNCTION public.workspace_role_of(_ws uuid, _uid uuid)
RETURNS public.workspace_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.workspace_members
  WHERE workspace_id = _ws AND user_id = _uid LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(_ws uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _ws AND user_id = _uid AND role IN ('owner','admin')
  );
$$;

-- Auto-add creator as owner
CREATE OR REPLACE FUNCTION public.handle_new_workspace()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;$$;

CREATE TRIGGER workspaces_after_insert
AFTER INSERT ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.handle_new_workspace();

CREATE TRIGGER workspaces_set_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER invitations_set_updated_at
BEFORE UPDATE ON public.invitations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: workspaces
CREATE POLICY workspaces_select_member ON public.workspaces
FOR SELECT USING (public.is_workspace_member(id, auth.uid()));
CREATE POLICY workspaces_insert_auth ON public.workspaces
FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY workspaces_update_owner ON public.workspaces
FOR UPDATE USING (public.workspace_role_of(id, auth.uid()) = 'owner');
CREATE POLICY workspaces_delete_owner ON public.workspaces
FOR DELETE USING (public.workspace_role_of(id, auth.uid()) = 'owner');

-- RLS: workspace_members
CREATE POLICY members_select_same_ws ON public.workspace_members
FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY members_insert_admin ON public.workspace_members
FOR INSERT WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()));
CREATE POLICY members_update_admin ON public.workspace_members
FOR UPDATE USING (public.is_workspace_admin(workspace_id, auth.uid()));
CREATE POLICY members_delete_admin_or_self ON public.workspace_members
FOR DELETE USING (
  public.is_workspace_admin(workspace_id, auth.uid()) OR user_id = auth.uid()
);

-- RLS: invitations
CREATE POLICY invitations_select_admin_or_invitee ON public.invitations
FOR SELECT USING (
  public.is_workspace_admin(workspace_id, auth.uid())
  OR lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);
CREATE POLICY invitations_insert_admin ON public.invitations
FOR INSERT WITH CHECK (
  public.is_workspace_admin(workspace_id, auth.uid()) AND invited_by = auth.uid()
);
CREATE POLICY invitations_update_admin_or_invitee ON public.invitations
FOR UPDATE USING (
  public.is_workspace_admin(workspace_id, auth.uid())
  OR lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);
CREATE POLICY invitations_delete_admin ON public.invitations
FOR DELETE USING (public.is_workspace_admin(workspace_id, auth.uid()));

-- Replace tasks RLS to include workspace access
DROP POLICY tasks_select_own ON public.tasks;
DROP POLICY tasks_insert_own ON public.tasks;
DROP POLICY tasks_update_own ON public.tasks;
DROP POLICY tasks_delete_own ON public.tasks;

CREATE POLICY tasks_select ON public.tasks FOR SELECT USING (
  auth.uid() = user_id
  OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()))
  OR assignee_id = auth.uid()
);
CREATE POLICY tasks_insert ON public.tasks FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR public.is_workspace_member(workspace_id, auth.uid()))
);
CREATE POLICY tasks_update ON public.tasks FOR UPDATE USING (
  auth.uid() = user_id
  OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()))
);
CREATE POLICY tasks_delete ON public.tasks FOR DELETE USING (
  auth.uid() = user_id
  OR (workspace_id IS NOT NULL AND public.is_workspace_admin(workspace_id, auth.uid()))
);

-- Replace activities RLS
DROP POLICY activities_select_own ON public.activities;
DROP POLICY activities_insert_own ON public.activities;
DROP POLICY activities_delete_own ON public.activities;

CREATE POLICY activities_select ON public.activities FOR SELECT USING (
  auth.uid() = user_id
  OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()))
);
CREATE POLICY activities_insert ON public.activities FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR public.is_workspace_member(workspace_id, auth.uid()))
);
CREATE POLICY activities_delete ON public.activities FOR DELETE USING (auth.uid() = user_id);

-- Allow members to read profiles of co-workspace users (for assignee display)
CREATE POLICY profiles_select_workspace_peers ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.workspace_members me
    JOIN public.workspace_members peer ON peer.workspace_id = me.workspace_id
    WHERE me.user_id = auth.uid() AND peer.user_id = profiles.id
  )
);
