import type { TaskCategory, TaskPriority } from "@/hooks/useTasks";

export const CATEGORY_META: Record<TaskCategory, { label: string; className: string }> = {
  work:     { label: "Work",     className: "bg-primary/15 text-primary border-primary/30" },
  personal: { label: "Personal", className: "bg-accent/15 text-accent border-accent/30" },
  study:    { label: "Study",    className: "bg-chart-3/15 text-chart-3 border-chart-3/30" },
  health:   { label: "Health",   className: "bg-success/15 text-success border-success/30" },
  shopping: { label: "Shopping", className: "bg-warning/15 text-warning border-warning/30" },
  other:    { label: "Other",    className: "bg-muted text-muted-foreground border-border" },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; className: string; ring: string }> = {
  low:    { label: "Low",    className: "bg-success/15 text-success border-success/40",       ring: "before:bg-success" },
  medium: { label: "Medium", className: "bg-warning/20 text-warning border-warning/40",       ring: "before:bg-warning" },
  high:   { label: "High",   className: "bg-destructive/20 text-destructive border-destructive/50", ring: "before:bg-destructive" },
};

export type DueInfo = {
  label: string;
  tone: "overdue" | "today" | "soon" | "later" | "none";
  className: string;
};

export function getDueInfo(due?: string | null, completed = false): DueInfo {
  if (!due) return { label: "", tone: "none", className: "" };
  const d = new Date(due);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayMs = 86_400_000;
  const dueDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((dueDay.getTime() - startToday.getTime()) / dayMs);

  if (completed) return { label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), tone: "later", className: "text-muted-foreground" };
  if (diff < 0)  return { label: `Overdue · ${Math.abs(diff)}d`, tone: "overdue", className: "text-destructive font-semibold" };
  if (diff === 0) return { label: "Due today",   tone: "today", className: "text-warning font-semibold" };
  if (diff === 1) return { label: "Due tomorrow", tone: "soon",  className: "text-warning" };
  if (diff <= 7) return { label: `${diff} days left`, tone: "soon", className: "text-foreground" };
  return { label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), tone: "later", className: "text-muted-foreground" };
}
