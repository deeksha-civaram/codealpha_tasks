import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, User as UserIcon, Lock, Save, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import toast from "react-hot-toast";
import { z } from "zod";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — MINNAL" }] }),
});

const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(80),
});
const passwordSchema = z.object({
  current: z.string().min(1, "Current password required"),
  next: z.string().min(8, "Min 8 characters").max(72),
  confirm: z.string(),
}).refine((v) => v.next === v.confirm, { message: "Passwords don't match", path: ["confirm"] });

function SettingsPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setFullName(data?.full_name ?? ""));
  }, [user?.id]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = profileSchema.safeParse({ fullName });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("id", user.id);
    setSavingProfile(false);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = passwordSchema.safeParse({ current, next, confirm });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!user?.email) return;
    setSavingPwd(true);
    // Re-verify current password
    const { error: signErr } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
    if (signErr) { setSavingPwd(false); toast.error("Current password is incorrect"); return; }
    const { error } = await supabase.auth.updateUser({ password: next });
    setSavingPwd(false);
    if (error) { toast.error(error.message); return; }
    setCurrent(""); setNext(""); setConfirm("");
    toast.success("Password updated");
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-primary" /> Settings
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs uppercase tracking-widest">
            Tune your profile and security.
          </p>
        </div>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 space-y-5 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full gradient-hero text-primary-foreground text-xl font-bold flex items-center justify-center glow-cyan">
              {(user?.email ?? "U")[0].toUpperCase()}
            </div>
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-2"><UserIcon className="w-3.5 h-3.5" /> Profile</div>
              <div className="font-medium">{user?.email}</div>
            </div>
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} className="mt-2 h-11" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled className="mt-2 h-11 opacity-70" />
              <p className="text-xs text-muted-foreground mt-1">Email is tied to your sign-in. Contact support to change it.</p>
            </div>
            <Button type="submit" disabled={savingProfile} className="gradient-hero text-primary-foreground border-0 glow-cyan">
              <Save className="w-4 h-4 mr-1" /> {savingProfile ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" /> Change password
          </div>
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <Label htmlFor="cur">Current password</Label>
              <div className="relative mt-2">
                <Input id="cur" type={show ? "text" : "password"} value={current} onChange={(e) => setCurrent(e.target.value)} className="h-11 pr-10" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle password visibility">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="next">New password</Label>
                <Input id="next" type={show ? "text" : "password"} value={next} onChange={(e) => setNext(e.target.value)} className="mt-2 h-11" placeholder="At least 8 characters" />
              </div>
              <div>
                <Label htmlFor="cf">Confirm new password</Label>
                <Input id="cf" type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-2 h-11" />
              </div>
            </div>
            <Button type="submit" disabled={savingPwd} className="gradient-hero text-primary-foreground border-0 glow-cyan">
              <Lock className="w-4 h-4 mr-1" /> {savingPwd ? "Updating..." : "Update password"}
            </Button>
          </form>
        </motion.section>
      </div>
    </DashboardShell>
  );
}
