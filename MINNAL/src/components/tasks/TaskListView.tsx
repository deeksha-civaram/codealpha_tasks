import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Filter, Grid3x3, List as ListIcon, Tag, ArrowUpDown, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskCardSkeleton } from "@/components/tasks/TaskSkeleton";
import { SavedViewsBar } from "@/components/tasks/SavedViewsBar";
import { CATEGORIES, type Task, type TaskPriority, type TaskCategory } from "@/hooks/useTasks";
import { CATEGORY_META } from "@/lib/task-utils";

type ViewFilters = {
  status: Status; priority: "all" | TaskPriority;
  category: "all" | TaskCategory; sortBy: SortKey;
};


type Status = "all" | "pending" | "in_progress" | "completed";
type SortKey = "created" | "due" | "priority";
const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

export function TaskListView({
  tasks, loading, search, onCreate, onEdit, onToggle, onDelete,
  defaultStatus = "all", savedViewsRoute,
}: {
  tasks: Task[];
  loading: boolean;
  search: string;
  onCreate: () => void;
  onEdit: (t: Task) => void;
  onToggle: (t: Task) => void;
  onDelete: (id: string) => void;
  defaultStatus?: Status;
  savedViewsRoute?: string;
}) {
  const [status, setStatus] = useState<Status>(defaultStatus);
  const [priority, setPriority] = useState<"all" | TaskPriority>("all");
  const [category, setCategory] = useState<"all" | TaskCategory>("all");
  const [sortBy, setSortBy] = useState<SortKey>("created");
  const [grid, setGrid] = useState(true);

  const filtered = useMemo(() => {
    const list = tasks.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (category !== "all" && t.category !== category) return false;
      const q = search.toLowerCase();
      if (q && !t.title.toLowerCase().includes(q)
        && !(t.description ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sortBy === "priority") return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (sortBy === "due") {
        const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return ad - bd;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [tasks, status, priority, category, search, sortBy]);

  const applyView = (f: ViewFilters) => {
    if (f.status) setStatus(f.status);
    if (f.priority) setPriority(f.priority);
    if (f.category) setCategory(f.category);
    if (f.sortBy) setSortBy(f.sortBy);
  };

  return (
    <div className="space-y-6">
      {savedViewsRoute && (
        <SavedViewsBar<ViewFilters>
          route={savedViewsRoute}
          current={{ status, priority, category, sortBy }}
          onApply={applyView}
        />
      )}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Filter className="w-3.5 h-3.5" /> Filter</div>
          <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(v) => setCategory(v as any)}>
            <SelectTrigger className="w-36 h-9"><Tag className="w-3.5 h-3.5 mr-1 opacity-60" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_META[c].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-40 h-9"><ArrowUpDown className="w-3.5 h-3.5 mr-1 opacity-60" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Recently created</SelectItem>
              <SelectItem value="due">Due date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          <button onClick={() => setGrid(true)} aria-label="Grid view" className={`p-1.5 rounded ${grid ? "bg-muted" : ""}`}><Grid3x3 className="w-4 h-4" /></button>
          <button onClick={() => setGrid(false)} aria-label="List view" className={`p-1.5 rounded ${!grid ? "bg-muted" : ""}`}><ListIcon className="w-4 h-4" /></button>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <TaskCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center">
          <p className="text-muted-foreground mb-4">{tasks.length === 0 ? "No tasks yet — capture your first thought." : "No tasks match those filters."}</p>
          <Button onClick={onCreate} className="gradient-hero text-white border-0 glow-cyan">
            <Plus className="w-4 h-4 mr-1" /> New task
          </Button>
        </div>
      ) : (
        <div className={grid ? "grid md:grid-cols-2 lg:grid-cols-3 gap-3" : "space-y-2 max-w-3xl"}>
          <AnimatePresence mode="popLayout">
            {filtered.map((t) => (
              <TaskCard key={t.id} task={t}
                onEdit={() => onEdit(t)}
                onDelete={() => onDelete(t.id)}
                onToggle={() => onToggle(t)} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
