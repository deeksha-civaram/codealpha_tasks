import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Plus, Pencil, Trash2, CheckCircle2, ArrowRightLeft, Flag, Tag, CalendarClock, UserPlus, UserMinus, MessageSquare, AtSign, Activity as ActivityIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useActivities, type Activity, type ActivityAction } from "@/hooks/useActivities";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/activity")({
  component: ActivityPage,
  head: () => ({ meta: [{ title: "Activity — MINNAL" }] }),
});

const META: Record<ActivityAction, { icon: any; tone: string; label: (a: Activity) => string }> = {
  created:          { icon: Plus,            tone: "text-primary",     label: (a) => `Created “${a.task_title}”` },
  updated:          { icon: Pencil,          tone: "text-foreground",  label: (a) => `Updated “${a.task_title}”` },
  status_changed:   { icon: ArrowRightLeft,  tone: "text-primary",     label: (a) => `Moved “${a.task_title}” to ${pretty(a.new_value)}` },
  priority_changed: { icon: Flag,            tone: "text-warning",     label: (a) => `Priority of “${a.task_title}” → ${pretty(a.new_value)}` },
  category_changed: { icon: Tag,             tone: "text-accent",      label: (a) => `Category of “${a.task_title}” → ${pretty(a.new_value)}` },
  due_date_changed: { icon: CalendarClock,   tone: "text-warning",     label: (a) => `Due date updated on “${a.task_title}”` },
  completed:        { icon: CheckCircle2,    tone: "text-success",     label: (a) => `Completed “${a.task_title}”` },
  deleted:          { icon: Trash2,          tone: "text-destructive", label: (a) => `Deleted “${a.task_title}”` },
  assigned:         { icon: UserPlus,        tone: "text-accent",      label: (a) => `Assigned “${a.task_title}”` },
  unassigned:       { icon: UserMinus,       tone: "text-muted-foreground", label: (a) => `Unassigned “${a.task_title}”` },
  commented:        { icon: MessageSquare,   tone: "text-primary",     label: (a) => `Commented on “${a.task_title}”` },
  mentioned:        { icon: AtSign,          tone: "text-accent",      label: (a) => `Mentioned teammates on “${a.task_title}”` },
};

const pretty = (s?: string | null) => (s ?? "").replace("_", " ");

function ActivityPage() {
  const { user } = useAuth();
  const { activities, loading } = useActivities(user?.id, 100);

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold flex items-center gap-3">
            <ActivityIcon className="w-7 h-7 text-primary" /> Activity
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs uppercase tracking-widest">
            Live timeline of every change.
          </p>
        </div>

        <div className="glass rounded-2xl p-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <ActivityIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No activity yet</p>
              <p className="text-sm text-muted-foreground">Create or update a task to start the timeline.</p>
            </div>
          ) : (
            <ol className="relative">
              <span className="absolute left-[18px] top-2 bottom-2 w-px bg-border" />
              <AnimatePresence initial={false}>
                {activities.map((a) => {
                  const m = META[a.action];
                  const Icon = m.icon;
                  return (
                    <motion.li
                      key={a.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="relative flex gap-4 pb-5 last:pb-0"
                    >
                      <div className={`relative z-10 w-9 h-9 rounded-full glass flex items-center justify-center ${m.tone}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">{m.label(a)}</div>
                        {a.old_value && a.new_value && a.action !== "status_changed" && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            <span className="line-through">{pretty(a.old_value)}</span>{" → "}
                            <span className="text-foreground">{pretty(a.new_value)}</span>
                          </div>
                        )}
                        <div className="text-[11px] text-muted-foreground font-mono mt-1">
                          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ol>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
