import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { logActivity } from "./useActivities";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];
export type TaskCategory = Database["public"]["Enums"]["task_category"];

export const CATEGORIES: TaskCategory[] = ["work", "personal", "study", "health", "shopping", "other"];

export type TaskInput = {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  due_date?: string | null;
  position?: number;
  workspace_id?: string | null;
  assignee_id?: string | null;
};

/**
 * @param workspaceId "personal" for own personal tasks; or a workspace UUID.
 */
export function useTasks(userId: string | undefined, workspaceId: string = "personal") {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    let q = supabase.from("tasks").select("*");
    if (workspaceId === "personal") {
      q = q.is("workspace_id", null).eq("user_id", userId);
    } else {
      q = q.eq("workspace_id", workspaceId);
    }
    const { data } = await q
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });
    setTasks(data ?? []);
    setLoading(false);
  }, [userId, workspaceId]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchAll();
    const filter = workspaceId === "personal"
      ? `user_id=eq.${userId}`
      : `workspace_id=eq.${workspaceId}`;
    const channel = supabase
      .channel(`tasks-rt-${workspaceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, workspaceId, fetchAll]);

  const wsId = workspaceId === "personal" ? null : workspaceId;

  const create = async (input: TaskInput) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...input, user_id: userId, workspace_id: input.workspace_id ?? wsId })
      .select()
      .single();
    if (error) throw error;
    await logActivity(userId, {
      task_id: data.id, task_title: data.title, action: "created", new_value: data.status, workspace_id: data.workspace_id,
    });
  };

  const update = async (id: string, patch: Partial<TaskInput>) => {
    if (!userId) return;
    const before = tasks.find((t) => t.id === id);
    const { data, error } = await supabase.from("tasks").update(patch).eq("id", id).select().single();
    if (error) throw error;
    if (before) {
      const fields: Array<[keyof TaskInput, any]> = [
        ["status", before.status], ["priority", before.priority],
        ["category", before.category], ["due_date", before.due_date],
      ];
      const map: Record<string, any> = {
        status: "status_changed", priority: "priority_changed",
        category: "category_changed", due_date: "due_date_changed",
      };
      let logged = false;
      for (const [field, oldVal] of fields) {
        if (patch[field] !== undefined && String(patch[field]) !== String(oldVal)) {
          const action = field === "status" && patch.status === "completed" ? "completed" : map[field as string];
          await logActivity(userId, {
            task_id: id, task_title: data.title, action,
            old_value: String(oldVal ?? ""), new_value: String(patch[field] ?? ""),
            workspace_id: data.workspace_id,
          });
          logged = true;
        }
      }
      if (patch.assignee_id !== undefined && patch.assignee_id !== before.assignee_id) {
        await logActivity(userId, {
          task_id: id, task_title: data.title,
          action: patch.assignee_id ? "assigned" : "unassigned",
          old_value: before.assignee_id ?? null, new_value: patch.assignee_id ?? null,
          workspace_id: data.workspace_id,
        });
        logged = true;
      }
      if (!logged && (patch.title !== undefined || patch.description !== undefined)) {
        await logActivity(userId, { task_id: id, task_title: data.title, action: "updated", workspace_id: data.workspace_id });
      }
    }
  };

  const remove = async (id: string) => {
    if (!userId) return;
    const before = tasks.find((t) => t.id === id);
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
    if (before) await logActivity(userId, {
      task_id: null, task_title: before.title, action: "deleted", workspace_id: before.workspace_id,
    });
  };

  const reorder = async (updates: { id: string; position: number; status?: TaskStatus }[]) => {
    if (!userId || updates.length === 0) return;
    setTasks((prev) => {
      const map = new Map(updates.map((u) => [u.id, u]));
      return prev.map((t) => {
        const u = map.get(t.id);
        return u ? { ...t, position: u.position, status: u.status ?? t.status } : t;
      }).sort((a, b) => a.position - b.position);
    });
    await Promise.all(updates.map((u) =>
      supabase.from("tasks").update({ position: u.position, ...(u.status ? { status: u.status } : {}) }).eq("id", u.id)
    ));
  };

  return { tasks, loading, create, update, remove, reorder, refetch: fetchAll };
}
