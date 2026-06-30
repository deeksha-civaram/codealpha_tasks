import { useState, type ReactNode } from "react";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTasks, type Task, type TaskStatus } from "@/hooks/useTasks";
import toast from "react-hot-toast";
import { useWorkspace } from "@/context/WorkspaceContext";

export function useTaskActions(userId: string | undefined) {
  const { currentId, members } = useWorkspace();
  const tasks = useTasks(userId, currentId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const onCreate = () => { setEditing(null); setDialogOpen(true); };
  const onEdit = (t: Task) => { setEditing(t); setDialogOpen(true); };
  const onSubmit = async (data: any) => {
    try {
      if (editing) { await tasks.update(editing.id, data); toast.success("Task updated"); }
      else { await tasks.create(data); toast.success("Task created"); }
    } catch (e: any) { toast.error(e.message); }
  };
  const onToggle = async (t: Task) => {
    const next: TaskStatus = t.status === "completed" ? "pending" : "completed";
    try { await tasks.update(t.id, { status: next });
      toast.success(next === "completed" ? "Nice — task done" : "Reopened");
    } catch (e: any) { toast.error(e.message); }
  };
  const onConfirmDelete = async () => {
    if (!deleteId) return;
    try { await tasks.remove(deleteId); toast.success("Task deleted"); }
    catch (e: any) { toast.error(e.message); }
    setDeleteId(null);
  };

  const Dialogs: ReactNode = (
    <>
      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={onSubmit} initial={editing}
        members={currentId === "personal" ? [] : members.map((m) => ({ id: m.user_id, label: m.profile?.full_name ?? "Member" }))}
        showAssignee={currentId !== "personal"} />
      <AlertDialog open={!!deleteId} onOpenChange={(b) => !b && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return { tasks, onCreate, onEdit, onToggle, setDeleteId, Dialogs };
}
