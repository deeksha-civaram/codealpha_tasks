
-- Ensure shared updated_at helper exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Extend activity_action enum
ALTER TYPE public.activity_action ADD VALUE IF NOT EXISTS 'commented';
ALTER TYPE public.activity_action ADD VALUE IF NOT EXISTS 'mentioned';

-- Helper: can a user access a given task?
CREATE OR REPLACE FUNCTION public.can_access_task(_task_id uuid, _uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = _task_id
      AND (
        t.user_id = _uid
        OR (t.workspace_id IS NOT NULL AND public.is_workspace_member(t.workspace_id, _uid))
      )
  )
$$;

-- task_comments
CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
  mentions uuid[] NOT NULL DEFAULT '{}',
  parent_id uuid REFERENCES public.task_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_task_comments_task ON public.task_comments(task_id, created_at);
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view comments if can access task"
  ON public.task_comments FOR SELECT TO authenticated
  USING (public.can_access_task(task_id, auth.uid()));
CREATE POLICY "insert comments if can access task"
  ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.can_access_task(task_id, auth.uid()));
CREATE POLICY "update own comments"
  ON public.task_comments FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "delete own comments"
  ON public.task_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER trg_task_comments_updated
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.task_comments(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- saved_views
CREATE TABLE public.saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  route text NOT NULL DEFAULT 'tasks',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_saved_views_user ON public.saved_views(user_id, workspace_id);
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own saved views all"
  ON public.saved_views FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_saved_views_updated
  BEFORE UPDATE ON public.saved_views
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger function: comment -> notifications + activity
CREATE OR REPLACE FUNCTION public.handle_new_task_comment()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task public.tasks%ROWTYPE;
  v_mention uuid;
BEGIN
  SELECT * INTO v_task FROM public.tasks WHERE id = NEW.task_id;

  INSERT INTO public.activities (user_id, task_id, workspace_id, action, metadata)
  VALUES (NEW.user_id, NEW.task_id, v_task.workspace_id, 'commented',
          jsonb_build_object('comment_id', NEW.id, 'task_title', v_task.title));

  IF array_length(NEW.mentions, 1) > 0 THEN
    FOREACH v_mention IN ARRAY NEW.mentions LOOP
      IF v_mention <> NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, task_id, comment_id, workspace_id, actor_id, payload)
        VALUES (v_mention, 'mention', NEW.task_id, NEW.id, v_task.workspace_id, NEW.user_id,
                jsonb_build_object('task_title', v_task.title, 'preview', left(NEW.body, 200)));
      END IF;
    END LOOP;

    INSERT INTO public.activities (user_id, task_id, workspace_id, action, metadata)
    VALUES (NEW.user_id, NEW.task_id, v_task.workspace_id, 'mentioned',
            jsonb_build_object('mentioned', NEW.mentions, 'comment_id', NEW.id));
  END IF;

  IF v_task.assignee_id IS NOT NULL
     AND v_task.assignee_id <> NEW.user_id
     AND NOT (v_task.assignee_id = ANY(NEW.mentions)) THEN
    INSERT INTO public.notifications (user_id, type, task_id, comment_id, workspace_id, actor_id, payload)
    VALUES (v_task.assignee_id, 'comment', NEW.task_id, NEW.id, v_task.workspace_id, NEW.user_id,
            jsonb_build_object('task_title', v_task.title, 'preview', left(NEW.body, 200)));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_task_comment_inserted
  AFTER INSERT ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_task_comment();

-- Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_members;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
