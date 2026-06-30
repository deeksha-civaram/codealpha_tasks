import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { AuthShell } from "./login";
import toast from "react-hot-toast";
import { z } from "zod";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({ meta: [{ title: "Create account — MINNAL" }] }),
});

const schema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
});

function RegisterPage() {
  const { signUp, user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [fullName, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!authLoading && user) nav({ to: "/dashboard" }); }, [user, authLoading, nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    const parsed = schema.safeParse({ fullName, email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) toast.error(error);
    else { toast.success("Welcome to MINNAL"); nav({ to: "/dashboard" }); }
  };

  return (
    <AuthShell title="Create your account" subtitle="Start shipping in under a minute.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" required value={fullName} onChange={(e) => setName(e.target.value)}
            className="mt-2 h-12" placeholder="Ada Lovelace" maxLength={80} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-2 h-12" placeholder="you@example.com" maxLength={255} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-2">
            <Input id="password" type={show ? "text" : "password"} required value={password}
              onChange={(e) => setPassword(e.target.value)} className="h-12 pr-10" placeholder="At least 8 characters" />
            <button type="button" onClick={() => setShow(!show)}
              aria-label={show ? "Hide password" : "Show password"}
              aria-pressed={show}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type={show ? "text" : "password"} required value={confirm}
            onChange={(e) => setConfirm(e.target.value)} className="mt-2 h-12" />
        </div>
        <Button type="submit" disabled={loading} className="w-full h-12 gradient-hero text-white border-0 glow group">
          {loading ? "Creating..." : <>Create account <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" /></>}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          Already have one? <Link to="/login" className="text-foreground font-medium hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
