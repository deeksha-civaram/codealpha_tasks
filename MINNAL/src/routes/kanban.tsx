import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, closestCorners,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useTaskActions } from "@/hooks/useTaskActions";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskCardSkeleton } from "@/components/tasks/TaskSkeleton";
import { Button } from "@/components/ui/button";
import type { Task, TaskStatus } from "@/hooks/useTasks";

export const Route = createFileRoute("/kanban")({
  component: KanbanPage,
  head: () => ({
    meta: [
      { title: "Kanban — MINNAL" },
      { name: "description", content: "Drag-and-drop Kanban board in MINNAL — move tasks across Pending, In Progress, and Completed with real-time sync." },
      { property: "og:title", content: "Kanban — MINNAL" },
      { property: "og:description", content: "Drag-and-drop Kanban board in MINNAL — move tasks across Pending, In Progress, and Completed with real-time sync." },
      { property: "og:url", content: "https://minnal.lovable.app/kanban" },
    ],
    links: [{ rel: "canonical", href: "https://minnal.lovable.app/kanban" }],
  }),
});

const COLS: { id: TaskStatus; label: string; dot: string; glow: string }[] = [
  { id: "pending",     label: "Pending",     dot: "bg-warning",  glow: "shadow-[0_0_30px_-10px_oklch(0.82_0.17_75/0.6)]" },
  { id: "in_progress", label: "In Progress", dot: "bg-primary",  glow: "shadow-[0_0_30px_-10px_oklch(0.82_0.16_210/0.7)]" },
  { id: "completed",   label: "Completed",   dot: "bg-success",  glow: "shadow-[0_0_30px_-10px_oklch(0.78_0.18_158/0.6)]" },
];

function KanbanPage() {
  const { user } = useAuth();
  const { tasks: t, onCreate, onEdit, onToggle, setDeleteId, Dialogs } = useTaskActions(user?.id);
  const { tasks, loading, reorder } = t;
  const [activeId, setActiveId] = useState<string | null>(null);
  // Local override for instant drag feedback before realtime returns
  const [localTasks, setLocalTasks] = useState<Task[] | null>(null);
  const view = localTasks ?? tasks;

  const cols = useMemo(() => {
    const m: Record<TaskStatus, Task[]> = { pending: [], in_progress: [], completed: [] };
    [...view].sort((a, b) => a.position - b.position).forEach((t) => m[t.status].push(t));
    return m;
  }, [view]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findContainer = (id: string): TaskStatus | null => {
    const task = view.find((t) => t.id === id);
    if (task) return task.status;
    if (id === "pending" || id === "in_progress" || id === "completed") return id;
    return null;
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const fromCol = findContainer(activeId);
    const toCol = findContainer(overId);
    if (!fromCol || !toCol || fromCol === toCol) return;
    setLocalTasks((prev) => {
      const base = prev ?? tasks;
      return base.map((t) => (t.id === activeId ? { ...t, status: toCol } : t));
    });
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) { setLocalTasks(null); return; }
    const activeId = String(active.id);
    const overId = String(over.id);
    const overCol = findContainer(overId);
    if (!overCol) { setLocalTasks(null); return; }

    const base = localTasks ?? tasks;
    const colItems = base.filter((t) => t.status === overCol).sort((a, b) => a.position - b.position);
    const oldIdx = colItems.findIndex((t) => t.id === activeId);
    let newIdx = colItems.findIndex((t) => t.id === overId);
    if (newIdx === -1) newIdx = colItems.length - 1;
    const reordered = oldIdx >= 0 ? arrayMove(colItems, oldIdx, newIdx) : colItems;

    const updates = reordered.map((task, i) => ({
      id: task.id,
      position: i,
      status: overCol,
    }));

    // Optimistic merge
    setLocalTasks(() => {
      const others = base.filter((t) => t.status !== overCol);
      const updatedCol = reordered.map((t, i) => ({ ...t, position: i, status: overCol }));
      return [...others, ...updatedCol];
    });

    try {
      await reorder(updates);
    } finally {
      // realtime will refresh; clear override shortly after
      setTimeout(() => setLocalTasks(null), 500);
    }
  };

  const activeTask = activeId ? view.find((t) => t.id === activeId) ?? null : null;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">Board</h1>
            <p className="text-muted-foreground mt-1 font-mono text-xs uppercase tracking-widest">Drag to flow.</p>
          </div>
          <Button onClick={onCreate} className="gradient-hero text-primary-foreground border-0 glow-cyan">
            <Plus className="w-4 h-4 mr-1" /> New task
          </Button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {COLS.map((c) => (
              <div key={c.id} className="glass rounded-2xl p-4 space-y-2">
                <div className="text-sm font-medium mb-2">{c.label}</div>
                {Array.from({ length: 2 }).map((_, i) => <TaskCardSkeleton key={i} />)}
              </div>
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors} collisionDetection={closestCorners}
            onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}
          >
            <div className="grid md:grid-cols-3 gap-4">
              {COLS.map((col) => (
                <Column key={col.id} col={col} tasks={cols[col.id]}
                  onEdit={onEdit} onDelete={(id) => setDeleteId(id)} onToggle={onToggle} />
              ))}
            </div>
            <DragOverlay dropAnimation={{ duration: 200 }}>
              {activeTask && (
                <div className="rotate-2 glow-cyan">
                  <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} onToggle={() => {}} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>
      {Dialogs}
    </DashboardShell>
  );
}

function Column({
  col, tasks, onEdit, onDelete, onToggle,
}: {
  col: { id: TaskStatus; label: string; dot: string; glow: string };
  tasks: Task[];
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
  onToggle: (t: Task) => void;
}) {
  const { setNodeRef, isOver } = useSortable({ id: col.id, data: { type: "column" } });
  return (
    <div
      ref={setNodeRef}
      className={`glass rounded-2xl p-4 min-h-[400px] transition-all ${col.glow} ${isOver ? "ring-2 ring-primary/60" : ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className={`w-2 h-2 rounded-full ${col.dot} animate-pulse`} />
          <span className="font-mono uppercase tracking-wider text-xs">{col.label}</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[200px]">
          <AnimatePresence>
            {tasks.map((t) => (
              <SortableItem key={t.id} task={t}
                onEdit={() => onEdit(t)} onDelete={() => onDelete(t.id)} onToggle={() => onToggle(t)} />
            ))}
          </AnimatePresence>
          {tasks.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-8 border border-dashed border-border/60 rounded-xl">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableItem({
  task, onEdit, onDelete, onToggle,
}: { task: Task; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <motion.div ref={setNodeRef} style={style} {...attributes} {...listeners} layout>
      <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} />
    </motion.div>
  );
}
