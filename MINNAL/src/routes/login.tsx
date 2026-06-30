import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  head: () => ({ meta: [{ title: "Login — MINNAL" }] }),
});

function LoginPage() {
  const { signIn, user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const { redirect } = Route.useSearch();
  const target = (redirect && redirect.startsWith("/")) ? redirect : "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!authLoading && user) nav({ to: target }); }, [user, authLoading, nav, target]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) toast.error(error);
    else { toast.success("Welcome back"); nav({ to: target }); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Pick up where you left off.">
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-2 h-12" placeholder="you@example.com" />
        </div>
        <div>
          <div className="flex justify-between"><Label htmlFor="password">Password</Label>
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground">Forgot?</button>
          </div>
          <div className="relative mt-2">
            <Input id="password" type={show ? "text" : "password"} required value={password}
              onChange={(e) => setPassword(e.target.value)} className="h-12 pr-10" placeholder="••••••••" />
            <button type="button" onClick={() => setShow(!show)}
              aria-label={show ? "Hide password" : "Show password"}
              aria-pressed={show}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" disabled={loading} className="w-full h-12 gradient-hero text-white border-0 glow group">
          {loading ? "Signing in..." : <>Sign in <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" /></>}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          New here? <Link to="/register" className="text-foreground font-medium hover:underline">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex flex-1 relative gradient-hero p-12 flex-col justify-between text-white overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <Link to="/" className="relative flex items-center gap-2 font-display font-bold text-xl">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          MINNAL
        </Link>
        <div className="relative">
          <h2 className="font-display text-5xl font-bold leading-tight mb-4">
            Fast Tasks.<br/>Sharp Focus.
          </h2>
          <p className="text-white/80 max-w-md">
            Lightning-fast task management for makers who care about momentum.
          </p>
        </div>
        <div className="relative text-sm text-white/60">© {new Date().getFullYear()} MINNAL</div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 aurora-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 font-display font-bold text-lg mb-8">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            MINNAL
          </Link>
          <h1 className="font-display text-3xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground mb-8">{subtitle}</p>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
