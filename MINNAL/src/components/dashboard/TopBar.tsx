import { useNavigate } from "@tanstack/react-router";
import { Sun, Moon, Search, Menu, Settings, LogOut } from "lucide-react";
import { NotificationsPopover } from "@/components/notifications/NotificationsPopover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export function TopBar({
  onMenu, search, onSearch, alert,
}: {
  onMenu: () => void;
  search?: string;
  onSearch?: (v: string) => void;
  alert?: boolean;
}) {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="h-16 px-4 lg:px-8 flex items-center gap-4">
        <button className="lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu className="w-5 h-5" /></button>
        {onSearch && (
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search ?? ""} onChange={(e) => onSearch(e.target.value)}
              placeholder="Search tasks..." className="pl-9 h-10 bg-muted/50 border-0" />
          </div>
        )}
        {!onSearch && <div className="flex-1" />}
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <NotificationsPopover />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 rounded-full gradient-hero text-white text-sm font-semibold flex items-center justify-center glow-cyan">
              {(user?.email ?? "U")[0].toUpperCase()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-2 text-sm">
              <div className="font-medium truncate">{user?.email}</div>
              <div className="text-xs text-muted-foreground">Member</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => nav({ to: "/settings" })}><Settings className="w-4 h-4 mr-2" />Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()}><LogOut className="w-4 h-4 mr-2" />Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
