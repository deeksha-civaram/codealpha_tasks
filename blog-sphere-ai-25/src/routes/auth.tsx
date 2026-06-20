import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ mode: (s.mode as string) === "signup" ? "signup" : "signin" }),
  head: () => ({ meta: [{ title: "Sign in — BlogSphere AI" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initial } = Route.useSearch();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        nav({ to: "/" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-5xl">{mode === "signup" ? "Begin writing." : "Welcome back."}</h1>
      <p className="mt-2 text-muted-foreground">{mode === "signup" ? "Create an account to publish and follow." : "Sign in to continue."}</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode === "signup" && (
          <div>
            <label className="text-xs uppercase tracking-[0.2em]">Full name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1" />
          </div>
        )}
        <div>
          <label className="text-xs uppercase tracking-[0.2em]">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em]">Password</label>
          <Input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1" />
        </div>
        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? "…" : mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>
      <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="mt-6 text-sm text-muted-foreground hover:underline">
        {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>
    </div>
  );
}