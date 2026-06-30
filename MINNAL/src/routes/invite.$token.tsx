import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Zap, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/invite/$token")({
  component: InvitePage,
  head: () => ({ meta: [{ title: "Join workspace — MINNAL" }] }),
});

type Inv = {
  id: string; workspace_id: string; email: string;
  role: "owner" | "admin" | "member"; status: string; expires_at: string;
};

function InvitePage() {
  const { token } = Route.useParams();
  const { user, loading } = useAuth();
  const { refresh, setCurrentId } = useWorkspace();
  const nav = useNavigate();
  const [inv, setInv] = useState<Inv | null>(null);
  const [wsName, setWsName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/login", search: { redirect: `/invite/${token}` } as any }); return; }
    (async () => {
      const { data, error } = await supabase.from("invitations").select("*").eq("token", token).maybeSingle();
      if (error || !data) { setError("Invitation not found or expired."); return; }
      setInv(data as Inv);
      const { data: ws } = await supabase.from("workspaces").select("name").eq("id", data.workspace_id).maybeSingle();
      setWsName(ws?.name ?? "");
    })();
  }, [token, user, loading, nav]);

  const accept = async () => {
    if (!inv || !user) return;
    if (user.email && user.email.toLowerCase() !== inv.email.toLowerCase()) {
      toast.error(`This invite is for ${inv.email}. Sign in with that email.`);
      return;
    }
    if (inv.status !== "pending") { setError(`Invitation is ${inv.status}.`); return; }
    if (new Date(inv.expires_at) < new Date()) { setError("Invitation expired."); return; }
    setAccepting(true);
    const { error: insErr } = await supabase.from("workspace_members").insert({
      workspace_id: inv.workspace_id, user_id: user.id, role: inv.role,
    });
    if (insErr && !insErr.message.includes("duplicate")) {
      setAccepting(false); toast.error(insErr.message); return;
    }
    await supabase.from("invitations").update({ status: "accepted" }).eq("id", inv.id);
    setAccepting(false);
    setDone(true);
    toast.success("Welcome to the workspace");
    await refresh();
    setCurrentId(inv.workspace_id);
    setTimeout(() => nav({ to: "/dashboard" }), 900);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 aurora-bg opacity-60 pointer-events-none -z-10" />
      <div className="glass rounded-3xl p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl gradient-hero glow flex items-center justify-center mb-4">
          <Zap className="w-6 h-6 text-white" fill="white" />
        </div>
        {error ? (
          <>
            <XCircle className="w-10 h-10 mx-auto text-destructive mb-2" />
            <h1 className="font-display text-2xl font-bold">Can't accept invite</h1>
            <p className="text-muted-foreground mt-2">{error}</p>
            <Button onClick={() => nav({ to: "/dashboard" })} className="mt-6 gradient-hero text-white border-0">Go to dashboard</Button>
          </>
        ) : !inv ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : done ? (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto text-success mb-2" />
            <h1 className="font-display text-2xl font-bold">You're in</h1>
            <p className="text-muted-foreground mt-2">Redirecting…</p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Join {wsName || "workspace"}</h1>
            <p className="text-muted-foreground mt-2">
              You've been invited as <span className="text-foreground font-medium">{inv.role}</span>.
            </p>
            <Button onClick={accept} disabled={accepting} className="mt-6 gradient-hero text-white border-0 w-full">
              {accepting ? "Joining…" : "Accept invitation"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
