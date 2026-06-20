import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import {
  amIAdmin,
  listUsers,
  listRecentContent,
  setUserBanned,
  setPostHidden,
  setCommentHidden,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck, EyeOff, Eye, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — BlogSphere AI" }] }),
  component: AdminPage,
});

type UserRow = { id: string; username: string; full_name: string | null; avatar_url: string | null; is_banned: boolean; created_at: string };
type PostRow = { id: string; title: string; slug: string; status: string; is_hidden: boolean; created_at: string; author_id: string; profiles: { username: string } | null };
type CommentRow = { id: string; content: string; is_hidden: boolean; created_at: string; author_id: string; post_id: string; profiles: { username: string } | null };

function AdminPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const checkAdmin = useServerFn(amIAdmin);
  const fetchUsers = useServerFn(listUsers);
  const fetchContent = useServerFn(listRecentContent);
  const banFn = useServerFn(setUserBanned);
  const hidePostFn = useServerFn(setPostHidden);
  const hideCommentFn = useServerFn(setCommentHidden);

  const [authorized, setAuthorized] = useState<null | boolean>(null);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    (async () => {
      try {
        const { isAdmin } = await checkAdmin();
        setAuthorized(isAdmin);
      } catch { setAuthorized(false); }
    })();
  }, [loading, user, nav, checkAdmin]);

  const reload = async (q = "") => {
    setLoadingData(true);
    setErr(null);
    try {
      const [u, c] = await Promise.all([
        fetchUsers({ data: { search: q || undefined } }),
        fetchContent(),
      ]);
      setUsers(u.users as UserRow[]);
      setPosts(c.posts as PostRow[]);
      setComments(c.comments as CommentRow[]);
    } catch (e) { setErr((e as Error).message); }
    finally { setLoadingData(false); }
  };

  useEffect(() => { if (authorized) reload(); /* eslint-disable-next-line */ }, [authorized]);

  const wrap = async (key: string, fn: () => Promise<unknown>, successMsg: string) => {
    setBusy(key);
    try { await fn(); toast.success(successMsg); await reload(search); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  };

  if (loading || authorized === null) {
    return <div className="p-12 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /> Checking permissions…</div>;
  }
  if (!authorized) {
    return (
      <div className="mx-auto max-w-md p-12 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 font-display text-3xl">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">This area is reserved for administrators.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="font-display text-4xl">Moderation</h1>
      </header>

      {err && <div className="mb-6 rounded-sm border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{err}</div>}

      <section className="mb-12">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl">Users</h2>
          <form
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); reload(search); }}
          >
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search username or name…" className="w-72" />
            <Button type="submit" variant="outline" size="sm" disabled={loadingData}>Search</Button>
          </form>
        </div>
        {loadingData ? <Skel /> : users.length === 0 ? <Empty label="No users found." /> : (
          <div className="divide-y divide-border rounded-sm border border-border">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.full_name || u.username} <span className="text-muted-foreground">@{u.username}</span></p>
                  <p className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString()} · {u.is_banned ? <span className="text-destructive">Banned</span> : "Active"}</p>
                </div>
                <Button
                  size="sm"
                  variant={u.is_banned ? "outline" : "destructive"}
                  disabled={busy === `ban-${u.id}`}
                  onClick={() => wrap(`ban-${u.id}`, () => banFn({ data: { userId: u.id, banned: !u.is_banned } }), u.is_banned ? "User unbanned." : "User banned.")}
                >
                  {busy === `ban-${u.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : u.is_banned ? "Unban" : "Ban"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="mb-3 font-display text-2xl">Recent posts</h2>
        {loadingData ? <Skel /> : posts.length === 0 ? <Empty label="No posts yet." /> : (
          <div className="divide-y divide-border rounded-sm border border-border">
            {posts.map((p) => (
              <div key={p.id} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    by @{p.profiles?.username ?? "—"} · {p.status} · {p.is_hidden ? <span className="text-destructive">Hidden</span> : "Visible"} · {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={p.is_hidden ? "outline" : "secondary"}
                  disabled={busy === `post-${p.id}`}
                  onClick={() => wrap(`post-${p.id}`, () => hidePostFn({ data: { postId: p.id, hidden: !p.is_hidden } }), p.is_hidden ? "Post restored." : "Post hidden.")}
                >
                  {busy === `post-${p.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : p.is_hidden ? <><Eye className="h-4 w-4" /> Restore</> : <><EyeOff className="h-4 w-4" /> Hide</>}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl">Recent comments</h2>
        {loadingData ? <Skel /> : comments.length === 0 ? <Empty label="No comments yet." /> : (
          <div className="divide-y divide-border rounded-sm border border-border">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm">{c.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    by @{c.profiles?.username ?? "—"} · {c.is_hidden ? <span className="text-destructive">Hidden</span> : "Visible"} · {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={c.is_hidden ? "outline" : "secondary"}
                  disabled={busy === `c-${c.id}`}
                  onClick={() => wrap(`c-${c.id}`, () => hideCommentFn({ data: { commentId: c.id, hidden: !c.is_hidden } }), c.is_hidden ? "Comment restored." : "Comment hidden.")}
                >
                  {busy === `c-${c.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : c.is_hidden ? <><Eye className="h-4 w-4" /> Restore</> : <><EyeOff className="h-4 w-4" /> Hide</>}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Skel() {
  return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-sm bg-muted" />)}</div>;
}
function Empty({ label }: { label: string }) {
  return <p className="rounded-sm border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{label}</p>;
}