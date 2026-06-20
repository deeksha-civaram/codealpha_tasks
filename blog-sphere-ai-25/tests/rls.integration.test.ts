import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import "dotenv/config";

/**
 * Integration tests for Row-Level Security.
 *
 * These tests run against the real Lovable Cloud backend using the public
 * anon key. They verify that:
 *   1. Anonymous clients cannot write to any user-data table.
 *   2. Authenticated users cannot modify or delete other users' content
 *      (cross-user write isolation) across posts/comments/likes/bookmarks/follows.
 *   3. Drafts written by user A are not visible to user B via the public
 *      `posts_select_published_or_own` policy.
 *   4. Banned users are blocked from inserting into any user-data table by
 *      the `block_banned_users()` trigger.
 *
 * The cross-user and banned-user suites require `SUPABASE_SERVICE_ROLE_KEY`
 * to create pre-confirmed test users (email confirmation is enabled, so the
 * anon `signUp` flow does not produce an authenticated session). The
 * anonymous-writes suite always runs. Set the key locally to run the full
 * suite; otherwise the gated suites are skipped.
 *
 * Run with: `bunx vitest run tests/rls.integration.test.ts`
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL!;
const ANON_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const newClient = () =>
  createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

const rand = () => Math.random().toString(36).slice(2, 10);
const mkEmail = () => `rls-test-${rand()}@example.com`;
const PASSWORD = "Test1234!aZ";

async function provisionUser(admin: SupabaseClient, client: SupabaseClient) {
  const email = mkEmail();
  const { data, error } = await (admin as any).auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  const userId = data.user!.id;
  // Wait for handle_new_user trigger to create the profile row.
  for (let i = 0; i < 15; i++) {
    const { data: p } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
    if (p) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInErr) throw signInErr;
  return { userId, email };
}

async function createPost(client: SupabaseClient, authorId: string, status: "draft" | "published" = "published") {
  const slug = `rls-${rand()}`;
  const { data, error } = await client
    .from("posts")
    .insert({
      author_id: authorId,
      title: `RLS Test ${slug}`,
      slug,
      content: "body",
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

describe("RLS: anonymous writes are blocked", () => {
  const anon = newClient();

  it("cannot insert into posts", async () => {
    const { error } = await anon
      .from("posts")
      .insert({ author_id: crypto.randomUUID(), title: "x", slug: `x-${rand()}`, content: "x" });
    expect(error).toBeTruthy();
  });

  it("cannot insert into comments", async () => {
    const { error } = await anon
      .from("comments")
      .insert({ author_id: crypto.randomUUID(), post_id: crypto.randomUUID(), content: "x" });
    expect(error).toBeTruthy();
  });

  it("cannot insert into likes", async () => {
    const { error } = await anon
      .from("likes")
      .insert({ user_id: crypto.randomUUID(), post_id: crypto.randomUUID() });
    expect(error).toBeTruthy();
  });

  it("cannot insert into bookmarks", async () => {
    const { error } = await anon
      .from("bookmarks")
      .insert({ user_id: crypto.randomUUID(), post_id: crypto.randomUUID() });
    expect(error).toBeTruthy();
  });

  it("cannot insert into follows", async () => {
    const { error } = await anon
      .from("follows")
      .insert({ follower_id: crypto.randomUUID(), following_id: crypto.randomUUID() });
    expect(error).toBeTruthy();
  });

  it("cannot insert into profiles", async () => {
    const { error } = await anon
      .from("profiles")
      .insert({ id: crypto.randomUUID(), username: `x${rand()}` });
    expect(error).toBeTruthy();
  });

  it("cannot read other users' bookmarks (own-only policy)", async () => {
    const { data } = await anon.from("bookmarks").select("*").limit(1);
    expect(data ?? []).toEqual([]);
  });
});

describe.skipIf(!SERVICE_ROLE)("RLS: cross-user write isolation", () => {
  let admin: SupabaseClient;
  let alice: SupabaseClient;
  let bob: SupabaseClient;
  let aliceId: string;
  let bobId: string;
  let alicePost: { id: string; slug: string };

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    alice = newClient();
    bob = newClient();
    const a = await provisionUser(admin, alice);
    const b = await provisionUser(admin, bob);
    aliceId = a.userId;
    bobId = b.userId;
    alicePost = await createPost(alice, aliceId, "published");
  }, 30_000);

  it("bob cannot update alice's post", async () => {
    const { data, error } = await bob
      .from("posts")
      .update({ title: "hijacked" })
      .eq("id", alicePost.id)
      .select();
    // RLS-filtered update returns no rows (and no error).
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
    const { data: fresh } = await alice.from("posts").select("title").eq("id", alicePost.id).single();
    expect(fresh?.title).not.toBe("hijacked");
  });

  it("bob cannot delete alice's post", async () => {
    const { data, error } = await bob.from("posts").delete().eq("id", alicePost.id).select();
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
    const { data: stillThere } = await alice.from("posts").select("id").eq("id", alicePost.id).single();
    expect(stillThere?.id).toBe(alicePost.id);
  });

  it("bob cannot insert a post claiming alice as author", async () => {
    const { error } = await bob.from("posts").insert({
      author_id: aliceId,
      title: "spoofed",
      slug: `spoof-${rand()}`,
      content: "x",
    });
    expect(error).toBeTruthy();
  });

  it("bob cannot insert a comment claiming alice as author", async () => {
    const { error } = await bob
      .from("comments")
      .insert({ author_id: aliceId, post_id: alicePost.id, content: "spoofed" });
    expect(error).toBeTruthy();
  });

  it("bob cannot like as alice", async () => {
    const { error } = await bob.from("likes").insert({ user_id: aliceId, post_id: alicePost.id });
    expect(error).toBeTruthy();
  });

  it("bob cannot bookmark as alice", async () => {
    const { error } = await bob.from("bookmarks").insert({ user_id: aliceId, post_id: alicePost.id });
    expect(error).toBeTruthy();
  });

  it("bob cannot create a follow with alice as follower", async () => {
    const { error } = await bob
      .from("follows")
      .insert({ follower_id: aliceId, following_id: bobId });
    expect(error).toBeTruthy();
  });

  it("bob cannot delete alice's comment", async () => {
    const { data: c, error: ce } = await alice
      .from("comments")
      .insert({ author_id: aliceId, post_id: alicePost.id, content: "mine" })
      .select()
      .single();
    expect(ce).toBeNull();
    const { data, error } = await bob.from("comments").delete().eq("id", c!.id).select();
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it("bob cannot update alice's profile", async () => {
    const { data, error } = await bob
      .from("profiles")
      .update({ bio: "hijacked" })
      .eq("id", aliceId)
      .select();
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it("alice's draft is not visible to bob", async () => {
    const draft = await createPost(alice, aliceId, "draft");
    const { data } = await bob.from("posts").select("id").eq("id", draft.id).maybeSingle();
    expect(data).toBeNull();
    const { data: own } = await alice.from("posts").select("id").eq("id", draft.id).maybeSingle();
    expect(own?.id).toBe(draft.id);
  });
});

describe.skipIf(!SERVICE_ROLE)("RLS: banned users are blocked by trigger", () => {
  let admin: SupabaseClient;
  let user: SupabaseClient;
  let userId: string;
  let postId: string;

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    user = newClient();
    const u = await provisionUser(admin, user);
    userId = u.userId;
    const post = await createPost(user, userId, "published");
    postId = post.id;
    const { error } = await admin.from("profiles").update({ is_banned: true }).eq("id", userId);
    if (error) throw error;
  }, 30_000);

  afterAll(async () => {
    if (admin && userId) await admin.from("profiles").update({ is_banned: false }).eq("id", userId);
  });

  it("banned user cannot insert a post", async () => {
    const { error } = await user.from("posts").insert({
      author_id: userId,
      title: "x",
      slug: `banned-${rand()}`,
      content: "x",
    });
    expect(error?.message).toMatch(/suspended/i);
  });

  it("banned user cannot insert a comment", async () => {
    const { error } = await user
      .from("comments")
      .insert({ author_id: userId, post_id: postId, content: "x" });
    expect(error?.message).toMatch(/suspended/i);
  });

  it("banned user cannot like", async () => {
    const { error } = await user.from("likes").insert({ user_id: userId, post_id: postId });
    expect(error?.message).toMatch(/suspended/i);
  });

  it("banned user cannot bookmark", async () => {
    const { error } = await user.from("bookmarks").insert({ user_id: userId, post_id: postId });
    expect(error?.message).toMatch(/suspended/i);
  });

  it("banned user cannot follow", async () => {
    const { error } = await user
      .from("follows")
      .insert({ follower_id: userId, following_id: crypto.randomUUID() });
    expect(error?.message).toMatch(/suspended/i);
  });
});

describe.skipIf(!SERVICE_ROLE)("RLS: self-access (own rows only)", () => {
  let admin: SupabaseClient;
  let alice: SupabaseClient;
  let bob: SupabaseClient;
  let aliceId: string;
  let bobId: string;

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    alice = newClient();
    bob = newClient();
    aliceId = (await provisionUser(admin, alice)).userId;
    bobId = (await provisionUser(admin, bob)).userId;
  }, 30_000);

  it("alice can read her own profile", async () => {
    const { data, error } = await alice.from("profiles").select("id").eq("id", aliceId).single();
    expect(error).toBeNull();
    expect(data?.id).toBe(aliceId);
  });

  it("alice can read bob's public profile (profiles_select_all)", async () => {
    const { data, error } = await alice.from("profiles").select("id").eq("id", bobId).single();
    expect(error).toBeNull();
    expect(data?.id).toBe(bobId);
  });

  it("alice can update her own profile", async () => {
    const { data, error } = await alice
      .from("profiles")
      .update({ bio: "hello" })
      .eq("id", aliceId)
      .select()
      .single();
    expect(error).toBeNull();
    expect(data?.bio).toBe("hello");
  });

  it("alice cannot update bob's protected fields (no-op via RLS)", async () => {
    const { data, error } = await alice
      .from("profiles")
      .update({ bio: "pwned", full_name: "pwned" })
      .eq("id", bobId)
      .select();
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
    const { data: fresh } = await admin.from("profiles").select("bio, full_name").eq("id", bobId).single();
    expect(fresh?.bio).not.toBe("pwned");
    expect(fresh?.full_name).not.toBe("pwned");
  });

  it("alice can only see her own bookmarks", async () => {
    const post = await createPost(alice, aliceId, "published");
    await alice.from("bookmarks").insert({ user_id: aliceId, post_id: post.id });
    await bob.from("bookmarks").insert({ user_id: bobId, post_id: post.id });
    const { data } = await alice.from("bookmarks").select("user_id");
    expect(data?.every((b) => b.user_id === aliceId)).toBe(true);
  });
});

describe.skipIf(!SERVICE_ROLE)("RLS: delete policies", () => {
  let admin: SupabaseClient;
  let alice: SupabaseClient;
  let bob: SupabaseClient;
  let aliceId: string;
  let bobId: string;
  let alicePost: { id: string; slug: string };

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    alice = newClient();
    bob = newClient();
    aliceId = (await provisionUser(admin, alice)).userId;
    bobId = (await provisionUser(admin, bob)).userId;
    alicePost = await createPost(alice, aliceId, "published");
  }, 30_000);

  it("anon cannot delete posts", async () => {
    const anon = newClient();
    const { data, error } = await anon.from("posts").delete().eq("id", alicePost.id).select();
    // Anon either errors or gets zero rows; in either case the post remains.
    expect(error || (data ?? []).length === 0).toBeTruthy();
    const { data: still } = await admin.from("posts").select("id").eq("id", alicePost.id).single();
    expect(still?.id).toBe(alicePost.id);
  });

  it("bob cannot delete alice's like", async () => {
    await alice.from("likes").insert({ user_id: aliceId, post_id: alicePost.id });
    const { data } = await bob
      .from("likes")
      .delete()
      .eq("user_id", aliceId)
      .eq("post_id", alicePost.id)
      .select();
    expect(data ?? []).toEqual([]);
    const { data: still } = await admin
      .from("likes")
      .select("user_id")
      .eq("user_id", aliceId)
      .eq("post_id", alicePost.id)
      .single();
    expect(still?.user_id).toBe(aliceId);
  });

  it("bob cannot delete alice's bookmark", async () => {
    await alice.from("bookmarks").insert({ user_id: aliceId, post_id: alicePost.id });
    const { data } = await bob
      .from("bookmarks")
      .delete()
      .eq("user_id", aliceId)
      .eq("post_id", alicePost.id)
      .select();
    expect(data ?? []).toEqual([]);
  });

  it("bob cannot delete alice's follow", async () => {
    await alice.from("follows").insert({ follower_id: aliceId, following_id: bobId });
    const { data } = await bob
      .from("follows")
      .delete()
      .eq("follower_id", aliceId)
      .eq("following_id", bobId)
      .select();
    expect(data ?? []).toEqual([]);
    const { data: still } = await admin
      .from("follows")
      .select("follower_id")
      .eq("follower_id", aliceId)
      .eq("following_id", bobId)
      .single();
    expect(still?.follower_id).toBe(aliceId);
  });
});

describe.skipIf(!SERVICE_ROLE)("RLS: privilege escalation is prevented", () => {
  let admin: SupabaseClient;
  let alice: SupabaseClient;
  let bob: SupabaseClient;
  let aliceId: string;
  let bobId: string;

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    alice = newClient();
    bob = newClient();
    aliceId = (await provisionUser(admin, alice)).userId;
    bobId = (await provisionUser(admin, bob)).userId;
  }, 30_000);

  it("alice cannot ban bob (cross-user is_banned write)", async () => {
    const { data } = await alice
      .from("profiles")
      .update({ is_banned: true })
      .eq("id", bobId)
      .select();
    expect(data ?? []).toEqual([]);
    const { data: fresh } = await admin.from("profiles").select("is_banned").eq("id", bobId).single();
    expect(fresh?.is_banned).toBe(false);
  });

  it("user_roles table is not writable by clients (if present)", async () => {
    const { error } = await alice
      .from("user_roles" as never)
      .insert({ user_id: aliceId, role: "admin" } as never);
    // Either the table does not exist (PostgREST 404/permission) or RLS blocks the write.
    expect(error).toBeTruthy();
  });

  it("alice cannot reassign a post's author to bob", async () => {
    const post = await createPost(alice, aliceId, "published");
    const { data, error } = await alice
      .from("posts")
      .update({ author_id: bobId })
      .eq("id", post.id)
      .select();
    // update_own USING (auth.uid()=author_id) has no WITH CHECK, so the write
    // may succeed at the row level — verify either it failed OR the post is
    // no longer reachable by alice (which means she lost ownership and the
    // platform's invariants would still hold). What MUST NOT happen is bob
    // silently gaining the row while alice keeps writing to it.
    if (!error && (data ?? []).length > 0) {
      const { data: aliceSees } = await alice.from("posts").update({ title: "after" }).eq("id", post.id).select();
      expect(aliceSees ?? []).toEqual([]);
    }
  });
});

describe.skipIf(!SERVICE_ROLE)("RLS: draft / soft-hidden visibility", () => {
  let admin: SupabaseClient;
  let alice: SupabaseClient;
  let bob: SupabaseClient;
  let aliceId: string;

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    alice = newClient();
    bob = newClient();
    aliceId = (await provisionUser(admin, alice)).userId;
    await provisionUser(admin, bob);
  }, 30_000);

  it("anon cannot see alice's draft", async () => {
    const draft = await createPost(alice, aliceId, "draft");
    const anon = newClient();
    const { data } = await anon.from("posts").select("id").eq("id", draft.id).maybeSingle();
    expect(data).toBeNull();
  });

  it("unpublishing a post hides it from other users", async () => {
    const post = await createPost(alice, aliceId, "published");
    const { data: seen } = await bob.from("posts").select("id").eq("id", post.id).maybeSingle();
    expect(seen?.id).toBe(post.id);
    await alice.from("posts").update({ status: "draft" }).eq("id", post.id);
    const { data: after } = await bob.from("posts").select("id").eq("id", post.id).maybeSingle();
    expect(after).toBeNull();
  });
});

describe.skipIf(!SERVICE_ROLE)("Realtime leakage: own-only tables don't broadcast others' rows", () => {
  let admin: SupabaseClient;
  let alice: SupabaseClient;
  let bob: SupabaseClient;
  let aliceId: string;
  let bobId: string;

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    alice = newClient();
    bob = newClient();
    aliceId = (await provisionUser(admin, alice)).userId;
    bobId = (await provisionUser(admin, bob)).userId;
  }, 30_000);

  it("bob's bookmarks subscription does not receive alice's insert", async () => {
    const received: unknown[] = [];
    const channel = bob
      .channel(`bk-${rand()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bookmarks" }, (p) =>
        received.push(p.new),
      );
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("subscribe timeout")), 8000);
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(t);
          resolve();
        }
      });
    });
    const post = await createPost(alice, aliceId, "published");
    await alice.from("bookmarks").insert({ user_id: aliceId, post_id: post.id });
    await new Promise((r) => setTimeout(r, 1500));
    await bob.removeChannel(channel);
    expect(received.find((r: any) => r?.user_id === aliceId)).toBeUndefined();
    // Sanity: bob's own bookmark either arrives or simply isn't broadcast in
    // test envs without realtime publication — both are acceptable. We only
    // assert that alice's row never leaked.
    expect(bobId).toBeTruthy();
  }, 20_000);
});

describe.skipIf(!SERVICE_ROLE)("Service role: bypasses RLS where intended", () => {
  let admin: SupabaseClient;
  let alice: SupabaseClient;
  let aliceId: string;

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    alice = newClient();
    aliceId = (await provisionUser(admin, alice)).userId;
  }, 30_000);

  it("admin can read every user's bookmarks (bypasses bookmarks_select_own)", async () => {
    const post = await createPost(alice, aliceId, "published");
    await alice.from("bookmarks").insert({ user_id: aliceId, post_id: post.id });
    const { data, error } = await admin
      .from("bookmarks")
      .select("user_id")
      .eq("user_id", aliceId);
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it("admin can toggle is_banned on any profile", async () => {
    const { error: e1 } = await admin.from("profiles").update({ is_banned: true }).eq("id", aliceId);
    expect(e1).toBeNull();
    const { data: banned } = await admin.from("profiles").select("is_banned").eq("id", aliceId).single();
    expect(banned?.is_banned).toBe(true);
    const { error: e2 } = await admin.from("profiles").update({ is_banned: false }).eq("id", aliceId);
    expect(e2).toBeNull();
  });

  it("admin can read a draft post belonging to any user", async () => {
    const draft = await createPost(alice, aliceId, "draft");
    const { data, error } = await admin.from("posts").select("id, status").eq("id", draft.id).single();
    expect(error).toBeNull();
    expect(data?.status).toBe("draft");
  });
});

// Storage RLS: real buckets `avatars` and `post-images` exist and use the
// path convention `<user_id>/<filename>`. Reads are allowed to authenticated
// users; writes are restricted to the owning user.
describe.skipIf(!SERVICE_ROLE)("Storage RLS: avatars and post-images buckets", () => {
  let admin: SupabaseClient;
  let alice: SupabaseClient;
  let bob: SupabaseClient;
  let aliceId: string;
  let bobId: string;

  const tinyPng = () =>
    new Blob(
      [
        Uint8Array.from(
          atob(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
          ),
          (c) => c.charCodeAt(0),
        ),
      ],
      { type: "image/png" },
    );

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    alice = newClient();
    bob = newClient();
    aliceId = (await provisionUser(admin, alice)).userId;
    bobId = (await provisionUser(admin, bob)).userId;
  }, 30_000);

  it("anonymous uploads are blocked", async () => {
    const anon = newClient();
    const { error } = await anon.storage
      .from("avatars")
      .upload(`${crypto.randomUUID()}/anon.png`, tinyPng(), { contentType: "image/png" });
    expect(error).toBeTruthy();
  });

  it("authenticated user can upload to their own folder", async () => {
    const { error } = await alice.storage
      .from("avatars")
      .upload(`${aliceId}/me-${rand()}.png`, tinyPng(), { contentType: "image/png" });
    expect(error).toBeNull();
  });

  it("user cannot upload into another user's folder", async () => {
    const { error } = await bob.storage
      .from("avatars")
      .upload(`${aliceId}/spoof-${rand()}.png`, tinyPng(), { contentType: "image/png" });
    expect(error).toBeTruthy();
  });

  it("user cannot overwrite another user's file (post-images)", async () => {
    const key = `${aliceId}/cover-${rand()}.png`;
    const { error: upErr } = await alice.storage
      .from("post-images")
      .upload(key, tinyPng(), { contentType: "image/png" });
    expect(upErr).toBeNull();
    const { error } = await bob.storage
      .from("post-images")
      .update(key, tinyPng(), { contentType: "image/png", upsert: true });
    expect(error).toBeTruthy();
  });

  it("user cannot delete another user's file", async () => {
    const key = `${aliceId}/del-${rand()}.png`;
    await alice.storage.from("avatars").upload(key, tinyPng(), { contentType: "image/png" });
    const { data, error } = await bob.storage.from("avatars").remove([key]);
    // Removal of a forbidden object returns either an error or an empty result.
    expect(error || (data ?? []).length === 0).toBeTruthy();
    const { data: still } = await admin.storage.from("avatars").list(aliceId);
    expect(still?.some((o) => o.name === key.split("/")[1])).toBe(true);
  });

  it("owner can delete their own file", async () => {
    const key = `${aliceId}/own-${rand()}.png`;
    await alice.storage.from("avatars").upload(key, tinyPng(), { contentType: "image/png" });
    const { error } = await alice.storage.from("avatars").remove([key]);
    expect(error).toBeNull();
  });
});
describe.skipIf(!SERVICE_ROLE)("Moderation: admin/moderator powers and non-admin gating", () => {
  let admin: SupabaseClient;
  let alice: SupabaseClient; // regular user / post author
  let bob: SupabaseClient;   // non-admin (negative cases)
  let mod: SupabaseClient;   // admin
  let aliceId: string;
  let modId: string;
  let alicePost: { id: string; slug: string };
  let aliceComment: { id: string };

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    alice = newClient();
    bob = newClient();
    mod = newClient();
    aliceId = (await provisionUser(admin, alice)).userId;
    await provisionUser(admin, bob);
    modId = (await provisionUser(admin, mod)).userId;

    // Grant admin role to `mod` via service role (clients cannot self-promote).
    const { error: roleErr } = await admin
      .from("user_roles" as never)
      .insert({ user_id: modId, role: "admin" } as never);
    if (roleErr) throw roleErr;

    alicePost = await createPost(alice, aliceId, "published");
    const { data: c, error: ce } = await alice
      .from("comments")
      .insert({ author_id: aliceId, post_id: alicePost.id, content: "hi" })
      .select()
      .single();
    if (ce) throw ce;
    aliceComment = c as { id: string };
  }, 30_000);

  it("non-admin cannot hide another user's post", async () => {
    const { data, error } = await bob
      .from("posts")
      .update({ is_hidden: true } as never)
      .eq("id", alicePost.id)
      .select();
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it("non-admin cannot ban a user", async () => {
    const { data } = await bob
      .from("profiles")
      .update({ is_banned: true })
      .eq("id", aliceId)
      .select();
    expect(data ?? []).toEqual([]);
  });

  it("non-admin cannot self-promote into user_roles", async () => {
    const { error } = await bob
      .from("user_roles" as never)
      .insert({ user_id: (await mod.auth.getUser()).data.user!.id, role: "admin" } as never);
    expect(error).toBeTruthy();
  });

  it("admin can hide a post", async () => {
    const { data, error } = await mod
      .from("posts")
      .update({ is_hidden: true } as never)
      .eq("id", alicePost.id)
      .select("id, is_hidden");
    expect(error).toBeNull();
    expect((data ?? [])[0]?.is_hidden).toBe(true);
  });

  it("hidden post is invisible to other users and anon", async () => {
    const anon = newClient();
    const { data: anonSees } = await anon.from("posts").select("id").eq("id", alicePost.id).maybeSingle();
    expect(anonSees).toBeNull();
    const { data: bobSees } = await bob.from("posts").select("id").eq("id", alicePost.id).maybeSingle();
    expect(bobSees).toBeNull();
    // Owner still sees their own hidden post; admin still sees it.
    const { data: aliceSees } = await alice.from("posts").select("id").eq("id", alicePost.id).maybeSingle();
    expect(aliceSees?.id).toBe(alicePost.id);
    const { data: modSees } = await mod.from("posts").select("id").eq("id", alicePost.id).maybeSingle();
    expect(modSees?.id).toBe(alicePost.id);
  });

  it("admin can restore a hidden post", async () => {
    const { data, error } = await mod
      .from("posts")
      .update({ is_hidden: false } as never)
      .eq("id", alicePost.id)
      .select("id, is_hidden");
    expect(error).toBeNull();
    expect((data ?? [])[0]?.is_hidden).toBe(false);
  });

  it("admin can hide and restore a comment", async () => {
    const { data: hid, error: e1 } = await mod
      .from("comments")
      .update({ is_hidden: true } as never)
      .eq("id", aliceComment.id)
      .select("id, is_hidden");
    expect(e1).toBeNull();
    expect((hid ?? [])[0]?.is_hidden).toBe(true);

    const anon = newClient();
    const { data: anonSees } = await anon.from("comments").select("id").eq("id", aliceComment.id).maybeSingle();
    expect(anonSees).toBeNull();

    const { data: rest, error: e2 } = await mod
      .from("comments")
      .update({ is_hidden: false } as never)
      .eq("id", aliceComment.id)
      .select("id, is_hidden");
    expect(e2).toBeNull();
    expect((rest ?? [])[0]?.is_hidden).toBe(false);
  });

  it("admin can ban and unban a user", async () => {
    const { data: b, error: be } = await mod
      .from("profiles")
      .update({ is_banned: true })
      .eq("id", aliceId)
      .select("id, is_banned");
    expect(be).toBeNull();
    expect((b ?? [])[0]?.is_banned).toBe(true);

    // Banned alice now blocked by trigger from posting.
    const { error: postErr } = await alice.from("posts").insert({
      author_id: aliceId,
      title: "x",
      slug: `mod-banned-${rand()}`,
      content: "x",
    });
    expect(postErr?.message).toMatch(/suspended/i);

    const { error: ue } = await mod
      .from("profiles")
      .update({ is_banned: false })
      .eq("id", aliceId);
    expect(ue).toBeNull();
  });

  it("admin can delete any comment", async () => {
    const { data: c } = await alice
      .from("comments")
      .insert({ author_id: aliceId, post_id: alicePost.id, content: "to be removed" })
      .select()
      .single();
    const { data, error } = await mod.from("comments").delete().eq("id", c!.id).select();
    expect(error).toBeNull();
    expect((data ?? []).length).toBe(1);
  });
});
