import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ListTodo, CheckCircle2, Clock, AlertCircle, TrendingUp, Plus, Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useTaskActions } from "@/hooks/useTaskActions";
import { TaskListView } from "@/components/tasks/TaskListView";
import { StatCardSkeleton } from "@/components/tasks/TaskSkeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Button } from "@/components/ui/button";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — MINNAL" },
      { name: "description", content: "Your MINNAL dashboard: at-a-glance stats, recent tasks, and momentum charts to keep focused work moving." },
      { property: "og:title", content: "Dashboard — MINNAL" },
      { property: "og:description", content: "Your MINNAL dashboard: at-a-glance stats, recent tasks, and momentum charts to keep focused work moving." },
      { property: "og:url", content: "https://minnal.lovable.app/dashboard" },
    ],
    links: [{ rel: "canonical", href: "https://minnal.lovable.app/dashboard" }],
  }),
});

function Dashboard() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const { tasks: t, onCreate, onEdit, onToggle, setDeleteId, Dialogs } = useTaskActions(user?.id);
  const { tasks, loading } = t;

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(x => x.status === "completed").length,
    pending: tasks.filter(x => x.status === "pending").length,
    inProgress: tasks.filter(x => x.status === "in_progress").length,
    high: tasks.filter(x => x.priority === "high" && x.status !== "completed").length,
  }), [tasks]);

  return (
    <DashboardShell search={search} onSearch={setSearch} alert={stats.high > 0}>
      <div className="space-y-8">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold flex items-center gap-3">
              Fast Tasks. <span className="gradient-text">Sharp Focus.</span>
            </h1>
            <p className="text-muted-foreground mt-1 font-mono text-xs uppercase tracking-widest">
              {tasks.length} task{tasks.length === 1 ? "" : "s"} · realtime sync online
            </p>
          </div>
          <Button onClick={onCreate} className="gradient-hero text-primary-foreground border-0 glow-cyan hidden sm:inline-flex">
            <Plus className="w-4 h-4 mr-1" /> New task
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            : (
              <>
                <StatCard label="Total" value={stats.total} icon={ListTodo} accent="primary" />
                <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} accent="success" />
                <StatCard label="Pending" value={stats.pending} icon={Clock} accent="warning" />
                <StatCard label="High Priority" value={stats.high} icon={AlertCircle} accent="destructive" />
              </>
            )}
        </div>

        {!loading && tasks.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-4">
            <ChartCard title="Status breakdown">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Pending", value: stats.pending, fill: "var(--color-warning)" },
                      { name: "In Progress", value: stats.inProgress, fill: "var(--color-primary)" },
                      { name: "Completed", value: stats.completed, fill: "var(--color-success)" },
                    ].filter(d => d.value > 0)}
                    innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value"
                  >{[0,1,2].map(i => <Cell key={i} />)}</Pie>
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="By priority" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: "Low", count: tasks.filter(x => x.priority === "low").length },
                  { name: "Medium", count: tasks.filter(x => x.priority === "medium").length },
                  { name: "High", count: tasks.filter(x => x.priority === "high").length },
                ]}>
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} cursor={{ fill: "var(--color-muted)" }} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        <TaskListView
          tasks={tasks} loading={loading} search={search}
          onCreate={onCreate} onEdit={onEdit} onToggle={onToggle}
          onDelete={(id) => setDeleteId(id)}
        />
      </div>

      <motion.button
        onClick={onCreate}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full gradient-hero glow-cyan text-primary-foreground flex items-center justify-center shadow-2xl"
        aria-label="New task"
      >
        <Plus className="w-6 h-6" />
      </motion.button>
      {Dialogs}
    </DashboardShell>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: any; accent: string }) {
  const colors: Record<string, string> = {
    primary: "from-primary/30 to-primary/0 text-primary",
    success: "from-success/30 to-success/0 text-success",
    warning: "from-warning/30 to-warning/0 text-warning",
    destructive: "from-destructive/30 to-destructive/0 text-destructive",
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }}
      className="glass rounded-2xl p-5 relative overflow-hidden hover:glow-cyan transition-shadow">
      <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${colors[accent]} blur-2xl opacity-60`} />
      <div className="flex items-center justify-between relative">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">{label}</div>
          <div className="font-display text-3xl font-bold mt-1 tabular-nums">
            <AnimatedCounter value={value} />
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[accent]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      <div className="text-sm font-medium mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" /> {title}
      </div>
      {children}
    </div>
  );
}

// keep an unused import suppressed
void Zap;
