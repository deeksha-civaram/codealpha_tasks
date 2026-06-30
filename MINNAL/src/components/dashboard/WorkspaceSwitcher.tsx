import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronsUpDown, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/context/WorkspaceContext";

export function WorkspaceSwitcher() {
  const { workspaces, currentId, setCurrentId } = useWorkspace();
  const nav = useNavigate();
  const current = workspaces.find((w) => w.id === currentId);
  const label = currentId === "personal" ? "Personal" : current?.name ?? "Workspace";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between bg-sidebar-accent/30 border-sidebar-border">
          <span className="flex items-center gap-2 truncate">
            {currentId === "personal" ? <User className="w-3.5 h-3.5" /> : <span className="w-2 h-2 rounded-full bg-primary" />}
            <span className="truncate text-sm">{label}</span>
          </span>
          <ChevronsUpDown className="w-3.5 h-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground">Switch</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setCurrentId("personal")}>
          <User className="w-4 h-4 mr-2" /> Personal
          {currentId === "personal" && <Check className="w-4 h-4 ml-auto text-primary" />}
        </DropdownMenuItem>
        {workspaces.map((w) => (
          <DropdownMenuItem key={w.id} onClick={() => setCurrentId(w.id)}>
            <span className="w-2 h-2 rounded-full bg-primary mr-2" />
            <span className="truncate">{w.name}</span>
            {currentId === w.id && <Check className="w-4 h-4 ml-auto text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => nav({ to: "/workspaces" })}>
          <Plus className="w-4 h-4 mr-2" /> Manage workspaces
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
