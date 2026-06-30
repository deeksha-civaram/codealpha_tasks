import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TaskComment = Database["public"]["Tables"]["task_comments"]["Row"] & {
  profile?: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

export function useComments(taskId: string | undefined) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!taskId) return;
    const { data } = await supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    const rows = data ?? [];
    const ids = Array.from(new Set(rows.map((c) => c.user_id)));
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids)
      : { data: [] as any[] };
    const byId = new Map((profs ?? []).map((p: any) => [p.id, p]));
    setComments(rows.map((c) => ({ ...c, profile: byId.get(c.user_id) ?? null })));
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    fetchAll();
    const channel = supabase
      .channel(`comments-rt-${taskId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_comments", filter: `task_id=eq.${taskId}` },
        () => fetchAll()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [taskId, fetchAll]);

  const add = async (
    userId: string,
    body: string,
    mentions: string[] = [],
    parentId: string | null = null,
  ) => {
    if (!taskId || !body.trim()) return;
    const { error } = await supabase.from("task_comments").insert({
      task_id: taskId, user_id: userId, body: body.trim(),
      mentions, parent_id: parentId,
    });
    if (error) throw error;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("task_comments").delete().eq("id", id);
    if (error) throw error;
  };

  return { comments, loading, add, remove, refetch: fetchAll };
}
