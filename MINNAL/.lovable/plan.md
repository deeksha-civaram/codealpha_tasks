## Phase 3 — Collaboration, Discovery & Notifications

All four tracks selected. Grouping into 3 sub-phases so each ships cleanly. Approve once; I'll execute end-to-end.

---

### 3A — Realtime presence & live updates

**DB (migration):**
- Enable realtime on `tasks`, `activities`, `workspace_members`, `comments` (added in 3B).
- No new tables — presence rides Supabase Realtime channels (ephemeral).

**Frontend:**
- `usePresence(workspaceId)` hook — joins a `workspace:{id}` channel, tracks `{ user_id, name, avatar, route, cursor? }`, returns online member list.
- `PresenceBar` in `TopBar` — stacked avatars of currently-online workspace members with pulse dot.
- Live patch `useTasks` / `useActivities` via `postgres_changes` so Kanban + activity feed update for all members without refetch.
- Optional Kanban cursor ghosting (light, throttled to 30ms) showing other users dragging a card.

---

### 3B — Comments & @mentions

**DB (migration):**
- New table `task_comments` (task_id, user_id, body, mentions uuid[], parent_id nullable for threads).
- New table `notifications` (user_id, type, task_id, comment_id, workspace_id, actor_id, read_at).
- Extend `activity_action` enum with `commented`, `mentioned`.
- RLS: comments readable by task viewers (personal owner OR workspace member); notifications scoped to recipient `user_id`.
- Trigger: on comment insert with mentions → insert one notification per mentioned user + log activity.

**Frontend:**
- Comment thread panel in `TaskDialog` with textarea, `@` autocomplete from workspace members (lightweight popover, no extra deps).
- `NotificationsPopover` in `TopBar` (unread count badge, mark-read on open, deep-link to task).
- Activity feed picks up new `commented` / `mentioned` events automatically.

---

### 3C — Filters, search, saved views + email invites

**Filters & search:**
- New `TaskFilterBar` (status, priority, assignee multi-select, due-date range, text search) reused on `/tasks` and `/kanban`.
- Global `⌘K` command palette (`cmdk` is already pulled in via shadcn `command.tsx`) — jumps to tasks, workspaces, routes.
- New table `saved_views` (user_id, workspace_id nullable, name, filters jsonb, route). Sidebar shows current user's saved views per workspace; "Save current view" button in filter bar.

**Email invitations + notifications:**
- Set up Lovable Emails domain (will trigger the email-setup dialog on approval).
- Scaffold one transactional template: `workspace-invitation` (link to `/invite/{token}`).
- Update `workspaces.$id.members.tsx` invite flow: still creates the token row, additionally enqueues an email send when an email address is provided. Copy-link fallback stays.
- Optional digest: skip for now to keep scope tight — can add later.

---

### Out of scope for Phase 3
- File attachments on comments/tasks
- Per-user notification preferences UI (recipients get all mentions by default)
- SSO / per-workspace billing
- Mobile push notifications

---

### Execution order
1. Single migration covering 3A enable-realtime + 3B tables/enum/trigger + 3C `saved_views`.
2. Email infra setup dialog (3C) — only blocking step that needs your input mid-flow.
3. Frontend ships in order: presence → comments/notifications → filters/saved views → invite emails.

Approve and I'll start with the migration.