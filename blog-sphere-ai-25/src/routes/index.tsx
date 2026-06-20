import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostCard, type PostCardData } from "@/components/PostCard";
import { CATEGORIES } from "@/lib/blog-utils";
import heroImg from "@/assets/hero-collage.jpg";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BlogSphere AI — Where ideas get edited." },
      { name: "description", content: "A premium editorial blogging platform with AI-assisted writing." },
    ],
  }),
  component: Index,
});

function Index() {
  const [posts, setPosts] = useState<PostCardData[] | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    let q = supabase
      .from("posts")
      .select("id, slug, title, subtitle, excerpt, cover_image, category, tags, reading_time, views, published_at, author_id")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(24);
    if (category) q = q.eq("category", category);
    q.then(async ({ data }) => {
      const rows = (data ?? []) as PostCardData[];
      const ids = Array.from(new Set(rows.map((r) => r.author_id)));
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", ids);
        const map = new Map((profs ?? []).map((p) => [p.id, p]));
        rows.forEach((r) => (r.author = map.get(r.author_id)));
      }
      setPosts(rows);
    });
  }, [category]);

  const featured = posts?.[0];
  const rest = posts?.slice(1) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="grid gap-8 py-10 md:py-16 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Issue No. 001 · Editorial</p>
          <h1 className="mt-4 font-display text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
            Where <em className="italic">ideas</em> get edited.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            A premium reading & writing platform with an AI co-editor — built for the curious.
          </p>
          <div className="mt-7 flex gap-3">
            <Button asChild size="lg"><Link to="/write">Start writing</Link></Button>
            <Button asChild variant="outline" size="lg"><a href="#feed">Read the feed</a></Button>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-sm border border-border">
          <img src={heroImg} alt="Editorial collage" className="h-full w-full object-cover" />
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="flex flex-wrap gap-2 border-y border-border py-4">
        <button
          onClick={() => setCategory(null)}
          className={`text-xs uppercase tracking-[0.2em] px-3 py-1 rounded-sm ${!category ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
        >All</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`text-xs uppercase tracking-[0.2em] px-3 py-1 rounded-sm ${category === c ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
          >{c}</button>
        ))}
      </section>

      {/* Feed */}
      <section id="feed" className="py-10">
        {posts === null ? (
          <p className="text-muted-foreground">Loading the feed…</p>
        ) : posts.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border p-12 text-center">
            <p className="font-display text-3xl">The page is blank.</p>
            <p className="mt-2 text-muted-foreground">Be the first to publish a story.</p>
            <Button asChild className="mt-5"><Link to="/write">Write the first post</Link></Button>
          </div>
        ) : (
          <>
            {featured && <PostCard post={featured} variant="featured" />}
            <div className="mt-10 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
