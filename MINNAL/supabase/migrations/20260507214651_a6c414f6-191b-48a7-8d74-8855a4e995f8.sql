CREATE TYPE public.activity_action AS ENUM (
  'created','updated','status_changed','priority_changed',
  'category_changed','due_date_changed','completed','deleted'
);

CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_id uuid,
  task_title text NOT NULL,
  action public.activity_action NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX activities_user_created_idx ON public.activities (user_id, created_at DESC);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY activities_select_own ON public.activities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY activities_insert_own ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY activities_delete_own ON public.activities
  FOR DELETE USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER TABLE public.activities REPLICA IDENTITY FULL;