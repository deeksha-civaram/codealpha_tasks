import { useState, useMemo } from "react";
import { Send, Trash2, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useComments } from "@/hooks/useComments";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function CommentsThread({ taskId }: { taskId: string }) {
  const { user } = useAuth();
  const { members } = useWorkspace();
  const { comments, loading, add, remove } = useComments(taskId);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const mentionMap = useMemo(() => {
    const map = new Map<string, string>(); // name -> user_id
    members.forEach((m) => {
      const name = (m.profile?.full_name ?? "").trim();
      if (name) map.set(name.toLowerCase(), m.user_id);
    });
    return map;
  }, [members]);

  const parseMentions = (text: string): string[] => {
    const ids = new Set<string>();
    const re = /@([\w][\w\s.-]{0,40})/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const handle = m[1].trim().toLowerCase();
      // try progressively shorter prefixes to match member names
      for (const [name, id] of mentionMap) {
        if (handle.startsWith(name)) { ids.add(id); break; }
      }
    }
    return Array.from(ids);
  };

  const submit = async () => {
    if (!user || !body.trim()) return;
    setBusy(true);
    try {
      await add(user.id, body, parseMentions(body));
      setBody("");
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Discussion</div>
        <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
          {comments.length} comment{comments.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {loading ? (
          <div className="text-xs text-muted-foreground">Loading…</div>
        ) : comments.length === 0 ? (
          <div className="text-xs text-muted-foreground">No comments yet. Start the conversation.</div>
        ) : (
          comments.map((c) => {
            const name = c.profile?.full_name ?? "Member";
            const mine = c.user_id === user?.id;
            return (
              <div key={c.id} className="flex gap-2.5 group">
                <div className="w-7 h-7 rounded-full gradient-hero text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                  {name[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium truncate">{name}</span>
                    <span className="text-muted-foreground">{timeAgo(c.created_at)}</span>
                    {mine && (
                      <button
                        onClick={() => remove(c.id)}
                        aria-label="Delete comment"
                        className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-sm whitespace-pre-wrap break-words">{c.body}</div>
                  {c.mentions.length > 0 && (
                    <div className="text-[10px] text-accent mt-0.5 flex items-center gap-1">
                      <AtSign className="w-3 h-3" /> {c.mentions.length} mention{c.mentions.length === 1 ? "" : "s"}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Write a comment… use @Name to mention"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); }
          }}
        />
        <Button onClick={submit} disabled={busy || !body.trim()} className="gradient-hero text-white border-0 self-end">
          <Send className="w-4 h-4" />
        </Button>
      </div>
      {members.length > 0 && (
        <div className="text-[10px] text-muted-foreground">⌘/Ctrl + Enter to send</div>
      )}
    </div>
  );
}
