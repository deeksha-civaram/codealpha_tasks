import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SavedView = Database["public"]["Tables"]["saved_views"]["Row"];

export function useSavedViews(userId: string | undefined, route: string, workspaceId: string) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    let q = supabase.from("saved_views").select("*")
      .eq("user_id", userId).eq("route", route)
      .order("created_at", { ascending: false });
    q = workspaceId === "personal"
      ? q.is("workspace_id", null)
      : q.eq("workspace_id", workspaceId);
    const { data } = await q;
    setViews(data ?? []);
    setLoading(false);
  }, [userId, route, workspaceId]);

  useEffect(() => { setLoading(true); fetchAll(); }, [fetchAll]);

  const save = async (name: string, filters: Record<string, unknown>) => {
    if (!userId || !name.trim()) return;
    const { error } = await supabase.from("saved_views").insert({
      user_id: userId, route, name: name.trim(),
      filters: filters as unknown as import("@/integrations/supabase/types").Json,
      workspace_id: workspaceId === "personal" ? null : workspaceId,
    });
    if (error) throw error;
    await fetchAll();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("saved_views").delete().eq("id", id);
    if (error) throw error;
    setViews((p) => p.filter((v) => v.id !== id));
  };

  return { views, loading, save, remove, refetch: fetchAll };
}
