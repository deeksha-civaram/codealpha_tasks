import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: !!data };
  });

const ListUsersInput = z.object({ search: z.string().max(80).optional() });
export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListUsersInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("profiles")
      .select("id, username, full_name, avatar_url, is_banned, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data.search) q = q.or(`username.ilike.%${data.search}%,full_name.ilike.%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { users: rows ?? [] };
  });

const ToggleBan = z.object({ userId: z.string().uuid(), banned: z.boolean() });
export const setUserBanned = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ToggleBan.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("profiles")
      .update({ is_banned: data.banned })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const PostMod = z.object({ postId: z.string().uuid(), hidden: z.boolean() });
export const setPostHidden = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PostMod.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("posts")
      .update({ is_hidden: data.hidden })
      .eq("id", data.postId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const CommentMod = z.object({ commentId: z.string().uuid(), hidden: z.boolean() });
export const setCommentHidden = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CommentMod.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("comments")
      .update({ is_hidden: data.hidden })
      .eq("id", data.commentId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listRecentContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [posts, comments] = await Promise.all([
      supabaseAdmin
        .from("posts")
        .select("id, title, slug, status, is_hidden, created_at, author_id, profiles:author_id(username)")
        .order("created_at", { ascending: false })
        .limit(25),
      supabaseAdmin
        .from("comments")
        .select("id, content, is_hidden, created_at, author_id, post_id, profiles:author_id(username)")
        .order("created_at", { ascending: false })
        .limit(25),
    ]);
    if (posts.error) throw new Error(posts.error.message);
    if (comments.error) throw new Error(comments.error.message);
    return { posts: posts.data ?? [], comments: comments.data ?? [] };
  });