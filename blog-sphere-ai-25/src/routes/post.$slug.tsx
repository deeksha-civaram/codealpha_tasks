import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, safeRenderMarkdown } from "@/lib/blog-utils";
import { Heart, Bookmark, Share2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/post/$slug")({
  head: () => ({ meta: [{ title: "Post — BlogSphere AI" }] }),
  component: PostPage,
});

type Post = {
  id: string; slug: string; title: string; subtitle: string | null; content: string;
  cover_image: string | null; category: string | null; tags: string[]; reading_time: number;
  views: number; published_at: string | null; author_id: string;
};
type Author = { id: string; username: string; full_name: string | null; avatar_url: string | null; bio: string | null };
type Comment = { id: string; content: string; created_at: string; author_id: string; author?: Author };

function PostPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("posts").select("*").eq("slug", slug).maybeSingle();
      if (!p) { setPost(null); return; }
      setPost(p as Post);
      const { data: a } = await supabase.from("profiles").select("id, username, full_name, avatar_url, bio").eq("id", p.author_id).maybeSingle();
      setAuthor(a as Author | null);
      const { count } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", p.id);
      setLikes(count ?? 0);
      if (user) {
        const [{ data: liked }, { data: bk }] = await Promise.all([
          supabase.from("likes").select("post_id").eq("post_id", p.id).eq("user_id", user.id).maybeSingle(),
          supabase.from("bookmarks").select("post_id").eq("post_id", p.id).eq("user_id", user.id).maybeSingle(),
        ]);
        setLiked(!!liked);
        setBookmarked(!!bk);
      }
      const { data: cs } = await supabase.from("comments").select("id, content, created_at, author_id").eq("post_id", p.id).order("created_at", { ascending: false });
      const rows = (cs ?? []) as Comment[];
      const ids = Array.from(new Set(rows.map((r) => r.author_id)));
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, username, full_name, avatar_url, bio").in("id", ids);
        const map = new Map((profs ?? []).map((pr) => [pr.id, pr as Author]));
        rows.forEach((r) => (r.author = map.get(r.author_id)));
      }
      setComments(rows);
      // fire-and-forget view increment
      supabase.from("posts").update({ views: (p.views ?? 0) + 1 }).eq("id", p.id).then(() => {});
    })();
  }, [slug, user]);

  const toggleLike = async () => {
    if (!user) { toast.error("Sign in to react."); return; }
    if (!post) return;
    if (liked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      setLiked(false); setLikes((n) => n - 1);
    } else {
      await supabase.from("likes").insert({ post_id: post.id, user_id: user.id });
      setLiked(true); setLikes((n) => n + 1);
    }
  };

  const toggleBookmark = async () => {
    if (!user) { toast.error("Sign in to bookmark."); return; }
    if (!post) return;
    if (bookmarked) {
      await supabase.from("bookmarks").delete().eq("post_id", post.id).eq("user_id", user.id);
      setBookmarked(false); toast("Removed from bookmarks.");
    } else {
      await supabase.from("bookmarks").insert({ post_id: post.id, user_id: user.id });
      setBookmarked(true); toast.success("Bookmarked.");
    }
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post?.title, url }); return; } catch { /* fall through */ }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied.");
  };

  const postComment = async () => {
    if (!user) { toast.error("Sign in to comment."); return; }
    if (!commentText.trim() || !post) return;
    setPosting(true);
    const { data, error } = await supabase.from("comments")
      .insert({ post_id: post.id, author_id: user.id, content: commentText.trim() })
      .select("id, content, created_at, author_id").single();
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    const { data: prof } = await supabase.from("profiles").select("id, username, full_name, avatar_url, bio").eq("id", user.id).maybeSingle();
    setComments((cs) => [{ ...(data as Comment), author: prof as Author }, ...cs]);
    setCommentText("");
  };

  if (post === null) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      {post.category && <p className="text-xs uppercase tracking-[0.3em] text-accent">{post.category}</p>}
      <h1 className="mt-3 font-display text-5xl leading-[1.05] md:text-6xl">{post.title}</h1>
      {post.subtitle && <p className="mt-4 font-display text-2xl italic text-muted-foreground">{post.subtitle}</p>}
      <div className="mt-6 flex items-center justify-between border-y border-border py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-lg">
            {(author?.username ?? "A")[0].toUpperCase()}
          </div>
          <div>
            <Link to="/profile/$username" params={{ username: author?.username ?? "" }} className="text-sm font-medium hover:underline">
              {author?.full_name || author?.username || "Anonymous"}
            </Link>
            <p className="text-xs text-muted-foreground">{formatDate(post.published_at)} · {post.reading_time} min read · {post.views} views</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={toggleLike} className={liked ? "text-accent" : ""}>
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {likes}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleBookmark} className={bookmarked ? "text-accent" : ""}>
            <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={share}><Share2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {post.cover_image && <img src={post.cover_image} alt={post.title} className="mt-8 aspect-[16/9] w-full rounded-sm object-cover" />}

      <div className="prose-paper mt-10" dangerouslySetInnerHTML={{ __html: safeRenderMarkdown(post.content) }} />

      {post.tags?.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2">
          {post.tags.map((t) => <span key={t} className="rounded-sm bg-secondary px-3 py-1 text-xs">#{t}</span>)}
        </div>
      )}

      {/* Comments */}
      <section className="mt-16 border-t border-border pt-10">
        <h2 className="font-display text-3xl flex items-center gap-2"><MessageCircle className="h-6 w-6" /> Responses ({comments.length})</h2>
        {user ? (
          <div className="mt-5 space-y-3">
            <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Share your response…" className="min-h-[100px]" />
            <Button disabled={posting || !commentText.trim()} onClick={postComment}>Respond</Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground"><Link to="/auth" className="underline">Sign in</Link> to leave a response.</p>
        )}
        <ul className="mt-8 space-y-6">
          {comments.map((c) => (
            <li key={c.id} className="border-b border-border pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-display">
                  {(c.author?.username ?? "U")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{c.author?.full_name || c.author?.username || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(c.created_at)}</p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{c.content}</p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}