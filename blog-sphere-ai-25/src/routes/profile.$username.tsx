import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostCard, type PostCardData } from "@/components/PostCard";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";

export const Route = createFileRoute("/profile/$username")({
  head: () => ({ meta: [{ title: "Profile — BlogSphere AI" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ id: string; username: string; full_name: string | null; avatar_url: string | null; bio: string | null } | null>(null);
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("profiles").select("id, username, full_name, avatar_url, bio").eq("username", username).maybeSingle();
      if (!p) { setProfile(null); return; }
      setProfile(p);
      const { data: ps } = await supabase.from("posts")
        .select("id, slug, title, subtitle, excerpt, cover_image, category, tags, reading_time, views, published_at, author_id")
        .eq("author_id", p.id).eq("status", "published").order("published_at", { ascending: false });
      const rows = (ps ?? []) as PostCardData[];
      rows.forEach((r) => (r.author = p));
      setPosts(rows);
      const [{ count: f }, { count: fo }] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", p.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", p.id),
      ]);
      setCounts({ followers: f ?? 0, following: fo ?? 0 });
      if (user && user.id !== p.id) {
        const { data: fol } = await supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", p.id).maybeSingle();
        setIsFollowing(!!fol);
      }
    })();
  }, [username, user]);

  const toggleFollow = async () => {
    if (!user || !profile) { toast.error("Sign in to follow."); return; }
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id);
      setIsFollowing(false); setCounts((c) => ({ ...c, followers: c.followers - 1 }));
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.id });
      setIsFollowing(true); setCounts((c) => ({ ...c, followers: c.followers + 1 }));
    }
  };

  if (profile === null) return <div className="p-12 text-center text-muted-foreground">Profile not found.</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header className="flex flex-col items-start gap-6 border-b border-border pb-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-5">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-4xl">
              {profile.username[0].toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-display text-4xl">{profile.full_name || profile.username}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.bio && <p className="mt-2 max-w-lg text-sm">{profile.bio}</p>}
            <p className="mt-3 text-xs text-muted-foreground">{counts.followers} followers · {counts.following} following</p>
            {user && user.id === profile.id && (
              <div className="mt-4">
                <ImageUpload
                  bucket="avatars"
                  userId={user.id}
                  value={profile.avatar_url}
                  shape="circle"
                  label="Change avatar"
                  onChange={async (url) => {
                    const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
                    if (error) { toast.error(error.message); return; }
                    setProfile({ ...profile, avatar_url: url });
                  }}
                />
              </div>
            )}
          </div>
        </div>
        {user && user.id !== profile.id && (
          <Button onClick={toggleFollow} variant={isFollowing ? "outline" : "default"}>
            {isFollowing ? "Following" : "Follow"}
          </Button>
        )}
      </header>
      <div className="mt-10 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {posts.length === 0 ? <p className="text-muted-foreground">No posts yet.</p> : posts.map((p) => <PostCard key={p.id} post={p} />)}
      </div>
    </div>
  );
}