# Supabase Migration Plan

How the tianxing-dispatch app moves from its current **local SQLite** backend to a
shared **Supabase (cloud Postgres)** backend with real authentication.

> Status: **planning only** — nothing here is wired up yet. The app currently runs
> on local SQLite with front-end-only demo login. This document is the checklist and
> reference for when we do the switch.

---

## Contents

1. [Why this is low-risk](#1-why-this-is-low-risk)
2. [Decisions to make first](#2-decisions-to-make-first)
3. [Target database schema](#3-target-database-schema)
4. [Auth, profiles & Row-Level Security](#4-auth-profiles--row-level-security)
5. [The two real reworks](#5-the-two-real-reworks)
6. [Code changes](#6-code-changes)
7. [Moving existing data](#7-moving-existing-data)
8. [Environment & CI secrets](#8-environment--ci-secrets)
9. [Behavior changes to expect](#9-behavior-changes-to-expect)
10. [Pre-flight checklist](#10-pre-flight-checklist)
11. [Test plan](#11-test-plan)
12. [Rollback](#12-rollback)

---

## 1. Why this is low-risk

The app was built for this from day one:

- All data access already goes through the `JobRepository` interface
  ([src/main/repository/JobRepository.js](src/main/repository/JobRepository.js)).
  Today it's `SqliteJobRepository`; the swap is a new `SupabaseJobRepository` with the
  same three methods (`list`, `save`, `delete`) and **one changed line** in
  [src/main/ipc.js](src/main/ipc.js).
- Repository methods are already `async`, matching Supabase's client — no call-shape
  changes in the UI.
- The data model maps 1:1 to Postgres columns, and `id` is already a string, so a
  Postgres `uuid` drops in cleanly.

The parts that need genuine thought are **offline behavior** and **concurrent
editing** (Section 5) — not the plumbing.

---

## 2. Decisions to make first

| Decision | Options | Notes |
|---|---|---|
| **Connectivity** | Online-only **vs** offline-capable | App currently works with no internet. Online-only is far simpler for v1; offline+sync is a separate, larger effort. **Biggest decision.** |
| **Plan** | Free **vs** Pro ($25/mo) | Free projects **auto-pause after ~7 days idle** and have **no automatic backups**. A real business tool should be on Pro for backups + no pausing. |
| **Region** | Southeast Asia (Singapore) | Closest to Taiwan → lowest latency. |
| **Accounts** | Real emails + passwords | Replace the demo `123456`. Provide the real email → city list. |
| **`job_date` type** | Keep as `text` ('YYYYMMDD') **vs** real `date` | Keeping text = zero code change now. Converting to a real `date` enables better range queries later. Recommend: keep text for the first cut. |

---

## 3. Target database schema

Draft DDL (finalized during implementation). Note `total_price` becomes an
**auto-computed column** — the app stops calculating it.

```sql
create table public.jobs (
  id               uuid primary key default gen_random_uuid(),
  branch           text not null check (branch in ('台北','新竹','高雄')),
  job_date         text    default '',        -- 'YYYYMMDD' (text for now)
  job_time         text    default '',
  customer_name    text    default '',
  phone            text    default '',
  move_in_address  text    default '',
  move_out_address text    default '',
  unit_price       integer default 0,
  tax_status       text    default '未稅' check (tax_status in ('含稅','未稅')),
  quantity         integer default 1,
  total_price      integer generated always as (unit_price * quantity) stored,
  payment_method   text    default '現金' check (payment_method in ('現金','月結')),
  payment_status   text    default '未付款' check (payment_status in ('已付款','未付款')),
  note             text    default '',
  sort_order       integer default 0,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index jobs_branch_idx on public.jobs (branch);

-- keep updated_at fresh (used for concurrency checks, see Section 5)
create or replace function public.set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();
```

---

## 4. Auth, profiles & Row-Level Security

Real, **server-enforced** access control — a manager physically cannot fetch another
city's rows, unlike today's UI-only gating.

**Accounts:** one Supabase Auth user per email.

**Profiles** — maps each user to a role and the cities they may access:

```sql
create table public.profiles (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  role     text not null default 'manager' check (role in ('ceo','manager')),
  branches text[] not null default '{}'    -- e.g. {'台北'};  CEO = all three
);
alter table public.profiles enable row level security;

create policy "read own profile" on public.profiles
  for select using (user_id = auth.uid());
```

**RLS on `jobs`** — read + write limited to the user's branches (CEO = all):

```sql
alter table public.jobs enable row level security;

create policy "read allowed branches" on public.jobs
  for select using (
    exists (select 1 from public.profiles p
            where p.user_id = auth.uid()
              and (p.role = 'ceo' or jobs.branch = any(p.branches))));

create policy "write allowed branches" on public.jobs
  for all using (
    exists (select 1 from public.profiles p
            where p.user_id = auth.uid()
              and (p.role = 'ceo' or jobs.branch = any(p.branches))))
  with check (
    exists (select 1 from public.profiles p
            where p.user_id = auth.uid()
              and (p.role = 'ceo' or jobs.branch = any(p.branches))));
```

The `with check` clause is what stops a manager from *creating/moving* a row into a
city they don't own.

Seed profiles (example):

```sql
-- after creating the auth users, map them:
-- ceo@fyf.com.tw       -> role 'ceo',     branches {台北,新竹,高雄}
-- taipei@fyf.com.tw    -> role 'manager', branches {台北}
-- hsinchu@fyf.com.tw   -> role 'manager', branches {新竹}
-- kaohsiung@fyf.com.tw -> role 'manager', branches {高雄}
```

---

## 5. The two real reworks

### a) Concurrent editing (Save logic)

Today *Save* replaces the **whole branch's rows** at once and deletes any ids missing
from the working copy (see `save()` in
[src/main/repository/SqliteJobRepository.js](src/main/repository/SqliteJobRepository.js)
and [src/renderer/composables/useJobs.js](src/renderer/composables/useJobs.js)). With
multiple people on shared data, that can **clobber or delete a colleague's concurrent
edits**.

Move to:
- **Per-row upserts** keyed by `id` (not a whole-branch replace).
- **Optimistic concurrency**: include the row's `updated_at`; reject/merge if the
  server copy is newer.
- Explicit per-row **delete** only (no "everything not in my list" deletion).
- Optional: **Supabase Realtime** subscription so others' changes appear live.

### b) Where the session lives

RLS needs the request to carry the **logged-in user's** JWT. The Supabase client (and
its session) is easiest to run in the **renderer**, where Supabase Auth persists the
session automatically. The `JobRepository` interface stays identical, so screens don't
change — but the implementation may live renderer-side instead of behind IPC. Decide
during implementation; either works.

---

## 6. Code changes

- Add dependency: `@supabase/supabase-js`.
- New `SupabaseJobRepository` implementing `list` / `save` / `delete`.
- Swap the active repository in [src/main/ipc.js](src/main/ipc.js) (one line) — or move
  it renderer-side per Section 5b.
- Replace [src/renderer/composables/useAuth.js](src/renderer/composables/useAuth.js)
  with Supabase Auth: `signInWithPassword`, session persistence, `onAuthStateChange`;
  derive `allowedBranches` from the `profiles` row instead of the hardcoded map.
- App stops sending `total_price` (now a generated column).
- **Backend toggle**: a config flag to select SQLite vs Supabase, so we can cut over
  gradually and fall back instantly.

---

## 7. Moving existing data

Each installed PC has its **own** local SQLite DB (`tianxing.db` in the OS user-data
folder). Before cutover:

- **If it's still test data** → start fresh in the cloud; nothing to migrate.
- **If a machine has real jobs** → export its rows to JSON/CSV and import into Supabase
  (new `id`s auto-assigned). If several machines hold data, consolidate and de-duplicate
  (match on branch + date + phone + addresses).
- Verify **row counts and totals** match the source before decommissioning local data.

---

## 8. Environment & CI secrets

From [.env.example](.env.example) → copy to `.env` (git-ignored):

```
MAIN_VITE_SUPABASE_URL=...
MAIN_VITE_SUPABASE_ANON_KEY=...
```

- Values come from **Supabase → Settings → API**.
- The **anon/public** key is safe to ship in the app; the **service_role** key must
  never be committed or bundled.
- If building installers via GitHub Actions, add the same two values as **GitHub
  repository secrets** and reference them in
  [.github/workflows/build.yml](.github/workflows/build.yml).

---

## 9. Behavior changes to expect

- The app **requires internet** (unless offline mode is built).
- All branches share **one always-current dataset** — no more per-machine copies.
- Others' edits can appear live.
- Login is real: password resets, lockouts, etc.
- Access control is enforced on the **server**, not just hidden in the UI.

---

## 10. Pre-flight checklist

- [ ] Supabase account created
- [ ] Project created in **Singapore**, DB password saved
- [ ] `Project URL` + `anon key` copied into local `.env`
- [ ] Same values added as GitHub secrets (if using CI builds)
- [ ] Decided: **online-only vs offline**
- [ ] Decided: **Free vs Pro**
- [ ] Real **email → city** account list prepared
- [ ] Confirmed whether existing local data must be migrated

---

## 11. Test plan

- [ ] Each role sees only permitted cities (manager = one, CEO = all)
- [ ] A manager **cannot** read another city's rows even via direct query (RLS holds)
- [ ] A manager cannot insert/move a row into a city they don't own (`with check`)
- [ ] Two users editing the same branch at once do **not** clobber each other
- [ ] Connection loss shows a clear message and does not corrupt data
- [ ] Migrated row counts and `total_price` sums match the source
- [ ] Login / logout / session-restore work across app restarts

---

## 12. Rollback

Because a **backend toggle** (Section 6) keeps SQLite in place:

- If anything goes wrong after cutover, flip the toggle back to SQLite to restore local
  operation immediately.
- Keep each machine's local `tianxing.db` until the Supabase backend has run cleanly in
  production for an agreed period.
```
