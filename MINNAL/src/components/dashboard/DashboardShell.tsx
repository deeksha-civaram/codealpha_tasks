import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { Zap } from "lucide-react";

export function DashboardShell({
  children, search, onSearch, alert,
}: {
  children: ReactNode;
  search?: string;
  onSearch?: (v: string) => void;
  alert?: boolean;
}) {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading, nav]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Zap className="w-5 h-5 text-primary animate-pulse" fill="currentColor" />
          <span className="font-mono text-xs uppercase tracking-widest">Booting MINNAL…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex relative overflow-x-hidden">
      <div className="fixed inset-0 aurora-bg opacity-60 pointer-events-none -z-10" />
      <AppSidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 min-w-0">
        <TopBar onMenu={() => setOpen(true)} search={search} onSearch={onSearch} alert={alert} />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
