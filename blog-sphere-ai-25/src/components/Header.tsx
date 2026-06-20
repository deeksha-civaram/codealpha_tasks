import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PenLine, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
  const { user, profile, signOut } = useAuth();
  const nav = useNavigate();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefers;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-3xl leading-none">BlogSphere</span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">AI</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link to="/" className="hover:text-accent transition-colors">Home</Link>
          <a href="/#categories" className="hover:text-accent transition-colors">Categories</a>
          {user && <Link to="/bookmarks" className="hover:text-accent transition-colors">Bookmarks</Link>}
          {user && <Link to="/activity" className="hover:text-accent transition-colors">Activity</Link>}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="gap-1.5">
                <Link to="/write"><PenLine className="h-4 w-4" /> Write</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => signOut().then(() => nav({ to: "/" }))}>
                Sign out
              </Button>
              <div className="ml-1 hidden h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-lg sm:flex">
                {(profile?.username ?? "U")[0].toUpperCase()}
              </div>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
              <Button asChild size="sm"><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}