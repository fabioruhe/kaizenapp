-- ============================================================
-- Kaizen — Migração inicial (rodar no Supabase SQL Editor)
-- ============================================================
-- Execute todo o bloco de uma vez. É idempotente (IF NOT EXISTS).
-- ============================================================

-- ─── task_categories ─────────────────────────────────────────────────────────

create table if not exists task_categories (
  id          text        primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  created_at  text        not null,
  updated_at  text        not null,
  deleted_at  text,
  sync_status text        not null default 'synced',
  name        text        not null,
  color       text        not null,
  icon        text,
  "order"     integer     not null default 0
);

alter table task_categories enable row level security;

drop policy if exists "Users manage own task_categories" on task_categories;
create policy "Users manage own task_categories" on task_categories
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── habits ──────────────────────────────────────────────────────────────────

create table if not exists habits (
  id                       text    primary key,
  user_id                  uuid    not null references auth.users(id) on delete cascade,
  created_at               text    not null,
  updated_at               text    not null,
  deleted_at               text,
  sync_status              text    not null default 'synced',
  name                     text    not null,
  icon                     text    not null,
  type                     text    not null check (type in ('build', 'quit')),
  frequency_type           text    not null check (frequency_type in ('once_daily', 'multiple_daily')),
  start_date               text    not null,
  daily_target             integer,
  unit_label               text,
  increment_value          integer,
  is_active                boolean not null default true,
  goal_type                text    not null default 'forever',
  goal_target_days         integer,
  goal_end_date            text,
  reminder_enabled         boolean not null default false,
  reminder_mode            text,
  reminder_fixed_time      text,
  reminder_interval_hours  integer,
  reminder_interval_start  text,
  reminder_interval_end    text,
  notification_ids         text    not null default '[]'
);

alter table habits enable row level security;

drop policy if exists "Users manage own habits" on habits;
create policy "Users manage own habits" on habits
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── habit_logs ───────────────────────────────────────────────────────────────

create table if not exists habit_logs (
  id           text    primary key,
  user_id      uuid    not null references auth.users(id) on delete cascade,
  created_at   text    not null,
  updated_at   text    not null,
  deleted_at   text,
  sync_status  text    not null default 'synced',
  habit_id     text    not null references habits(id) on delete cascade,
  date         text    not null,
  progress     integer not null default 0,
  completed_at text
);

alter table habit_logs enable row level security;

drop policy if exists "Users manage own habit_logs" on habit_logs;
create policy "Users manage own habit_logs" on habit_logs
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── tasks ───────────────────────────────────────────────────────────────────

create table if not exists tasks (
  id           text    primary key,
  user_id      uuid    not null references auth.users(id) on delete cascade,
  created_at   text    not null,
  updated_at   text    not null,
  deleted_at   text,
  sync_status  text    not null default 'synced',
  title        text    not null,
  description  text,
  priority     text    not null check (priority in ('high', 'medium', 'low')),
  due_date     text,
  completed_at text,
  is_completed boolean not null default false,
  category_id  text    references task_categories(id) on delete set null
);

alter table tasks enable row level security;

drop policy if exists "Users manage own tasks" on tasks;
create policy "Users manage own tasks" on tasks
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── sub_tasks ────────────────────────────────────────────────────────────────

create table if not exists sub_tasks (
  id           text    primary key,
  user_id      uuid    not null references auth.users(id) on delete cascade,
  created_at   text    not null,
  updated_at   text    not null,
  deleted_at   text,
  sync_status  text    not null default 'synced',
  task_id      text    not null references tasks(id) on delete cascade,
  title        text    not null,
  is_completed boolean not null default false,
  completed_at text,
  "order"      integer not null default 0
);

alter table sub_tasks enable row level security;

drop policy if exists "Users manage own sub_tasks" on sub_tasks;
create policy "Users manage own sub_tasks" on sub_tasks
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── pomodoro_sessions ────────────────────────────────────────────────────────

create table if not exists pomodoro_sessions (
  id                   text    primary key,
  user_id              uuid    not null references auth.users(id) on delete cascade,
  created_at           text    not null,
  updated_at           text    not null,
  deleted_at           text,
  sync_status          text    not null default 'synced',
  task_id              text,
  task_title           text    not null,
  started_at           text    not null,
  ended_at             text,
  completed_cycles     integer not null default 0,
  total_focus_minutes  integer not null default 0,
  was_aborted          boolean not null default false
);

alter table pomodoro_sessions enable row level security;

drop policy if exists "Users manage own pomodoro_sessions" on pomodoro_sessions;
create policy "Users manage own pomodoro_sessions" on pomodoro_sessions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
