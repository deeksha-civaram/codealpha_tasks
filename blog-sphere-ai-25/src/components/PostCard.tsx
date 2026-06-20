import { Link } from "@tanstack/react-router";
import { formatDate } from "@/lib/blog-utils";

export type PostCardData = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  cover_image?: string | null;
  category?: string | null;
  tags?: string[] | null;
  reading_time?: number;
  views?: number;
  published_at?: string | null;
  author_id: string;
  author?: { id: string; username: string; full_name: string | null; avatar_url: string | null };
};

export function PostCard({ post, variant = "default" }: { post: PostCardData; variant?: "default" | "featured" }) {
  const author = post.author;
  const authorName = author?.full_name || author?.username || "Anonymous";
  if (variant === "featured") {
    return (
      <article className="grid gap-8 border-b border-border pb-12 md:grid-cols-5">
        <Link to="/post/$slug" params={{ slug: post.slug }} className="md:col-span-3 block aspect-[16/10] overflow-hidden rounded-sm bg-secondary">
          {post.cover_image ? (
            <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-6xl text-muted-foreground">{post.title[0]}</div>
          )}
        </Link>
        <div className="md:col-span-2 flex flex-col justify-center">
          {post.category && <p className="text-xs uppercase tracking-[0.25em] text-accent">{post.category}</p>}
          <h2 className="mt-3 font-display text-4xl leading-tight lg:text-5xl">
            <Link to="/post/$slug" params={{ slug: post.slug }} className="hover:underline underline-offset-4">{post.title}</Link>
          </h2>
          {(post.subtitle || post.excerpt) && (
            <p className="mt-3 text-base text-muted-foreground line-clamp-3">{post.subtitle || post.excerpt}</p>
          )}
          <p className="mt-5 text-xs text-muted-foreground">
            <Link to="/profile/$username" params={{ username: author?.username ?? "" }} className="hover:underline">{authorName}</Link>
            {" · "}{formatDate(post.published_at)} · {post.reading_time ?? 1} min read
          </p>
        </div>
      </article>
    );
  }
  return (
    <article className="group flex flex-col">
      <Link to="/post/$slug" params={{ slug: post.slug }} className="block aspect-[4/3] overflow-hidden rounded-sm bg-secondary">
        {post.cover_image ? (
          <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-5xl text-muted-foreground">{post.title[0]}</div>
        )}
      </Link>
      {post.category && <p className="mt-4 text-[10px] uppercase tracking-[0.25em] text-accent">{post.category}</p>}
      <h3 className="mt-2 font-display text-2xl leading-tight">
        <Link to="/post/$slug" params={{ slug: post.slug }} className="hover:underline underline-offset-4">{post.title}</Link>
      </h3>
      {post.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
      <p className="mt-3 text-xs text-muted-foreground">
        <Link to="/profile/$username" params={{ username: author?.username ?? "" }} className="hover:underline">{authorName}</Link>
        {" · "}{formatDate(post.published_at)} · {post.reading_time ?? 1} min
      </p>
    </article>
  );
}