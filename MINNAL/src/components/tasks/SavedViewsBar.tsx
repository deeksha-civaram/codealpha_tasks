import { useState } from "react";
import { Bookmark, BookmarkPlus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useSavedViews, type SavedView } from "@/hooks/useSavedViews";
import toast from "react-hot-toast";

export function SavedViewsBar<TFilters extends Record<string, unknown>>({
  route, current, onApply,
}: {
  route: string;
  current: TFilters;
  onApply: (filters: TFilters) => void;
}) {
  const { user } = useAuth();
  const { currentId } = useWorkspace();
  const { views, save, remove } = useSavedViews(user?.id, route, currentId);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const onSave = async () => {
    if (!name.trim()) return;
    try { await save(name, current); toast.success(`View "${name}" saved`); setName(""); setOpen(false); }
    catch (e: any) { toast.error(e.message); }
  };

  const apply = (v: SavedView) => {
    setActiveId(v.id);
    onApply((v.filters ?? {}) as TFilters);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Bookmark className="w-3.5 h-3.5" /> Views
      </div>
      {views.map((v) => (
        <div key={v.id} className={`group flex items-center gap-1 rounded-full border text-xs pl-2.5 pr-1 py-0.5 transition ${
          activeId === v.id ? "border-primary text-primary bg-primary/10" : "border-border hover:bg-muted"
        }`}>
          <button onClick={() => apply(v)} className="font-medium">{v.name}</button>
          <button
            onClick={() => remove(v.id).then(() => toast.success("View removed"))}
            aria-label="Remove view"
            className="opacity-50 hover:opacity-100 hover:text-destructive"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <BookmarkPlus className="w-3.5 h-3.5 mr-1" /> Save view
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 glass">
          <div className="space-y-2">
            <div className="text-sm font-medium">Save current filters</div>
            <Input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. High prio this week" autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") onSave(); }} />
            <Button onClick={onSave} className="w-full gradient-hero text-white border-0" disabled={!name.trim()}>
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
