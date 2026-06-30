import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Users, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/workspaces")({
  component: WorkspacesPage,
  head: () => ({ meta: [{ title: "Workspaces — MINNAL" }] }),
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40)
    + "-" + Math.random().toString(36).slice(2, 7);
}

function WorkspacesPage() {
  const { user } = useAuth();
  const { workspaces, loading, refresh, setCurrentId } = useWorkspace();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("workspaces")
      .insert({ name: name.trim(), slug: slugify(name), created_by: user.id })
      .select().single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Workspace created");
    setName(""); setOpen(false);
    await refresh();
    setCurrentId(data.id);
    nav({ to: "/workspaces/$id/members", params: { id: data.id } });
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold flex items-center gap-3">
              <Users className="w-7 h-7 text-primary" /> Workspaces
            </h1>
            <p className="text-muted-foreground mt-1 font-mono text-xs uppercase tracking-widest">
              Collaborate with your crew.
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="gradient-hero text-white border-0">
            <Plus className="w-4 h-4 mr-1.5" /> New workspace
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : workspaces.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">No workspaces yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create one to start collaborating.</p>
            <Button onClick={() => setOpen(true)} className="gradient-hero text-white border-0">
              <Plus className="w-4 h-4 mr-1.5" /> Create workspace
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {workspaces.map((w) => (
              <Link key={w.id} to="/workspaces/$id/members" params={{ id: w.id }}
                className="glass rounded-2xl p-5 hover:glow-cyan transition group">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-lg font-semibold">{w.name}</div>
                    <div className="text-xs font-mono text-muted-foreground mt-1">/{w.slug}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass">
          <DialogHeader><DialogTitle className="font-display text-2xl">New workspace</DialogTitle></DialogHeader>
          <form onSubmit={create} className="space-y-4">
            <div>
              <Label htmlFor="ws-name">Name</Label>
              <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} className="mt-1.5" placeholder="Acme Inc." />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating} className="gradient-hero text-white border-0">
                {creating ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
