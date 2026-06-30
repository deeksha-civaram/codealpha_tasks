import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TaskListView } from "@/components/tasks/TaskListView";
import { useTaskActions } from "@/hooks/useTaskActions";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
  head: () => ({
    meta: [
      { title: "Tasks — MINNAL" },
      { name: "description", content: "All your MINNAL tasks in one place — filter by status, priority and category, sort, and ship faster." },
      { property: "og:title", content: "Tasks — MINNAL" },
      { property: "og:description", content: "All your MINNAL tasks in one place — filter by status, priority and category, sort, and ship faster." },
      { property: "og:url", content: "https://minnal.lovable.app/tasks" },
    ],
    links: [{ rel: "canonical", href: "https://minnal.lovable.app/tasks" }],
  }),
});

function TasksPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const { tasks: t, onCreate, onEdit, onToggle, setDeleteId, Dialogs } = useTaskActions(user?.id);

  return (
    <DashboardShell search={search} onSearch={setSearch}>
      <div className="space-y-8">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">All tasks</h1>
            <p className="text-muted-foreground mt-1 font-mono text-xs uppercase tracking-widest">Filter, sort, and ship.</p>
          </div>
          <Button onClick={onCreate} className="gradient-hero text-primary-foreground border-0 glow-cyan">
            <Plus className="w-4 h-4 mr-1" /> New task
          </Button>
        </div>
        <TaskListView
          tasks={t.tasks} loading={t.loading} search={search}
          savedViewsRoute="/tasks"
          onCreate={onCreate} onEdit={onEdit} onToggle={onToggle}
          onDelete={(id) => setDeleteId(id)}
        />
      </div>
      {Dialogs}
    </DashboardShell>
  );
}
