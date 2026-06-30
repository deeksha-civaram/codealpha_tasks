
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

  INSERT INTO public.activities (user_id, task_id, task_title, workspace_id, action, metadata)
  VALUES (NEW.user_id, NEW.task_id, COALESCE(v_task.title, ''), v_task.workspace_id, 'commented',
          jsonb_build_object('comment_id', NEW.id));

  IF array_length(NEW.mentions, 1) > 0 THEN
    FOREACH v_mention IN ARRAY NEW.mentions LOOP
      IF v_mention <> NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, task_id, comment_id, workspace_id, actor_id, payload)
        VALUES (v_mention, 'mention', NEW.task_id, NEW.id, v_task.workspace_id, NEW.user_id,
                jsonb_build_object('task_title', v_task.title, 'preview', left(NEW.body, 200)));
      END IF;
    END LOOP;

    INSERT INTO public.activities (user_id, task_id, task_title, workspace_id, action, metadata)
    VALUES (NEW.user_id, NEW.task_id, COALESCE(v_task.title, ''), v_task.workspace_id, 'mentioned',
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

REVOKE EXECUTE ON FUNCTION public.handle_new_task_comment() FROM PUBLIC, anon, authenticated;
