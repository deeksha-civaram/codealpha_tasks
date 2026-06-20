
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  bio text,
  avatar_url text,
  cover_url text,
  website text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id);

-- POSTS
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text unique not null,
  subtitle text,
  excerpt text,
  content text not null default '',
  cover_image text,
  category text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  views integer not null default 0,
  reading_time integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create index posts_author_idx on public.posts(author_id);
create index posts_status_published_idx on public.posts(status, published_at desc);
grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "posts_select_published_or_own" on public.posts for select
  using (status = 'published' or auth.uid() = author_id);
create policy "posts_insert_own" on public.posts for insert to authenticated with check (auth.uid() = author_id);
create policy "posts_update_own" on public.posts for update to authenticated using (auth.uid() = author_id);
create policy "posts_delete_own" on public.posts for delete to authenticated using (auth.uid() = author_id);

-- COMMENTS
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments(post_id);
grant select on public.comments to anon, authenticated;
grant insert, update, delete on public.comments to authenticated;
grant all on public.comments to service_role;
alter table public.comments enable row level security;
create policy "comments_select_all" on public.comments for select using (true);
create policy "comments_insert_own" on public.comments for insert to authenticated with check (auth.uid() = author_id);
create policy "comments_update_own" on public.comments for update to authenticated using (auth.uid() = author_id);
create policy "comments_delete_own" on public.comments for delete to authenticated using (auth.uid() = author_id);

-- LIKES
create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
grant select on public.likes to anon, authenticated;
grant insert, delete on public.likes to authenticated;
grant all on public.likes to service_role;
alter table public.likes enable row level security;
create policy "likes_select_all" on public.likes for select using (true);
create policy "likes_insert_own" on public.likes for insert to authenticated with check (auth.uid() = user_id);
create policy "likes_delete_own" on public.likes for delete to authenticated using (auth.uid() = user_id);

-- BOOKMARKS
create table public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
grant select on public.bookmarks to authenticated;
grant insert, delete on public.bookmarks to authenticated;
grant all on public.bookmarks to service_role;
alter table public.bookmarks enable row level security;
create policy "bookmarks_select_own" on public.bookmarks for select to authenticated using (auth.uid() = user_id);
create policy "bookmarks_insert_own" on public.bookmarks for insert to authenticated with check (auth.uid() = user_id);
create policy "bookmarks_delete_own" on public.bookmarks for delete to authenticated using (auth.uid() = user_id);

-- FOLLOWS
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
grant select on public.follows to anon, authenticated;
grant insert, delete on public.follows to authenticated;
grant all on public.follows to service_role;
alter table public.follows enable row level security;
create policy "follows_select_all" on public.follows for select using (true);
create policy "follows_insert_own" on public.follows for insert to authenticated with check (auth.uid() = follower_id);
create policy "follows_delete_own" on public.follows for delete to authenticated using (auth.uid() = follower_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  n int := 0;
begin
  base_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g'));
  if base_username = '' or base_username is null then
    base_username := 'user';
  end if;
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    n := n + 1;
    final_username := base_username || n::text;
  end loop;
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger posts_touch_updated before update on public.posts for each row execute function public.touch_updated_at();
create trigger profiles_touch_updated before update on public.profiles for each row execute function public.touch_updated_at();
