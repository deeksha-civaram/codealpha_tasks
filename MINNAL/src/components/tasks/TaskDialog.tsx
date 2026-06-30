import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Task, TaskInput, TaskPriority, TaskStatus, TaskCategory } from "@/hooks/useTasks";
import { CATEGORIES } from "@/hooks/useTasks";
import { CATEGORY_META } from "@/lib/task-utils";
import { CommentsThread } from "./CommentsThread";
import { useWorkspace } from "@/context/WorkspaceContext";

export function TaskDialog({
  open, onOpenChange, onSubmit, initial, members = [], showAssignee = false,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onSubmit: (data: TaskInput) => Promise<void>;
  initial?: Task | null;
  members?: { id: string; label: string }[];
  showAssignee?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [category, setCategory] = useState<TaskCategory>("other");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("none");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setDescription(initial?.description ?? "");
      setPriority(initial?.priority ?? "medium");
      setStatus(initial?.status ?? "pending");
      setCategory(initial?.category ?? "other");
      setDueDate(initial?.due_date ? initial.due_date.slice(0, 10) : "");
      setAssigneeId(initial?.assignee_id ?? "none");
    }
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        priority, status, category,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        ...(showAssignee ? { assignee_id: assigneeId === "none" ? null : assigneeId } : {}),
      });
      onOpenChange(false);
    } finally { setSaving(false); }
  };

  const { currentId } = useWorkspace();
  const canDiscuss = !!initial && currentId !== "personal";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{initial ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={3} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{CATEGORY_META[c].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="due">Due date</Label>
              <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          {showAssignee && (
            <div>
              <Label>Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {members.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="gradient-hero text-white border-0">
              {saving ? "Saving..." : initial ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
        {canDiscuss && initial && <CommentsThread taskId={initial.id} />}
      </DialogContent>
    </Dialog>
  );
}
