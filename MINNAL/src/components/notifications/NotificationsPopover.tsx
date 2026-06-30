import { useNavigate } from "@tanstack/react-router";
import { Bell, MessageSquare, AtSign, Check, Inbox } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNotifications, type Notification } from "@/hooks/useNotifications";

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function iconFor(t: string) {
  if (t === "mention") return AtSign;
  if (t === "comment") return MessageSquare;
  return Bell;
}

export function NotificationsPopover() {
  const { user } = useAuth();
  const { items, unread, markAllRead, markRead } = useNotifications(user?.id);
  const nav = useNavigate();

  const onClick = async (n: Notification) => {
    if (!n.read_at) await markRead(n.id);
    if (n.task_id) nav({ to: "/tasks" });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center glow">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 glass">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="font-display font-semibold">Inbox</div>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Check className="w-3 h-3" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">You're all caught up.</p>
            </div>
          ) : (
            items.map((n) => {
              const Icon = iconFor(n.type);
              const payload = (n.payload as any) ?? {};
              const title = payload.task_title ?? "Task";
              const preview = payload.preview ?? "";
              return (
                <button
                  key={n.id}
                  onClick={() => onClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition flex gap-3 ${
                    n.read_at ? "opacity-70" : ""
                  }`}
                >
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    n.type === "mention" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {n.type === "mention" ? "You were mentioned" : "New comment"} · {title}
                    </div>
                    {preview && <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{preview}</div>}
                    <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground mt-1">
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                  {!n.read_at && <span className="w-2 h-2 rounded-full bg-accent mt-2" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
