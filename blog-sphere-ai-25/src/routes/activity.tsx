import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/blog-utils";
import { Heart, MessageCircle, UserPlus } from "lucide-react";

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [{ title: "Activity — BlogSphere AI" }] }),
  component: ActivityPage,
});

type Item = { kind: "like" | "comment" | "follow"; at: string; actor?: { username: string; full_name: string | null }; post?: { slug: string; title: string }; text?: string };

function ActivityPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    if (!loading && !user) { nav({ to: "/auth" }); return; }
    if (!user) return;
    (async () => {
      const { data: myPosts } = await supabase.from("posts").select("id, slug, title").eq("author_id", user.id);
      const myPostIds = (myPosts ?? []).map((p) => p.id);
      const postMap = new Map((myPosts ?? []).map((p) => [p.id, p]));
      const collected: Item[] = [];
      if (myPostIds.length) {
        const [{ data: likes }, { data: cmts }] = await Promise.all([
          supabase.from("likes").select("user_id, post_id, created_at").in("post_id", myPostIds).order("created_at", { ascending: false }).limit(30),
          supabase.from("comments").select("author_id, post_id, content, created_at").in("post_id", myPostIds).order("created_at", { ascending: false }).limit(30),
        ]);
        const actorIds = new Set<string>();
        (likes ?? []).forEach((l) => actorIds.add(l.user_id));
        (cmts ?? []).forEach((c) => actorIds.add(c.author_id));
        const { data: profs } = actorIds.size
          ? await supabase.from("profiles").select("id, username, full_name").in("id", Array.from(actorIds))
          : { data: [] as { id: string; username: string; full_name: string | null }[] };
        const pm = new Map((profs ?? []).map((p) => [p.id, p]));
        (likes ?? []).forEach((l) => collected.push({ kind: "like", at: l.created_at, actor: pm.get(l.user_id), post: postMap.get(l.post_id) }));
        (cmts ?? []).forEach((c) => collected.push({ kind: "comment", at: c.created_at, actor: pm.get(c.author_id), post: postMap.get(c.post_id), text: c.content }));
      }
      const { data: fols } = await supabase.from("follows").select("follower_id, created_at").eq("following_id", user.id).order("created_at", { ascending: false }).limit(30);
      if (fols?.length) {
        const { data: profs } = await supabase.from("profiles").select("id, username, full_name").in("id", fols.map((f) => f.follower_id));
        const pm = new Map((profs ?? []).map((p) => [p.id, p]));
        fols.forEach((f) => collected.push({ kind: "follow", at: f.created_at, actor: pm.get(f.follower_id) }));
      }
      collected.sort((a, b) => b.at.localeCompare(a.at));
      setItems(collected);
    })();
  }, [user, loading, nav]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-5xl">Activity</h1>
      <p className="mt-2 text-muted-foreground">Reactions, responses, and new followers.</p>
      <ul className="mt-8 space-y-4">
        {items === null ? <li className="text-muted-foreground">Loading…</li>
          : items.length === 0 ? <li className="text-muted-foreground">No activity yet.</li>
          : items.map((it, i) => (
            <li key={i} className="flex gap-3 border-b border-border pb-4">
              <div className="mt-1 text-accent">
                {it.kind === "like" ? <Heart className="h-4 w-4 fill-current" />
                  : it.kind === "comment" ? <MessageCircle className="h-4 w-4" />
                  : <UserPlus className="h-4 w-4" />}
              </div>
              <div className="flex-1 text-sm">
                <p>
                  <Link to="/profile/$username" params={{ username: it.actor?.username ?? "" }} className="font-medium hover:underline">
                    {it.actor?.full_name || it.actor?.username || "Someone"}
                  </Link>{" "}
                  {it.kind === "like" && <>liked your post{" "}
                    {it.post && <Link to="/post/$slug" params={{ slug: it.post.slug }} className="italic underline-offset-2 hover:underline">{it.post.title}</Link>}</>}
                  {it.kind === "comment" && <>responded to{" "}
                    {it.post && <Link to="/post/$slug" params={{ slug: it.post.slug }} className="italic underline-offset-2 hover:underline">{it.post.title}</Link>}</>}
                  {it.kind === "follow" && <>started following you</>}
                </p>
                {it.text && <p className="mt-1 text-muted-foreground line-clamp-2">"{it.text}"</p>}
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(it.at)}</p>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}