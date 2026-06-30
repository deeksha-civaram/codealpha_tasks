import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2, Calendar, GripVertical, Check, AlertTriangle } from "lucide-react";
import type { Task } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { CATEGORY_META, PRIORITY_META, getDueInfo } from "@/lib/task-utils";
import { useWorkspace } from "@/context/WorkspaceContext";

const STATUS_DOTS: Record<string, string> = {
  pending: "bg-warning",
  in_progress: "bg-primary",
  completed: "bg-success",
};

export function TaskCard({
  task, onEdit, onDelete, onToggle, dragHandle,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  dragHandle?: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const done = task.status === "completed";
  const prio = PRIORITY_META[task.priority];
  const cat = CATEGORY_META[task.category];
  const due = getDueInfo(task.due_date, done);
  const { members } = useWorkspace();
  const assignee = task.assignee_id ? members.find((m) => m.user_id === task.assignee_id) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      whileHover={{ y: -2 }}
      className={`glass rounded-xl p-4 group transition-all relative overflow-hidden hover:elevated hover:shadow-glow ${
        due.tone === "overdue" && !done ? "ring-1 ring-destructive/40" : ""
      }`}
    >
      {/* Priority left ribbon */}
      <span
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          task.priority === "high" ? "bg-destructive" :
          task.priority === "medium" ? "bg-warning" : "bg-success"
        }`}
      />
      <div className="flex items-start gap-3 pl-2">
        {dragHandle && (
          <div className="opacity-0 group-hover:opacity-100 cursor-grab text-muted-foreground transition pt-0.5">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        <button
          onClick={onToggle}
          aria-label={done ? "Mark incomplete" : "Mark complete"}
          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition shrink-0 ${
            done ? "bg-success border-success" : "border-border hover:border-primary"
          }`}
        >
          {done && <Check className="w-3 h-3 text-success-foreground" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className={`font-medium ${done ? "line-through text-muted-foreground" : ""}`}>{task.title}</div>
          {task.description && (
            <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</div>
          )}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide border ${prio.className}`}>
              {prio.label}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${cat.className}`}>
              {cat.label}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[task.status]}`} />
              {task.status.replace("_", " ")}
            </span>
            {task.due_date && (
              <span className={`text-[10px] flex items-center gap-1 ${due.className}`}>
                {due.tone === "overdue" ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                {due.label}
              </span>
            )}
            {assignee && (
              <span className="text-[10px] flex items-center gap-1 text-muted-foreground" title={assignee.profile?.full_name ?? "Member"}>
                <span className="w-4 h-4 rounded-full gradient-hero text-white text-[8px] font-semibold flex items-center justify-center">
                  {(assignee.profile?.full_name ?? "U")[0].toUpperCase()}
                </span>
                {assignee.profile?.full_name ?? "Member"}
              </span>
            )}
          </div>
        </div>
        <div className={`flex flex-col gap-1 transition ${hover ? "opacity-100" : "opacity-0"}`}>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit} aria-label="Edit task">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-destructive" onClick={onDelete} aria-label="Delete task">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
