import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Activity = Database["public"]["Tables"]["activities"]["Row"];
export type ActivityAction = Database["public"]["Enums"]["activity_action"];

export type LogInput = {
  task_id: string | null;
  task_title: string;
  action: ActivityAction;
  old_value?: string | null;
  new_value?: string | null;
  workspace_id?: string | null;
};

/**
 * @param scope "personal" → only my personal-context activities; or workspace UUID for workspace activities; or "all" for everything I can see.
 */
export function useActivities(userId: string | undefined, limit = 50, scope: string = "all") {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    let q = supabase.from("activities").select("*");
    if (scope === "personal") q = q.is("workspace_id", null).eq("user_id", userId);
    else if (scope !== "all") q = q.eq("workspace_id", scope);
    const { data } = await q.order("created_at", { ascending: false }).limit(limit);
    setActivities(data ?? []);
    setLoading(false);
  }, [userId, limit, scope]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchAll();
    const channel = supabase
      .channel(`activities-rt-${scope}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activities" }, (payload) => {
        const row = payload.new as Activity;
        if (scope === "personal" && (row.workspace_id || row.user_id !== userId)) return;
        if (scope !== "all" && scope !== "personal" && row.workspace_id !== scope) return;
        setActivities((prev) => [row, ...prev].slice(0, limit));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, limit, scope, fetchAll]);

  return { activities, loading, refetch: fetchAll };
}

export async function logActivity(userId: string, input: LogInput) {
  await supabase.from("activities").insert({ ...input, user_id: userId });
}
