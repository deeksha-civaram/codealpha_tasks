import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export function useNotifications(userId: string | undefined) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchAll();
    const channel = supabase
      .channel(`notifications-rt-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => setItems((p) => [payload.new as Notification, ...p].slice(0, 50))
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchAll]);

  const unread = items.filter((n) => !n.read_at).length;

  const markAllRead = async () => {
    if (!userId) return;
    const ids = items.filter((n) => !n.read_at).map((n) => n.id);
    if (ids.length === 0) return;
    setItems((p) => p.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
  };

  const markRead = async (id: string) => {
    setItems((p) => p.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  };

  return { items, loading, unread, markAllRead, markRead, refetch: fetchAll };
}
