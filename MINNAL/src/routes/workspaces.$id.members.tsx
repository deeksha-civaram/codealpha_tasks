import { useEffect, useState, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Copy, Mail, Trash2, UserPlus, Crown, Shield, User as UserIcon, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/workspaces/$id/members")({
  component: MembersPage,
  head: () => ({ meta: [{ title: "Members — MINNAL" }] }),
});

type Invite = {
  id: string; email: string; role: "owner" | "admin" | "member";
  token: string; status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string; created_at: string;
};

const ROLE_ICON = { owner: Crown, admin: Shield, member: UserIcon } as const;

function MembersPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { workspaces, members, currentId, setCurrentId, refresh } = useWorkspace();
  const ws = workspaces.find((w) => w.id === id);

  useEffect(() => { if (currentId !== id) setCurrentId(id); }, [id, currentId, setCurrentId]);

  const myRole = members.find((m) => m.user_id === user?.id)?.role;
  const canManage = myRole === "owner" || myRole === "admin";

  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingInv, setLoadingInv] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [sending, setSending] = useState(false);

  const fetchInvites = useCallback(async () => {
    const { data } = await supabase.from("invitations").select("*")
      .eq("workspace_id", id).order("created_at", { ascending: false });
    setInvites((data ?? []) as Invite[]);
    setLoadingInv(false);
  }, [id]);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("invitations").insert({
      workspace_id: id, email: email.trim().toLowerCase(), role, invited_by: user.id,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Invitation created");
    setEmail("");
    fetchInvites();
  };

  const revoke = async (inv: Invite) => {
    const { error } = await supabase.from("invitations").update({ status: "revoked" }).eq("id", inv.id);
    if (error) return toast.error(error.message);
    toast.success("Invitation revoked");
    fetchInvites();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  };

  const removeMember = async (memberUserId: string) => {
    const m = members.find((x) => x.user_id === memberUserId);
    if (!m) return;
    const { error } = await supabase.from("workspace_members").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    refresh();
  };

  if (!ws) {
    return <DashboardShell><div className="text-muted-foreground">Workspace not found.</div></DashboardShell>;
  }

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-4xl">
        <div>
          <Link to="/workspaces" className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3 h-3" /> Workspaces
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">{ws.name}</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs uppercase tracking-widest">/{ws.slug}</p>
        </div>

        {canManage && (
          <div className="glass rounded-2xl p-5">
            <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" /> Invite a teammate
            </h2>
            <form onSubmit={invite} className="grid sm:grid-cols-[1fr_140px_auto] gap-2">
              <div>
                <Label htmlFor="inv-email" className="sr-only">Email</Label>
                <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@company.com" required />
              </div>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={sending} className="gradient-hero text-white border-0">
                {sending ? "Creating…" : "Invite"}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">A shareable invite link is generated. Send it to your teammate by any channel.</p>
          </div>
        )}

        <div className="glass rounded-2xl p-5">
          <h2 className="font-display text-lg font-semibold mb-4">Members ({members.length})</h2>
          <ul className="divide-y divide-border">
            {members.map((m) => {
              const RoleIcon = ROLE_ICON[m.role];
              const isMe = m.user_id === user?.id;
              return (
                <li key={m.id} className="py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full gradient-hero text-white text-sm font-semibold flex items-center justify-center">
                    {(m.profile?.full_name ?? "U")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {m.profile?.full_name ?? "Member"} {isMe && <span className="text-muted-foreground text-xs">(you)</span>}
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1"><RoleIcon className="w-3 h-3" />{m.role}</Badge>
                  {canManage && m.role !== "owner" && !isMe && (
                    <Button variant="ghost" size="icon" onClick={() => removeMember(m.user_id)} aria-label="Remove">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {canManage && (
          <div className="glass rounded-2xl p-5">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> Invitations
            </h2>
            {loadingInv ? (
              <div className="text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
            ) : invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invitations yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {invites.map((inv) => (
                  <li key={inv.id} className="py-3 flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{inv.email}</div>
                      <div className="text-xs text-muted-foreground font-mono">{inv.role} · {inv.status}</div>
                    </div>
                    {inv.status === "pending" && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => copyLink(inv.token)}>
                          <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy link
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => revoke(inv)}>Revoke</Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
