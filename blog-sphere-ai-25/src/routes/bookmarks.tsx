import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PostCard, type PostCardData } from "@/components/PostCard";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({ meta: [{ title: "Bookmarks — BlogSphere AI" }] }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [posts, setPosts] = useState<PostCardData[] | null>(null);

  useEffect(() => {
    if (!loading && !user) { nav({ to: "/auth" }); return; }
    if (!user) return;
    (async () => {
      const { data: bk } = await supabase.from("bookmarks").select("post_id").eq("user_id", user.id);
      const ids = (bk ?? []).map((b) => b.post_id);
      if (!ids.length) { setPosts([]); return; }
      const { data: ps } = await supabase.from("posts")
        .select("id, slug, title, subtitle, excerpt, cover_image, category, tags, reading_time, views, published_at, author_id")
        .in("id", ids);
      const rows = (ps ?? []) as PostCardData[];
      const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
      const { data: profs } = await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", authorIds);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      rows.forEach((r) => (r.author = map.get(r.author_id)));
      setPosts(rows);
    })();
  }, [user, loading, nav]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-display text-5xl">Bookmarks</h1>
      <p className="mt-2 text-muted-foreground">Saved for later.</p>
      <div className="mt-10 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {posts === null ? <p className="text-muted-foreground">Loading…</p>
          : posts.length === 0 ? <p className="text-muted-foreground">No bookmarks yet.</p>
          : posts.map((p) => <PostCard key={p.id} post={p} />)}
      </div>
    </div>
  );
}