import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ListTodo, Grid3x3, Activity, Users, Settings, LogOut, X, Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

type Item = { to: string; label: string; icon: any };
const items: Item[] = [
  { to: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { to: "/tasks",      label: "Tasks",      icon: ListTodo },
  { to: "/kanban",     label: "Kanban",     icon: Grid3x3 },
  { to: "/activity",   label: "Activity",   icon: Activity },
  { to: "/workspaces", label: "Workspaces", icon: Users },
  { to: "/settings",   label: "Settings",   icon: Settings },
];

export function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signOut } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <>
      {open && (
        <div onClick={onClose}
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-fade-in" />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-sidebar border-r border-sidebar-border z-50 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold tracking-tight">
            <div className="w-8 h-8 rounded-lg gradient-hero glow flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            MINNAL
          </Link>
          <button className="lg:hidden" onClick={onClose} aria-label="Close menu"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-4 pb-3"><WorkspaceSwitcher /></div>
        <nav className="px-3 space-y-1">
          {items.map((item) => {
            const active = path === item.to;
            return (
              <Link
                key={item.to}
                to={item.to as any}
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition relative ${
                  active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                {active && (
                  <motion.div layoutId="active-pill" className="absolute inset-0 rounded-lg gradient-hero glow" />
                )}
                <item.icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10 font-medium flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-sidebar-border">
          <button onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
