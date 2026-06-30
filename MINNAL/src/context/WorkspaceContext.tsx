import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type Workspace = { id: string; name: string; slug: string; created_by: string; created_at: string };
export type WorkspaceMember = {
  id: string; workspace_id: string; user_id: string;
  role: "owner" | "admin" | "member"; created_at: string;
  profile?: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

type WsCtx = {
  workspaces: Workspace[];
  current: Workspace | null;
  /** "personal" or workspace id */
  currentId: string;
  setCurrentId: (id: string) => void;
  members: WorkspaceMember[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<WsCtx | null>(null);
const KEY = "minnal:workspace";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [currentId, setCurrentIdState] = useState<string>(
    (typeof window !== "undefined" && localStorage.getItem(KEY)) || "personal"
  );
  const [loading, setLoading] = useState(true);

  const setCurrentId = (id: string) => {
    setCurrentIdState(id);
    if (typeof window !== "undefined") localStorage.setItem(KEY, id);
  };

  const refresh = useCallback(async () => {
    if (!user) { setWorkspaces([]); setMembers([]); setLoading(false); return; }
    const { data: ws } = await supabase
      .from("workspaces").select("*").order("created_at", { ascending: true });
    setWorkspaces(ws ?? []);
    if (currentId !== "personal" && !ws?.some((w) => w.id === currentId)) {
      setCurrentId("personal");
    }
    setLoading(false);
  }, [user, currentId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Load members for the current workspace
  useEffect(() => {
    if (currentId === "personal") { setMembers([]); return; }
    let alive = true;
    (async () => {
      const { data: m } = await supabase
        .from("workspace_members").select("*").eq("workspace_id", currentId);
      if (!alive || !m) return;
      const ids = m.map((x) => x.user_id);
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids)
        : { data: [] as any[] };
      const byId = new Map((profs ?? []).map((p: any) => [p.id, p]));
      setMembers(m.map((x) => ({ ...x, profile: byId.get(x.user_id) ?? null })) as WorkspaceMember[]);
    })();
    return () => { alive = false; };
  }, [currentId]);

  const current = workspaces.find((w) => w.id === currentId) ?? null;

  return (
    <Ctx.Provider value={{ workspaces, current, currentId, setCurrentId, members, loading, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWorkspace = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return c;
};
