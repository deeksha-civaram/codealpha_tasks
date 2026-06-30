import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  CheckCircle2, Zap, Layers, BarChart3, Smartphone,
  ArrowRight, Github, Twitter, Linkedin, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "MINNAL — Fast Tasks. Sharp Focus." },
      { name: "description", content: "MINNAL is a lightning-fast, real-time task manager built for makers who want fast tasks and sharp focus." },
    ],
  }),
});

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && user) nav({ to: "/dashboard" }); }, [user, loading, nav]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Aurora bg */}
      <div className="fixed inset-0 aurora-bg pointer-events-none -z-10" />
      <div className="fixed inset-0 grid-pattern opacity-[0.15] pointer-events-none -z-10" />

      <Nav />
      <main id="main">
        <Hero />
        <Marquee />
        <Features />
        <Preview />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <div className="w-8 h-8 rounded-lg gradient-hero glow flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          MINNAL
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#preview" className="hover:text-foreground transition">Preview</a>
          <a href="#testimonials" className="hover:text-foreground transition">Loved by</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
          <Link to="/register"><Button size="sm" className="gradient-hero text-white border-0 hover:opacity-90">Get started</Button></Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="max-w-4xl"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground glass mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          New — Real-time sync across devices
        </div>
        <h1 className="font-display text-6xl md:text-8xl font-bold leading-[0.95] tracking-tight">
          Fast Tasks. <br /><span className="gradient-text">Sharp Focus.</span>
        </h1>
        <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          MINNAL is a lightning-fast task manager for makers who want momentum without the bloat.
          Capture, categorize, and ship — every change syncs in real time.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link to="/register">
            <Button size="lg" className="gradient-hero text-white border-0 hover:opacity-90 glow group">
              Start building free
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
            </Button>
          </Link>
          <a href="#preview">
            <Button size="lg" variant="outline" className="glass">See it in action</Button>
          </a>
        </div>
        <div className="mt-12 flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex -space-x-2">
            {[290, 0, 200, 75].map((h) => (
              <div key={h} className="w-8 h-8 rounded-full border-2 border-background"
                style={{ background: `oklch(0.7 0.2 ${h})` }} />
            ))}
          </div>
          <div>
            <div className="flex items-center gap-1 text-foreground">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />
              ))}
            </div>
            <span>2,400+ makers shipping daily</span>
          </div>
        </div>
      </motion.div>

      {/* Floating preview card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
        className="hidden lg:block absolute right-6 top-32 w-[420px]"
      >
        <div className="glass rounded-2xl p-6 elevated rotate-3 hover:rotate-0 transition-transform duration-500">
          <div className="text-xs text-muted-foreground mb-3">Today · 4 tasks</div>
          {[
            { t: "Ship onboarding flow", p: "high", done: true },
            { t: "Review design system", p: "medium", done: false },
            { t: "Reply to investor email", p: "high", done: false },
            { t: "Draft Q2 roadmap", p: "low", done: false },
          ].map((task, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
              <CheckCircle2 className={`w-4 h-4 ${task.done ? "text-success" : "text-muted-foreground"}`} />
              <span className={`flex-1 text-sm ${task.done ? "line-through text-muted-foreground" : ""}`}>{task.t}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                task.p === "high" ? "bg-accent/20 text-accent" :
                task.p === "medium" ? "bg-warning/20 text-warning" :
                "bg-muted text-muted-foreground"
              }`}>{task.p}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function Marquee() {
  const items = ["FOCUS", "SHIP", "REPEAT", "FOCUS", "SHIP", "REPEAT", "FOCUS", "SHIP"];
  return (
    <div className="border-y border-border/50 py-6 overflow-hidden bg-card/30">
      <div className="flex gap-12 animate-[marquee_30s_linear_infinite] whitespace-nowrap">
        {items.concat(items).map((w, i) => (
          <span key={i} className="font-display text-3xl font-bold text-muted-foreground">
            {w} <span className="text-accent">·</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

function Features() {
  const features = [
    { icon: Layers, title: "Kanban that flows", desc: "Drag tasks across pending, in-progress, and done. Position saves instantly." },
    { icon: Zap, title: "Real-time everywhere", desc: "Update on your laptop, see it on your phone. No refresh, no friction." },
    { icon: BarChart3, title: "Analytics that motivate", desc: "Visualize momentum. Track priority distribution. Celebrate the streaks." },
    { icon: Smartphone, title: "Mobile-first finishes", desc: "Hamburger menus, scrollable surfaces, optimized typography. Looks great anywhere." },
    { icon: Zap, title: "Beautiful by default", desc: "Glassmorphic surfaces. Bold gradients. Editorial spacing. No defaults." },
    { icon: CheckCircle2, title: "Filters & search", desc: "Pinpoint tasks by priority, status, or query. Instant, no lag." },
  ];
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-32">
      <div className="max-w-2xl mb-16">
        <div className="text-sm text-accent font-medium mb-3">FEATURES</div>
        <h2 className="font-display text-4xl md:text-5xl font-bold">
          Built for makers who <span className="gradient-text">hate friction</span>.
        </h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="glass rounded-2xl p-8 hover:-translate-y-1 transition-transform group"
          >
            <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mb-5 group-hover:glow transition">
              <f.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">{f.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Preview() {
  return (
    <section id="preview" className="max-w-7xl mx-auto px-6 py-32">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="text-sm text-accent font-medium mb-3">THE INTERFACE</div>
        <h2 className="font-display text-4xl md:text-5xl font-bold">
          Designed for <span className="gradient-text">deep focus</span>.
        </h2>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass rounded-3xl p-2 elevated"
      >
        <div className="rounded-2xl bg-background p-8 grid grid-cols-3 gap-4">
          {(["Pending", "In Progress", "Completed"] as const).map((col, ci) => (
            <div key={col}>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  ci === 0 ? "bg-warning" : ci === 1 ? "bg-primary" : "bg-success"
                }`} />
                {col}
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-3 mb-2">
                  <div className="h-2 bg-muted rounded mb-2 w-3/4" />
                  <div className="h-2 bg-muted/50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function Testimonials() {
  const t = [
    { q: "Replaced three tools. The drag-and-drop alone is worth it.", a: "Maya K.", r: "Indie founder" },
    { q: "Fastest task app I've used. The dark mode is genuinely beautiful.", a: "Luca P.", r: "Designer" },
    { q: "Finally, a productivity tool that doesn't feel like enterprise software.", a: "Aiko T.", r: "Engineer" },
  ];
  return (
    <section id="testimonials" className="max-w-7xl mx-auto px-6 py-32">
      <div className="grid md:grid-cols-3 gap-6">
        {t.map((x, i) => (
          <div key={i} className="glass rounded-2xl p-8">
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="w-4 h-4 fill-warning text-warning" />)}
            </div>
            <p className="font-display text-lg leading-relaxed mb-6">"{x.q}"</p>
            <div className="text-sm">
              <div className="font-semibold">{x.a}</div>
              <div className="text-muted-foreground">{x.r}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-32">
      <div className="relative rounded-3xl overflow-hidden gradient-hero p-12 md:p-20 text-center glow">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="relative">
          <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-6">
            Ship more. Stress less.
          </h2>
          <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
            Join thousands of makers using MINNAL to keep their week on rails.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 border-0">
              Start free — no card needed
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-6 h-6 rounded gradient-hero" />
          © {new Date().getFullYear()} MINNAL. Made with focus.
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <a href="#" aria-label="MINNAL on Twitter" className="hover:text-foreground"><Twitter className="w-4 h-4" /></a>
          <a href="#" aria-label="MINNAL on GitHub" className="hover:text-foreground"><Github className="w-4 h-4" /></a>
          <a href="#" aria-label="MINNAL on LinkedIn" className="hover:text-foreground"><Linkedin className="w-4 h-4" /></a>
        </div>
      </div>
    </footer>
  );
}
