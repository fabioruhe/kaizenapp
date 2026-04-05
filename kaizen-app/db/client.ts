import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

// ─── Abertura do banco ────────────────────────────────────────────────────────

const expo = SQLite.openDatabaseSync('kaizen.db');

// ─── Configurações de performance e integridade ───────────────────────────────

expo.execSync('PRAGMA journal_mode = WAL;');
expo.execSync('PRAGMA foreign_keys = ON;');
expo.execSync('PRAGMA synchronous = NORMAL;');

// ─── Helper: ALTER TABLE idempotente ─────────────────────────────────────────
// SQLite não suporta "ADD COLUMN IF NOT EXISTS" — silencia o erro de coluna duplicada.

function addColumn(sql: string): void {
  try {
    expo.execSync(sql);
  } catch {
    // Ignora "duplicate column name" — a coluna já existe
  }
}

// ─── Criação das tabelas (idempotente) ────────────────────────────────────────

expo.execSync(`
  CREATE TABLE IF NOT EXISTS habit_templates (
    id                      TEXT PRIMARY KEY NOT NULL,
    name                    TEXT NOT NULL,
    icon                    TEXT NOT NULL,
    type                    TEXT NOT NULL CHECK(type IN ('build','quit')),
    frequency_type          TEXT NOT NULL CHECK(frequency_type IN ('once_daily','multiple_daily')),
    default_daily_target    INTEGER,
    default_unit_label      TEXT,
    default_increment_value INTEGER,
    category                TEXT NOT NULL,
    is_active               INTEGER NOT NULL DEFAULT 1,
    created_at              TEXT NOT NULL
  );
`);

expo.execSync(`
  CREATE TABLE IF NOT EXISTS task_categories (
    id          TEXT PRIMARY KEY NOT NULL,
    user_id     TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    deleted_at  TEXT,
    sync_status TEXT NOT NULL DEFAULT 'pending'
                CHECK(sync_status IN ('pending','synced','conflict')),
    name        TEXT NOT NULL,
    color       TEXT NOT NULL,
    icon        TEXT,
    "order"     INTEGER NOT NULL DEFAULT 0
  );
`);

expo.execSync(`
  CREATE TABLE IF NOT EXISTS habits (
    id               TEXT PRIMARY KEY NOT NULL,
    user_id          TEXT NOT NULL,
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL,
    deleted_at       TEXT,
    sync_status      TEXT NOT NULL DEFAULT 'pending'
                     CHECK(sync_status IN ('pending','synced','conflict')),
    name             TEXT NOT NULL,
    icon             TEXT NOT NULL,
    type             TEXT NOT NULL CHECK(type IN ('build','quit')),
    frequency_type   TEXT NOT NULL CHECK(frequency_type IN ('once_daily','multiple_daily')),
    start_date       TEXT NOT NULL,
    daily_target     INTEGER,
    unit_label       TEXT,
    increment_value  INTEGER,
    is_active        INTEGER NOT NULL DEFAULT 1,
    goal_type        TEXT NOT NULL DEFAULT 'forever'
                     CHECK(goal_type IN ('days','date_range','forever')),
    goal_target_days INTEGER,
    goal_end_date    TEXT,
    reminder_enabled         INTEGER NOT NULL DEFAULT 0,
    reminder_mode            TEXT
                             CHECK(reminder_mode IN ('fixed_time','interval','both')),
    reminder_fixed_time      TEXT,
    reminder_interval_hours  INTEGER,
    reminder_interval_start  TEXT,
    reminder_interval_end    TEXT,
    notification_ids         TEXT NOT NULL DEFAULT '[]'
  );
`);

// ─── Migration: adicionar colunas ao habits (bancos já existentes) ────────────

addColumn(`ALTER TABLE habits ADD COLUMN goal_type        TEXT NOT NULL DEFAULT 'forever'`);
addColumn(`ALTER TABLE habits ADD COLUMN goal_target_days INTEGER`);
addColumn(`ALTER TABLE habits ADD COLUMN goal_end_date    TEXT`);
addColumn(`ALTER TABLE habits ADD COLUMN reminder_enabled         INTEGER NOT NULL DEFAULT 0`);
addColumn(`ALTER TABLE habits ADD COLUMN reminder_mode            TEXT`);
addColumn(`ALTER TABLE habits ADD COLUMN reminder_fixed_time      TEXT`);
addColumn(`ALTER TABLE habits ADD COLUMN reminder_interval_hours  INTEGER`);
addColumn(`ALTER TABLE habits ADD COLUMN reminder_interval_start  TEXT`);
addColumn(`ALTER TABLE habits ADD COLUMN reminder_interval_end    TEXT`);
addColumn(`ALTER TABLE habits ADD COLUMN notification_ids         TEXT NOT NULL DEFAULT '[]'`);

expo.execSync(`
  CREATE TABLE IF NOT EXISTS habit_logs (
    id           TEXT PRIMARY KEY NOT NULL,
    user_id      TEXT NOT NULL,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL,
    deleted_at   TEXT,
    sync_status  TEXT NOT NULL DEFAULT 'pending'
                 CHECK(sync_status IN ('pending','synced','conflict')),
    habit_id     TEXT NOT NULL REFERENCES habits(id),
    date         TEXT NOT NULL,
    progress     INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT
  );
`);

expo.execSync(`
  CREATE TABLE IF NOT EXISTS tasks (
    id           TEXT PRIMARY KEY NOT NULL,
    user_id      TEXT NOT NULL,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL,
    deleted_at   TEXT,
    sync_status  TEXT NOT NULL DEFAULT 'pending'
                 CHECK(sync_status IN ('pending','synced','conflict')),
    title        TEXT NOT NULL,
    description  TEXT,
    priority     TEXT NOT NULL CHECK(priority IN ('high','medium','low')),
    due_date     TEXT,
    completed_at TEXT,
    is_completed INTEGER NOT NULL DEFAULT 0,
    category_id  TEXT REFERENCES task_categories(id)
  );
`);

// ─── Migration: adicionar colunas ao tasks (bancos já existentes) ─────────────

addColumn(`ALTER TABLE tasks ADD COLUMN category_id TEXT REFERENCES task_categories(id)`);

// ─── Índices para queries frequentes ─────────────────────────────────────────

expo.execSync(`
  CREATE INDEX IF NOT EXISTS idx_habits_user_active
    ON habits(user_id, deleted_at, is_active);
`);

expo.execSync(`
  CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date
    ON habit_logs(habit_id, date, deleted_at);
`);

expo.execSync(`
  CREATE INDEX IF NOT EXISTS idx_tasks_user_completed
    ON tasks(user_id, deleted_at, is_completed);
`);

expo.execSync(`
  CREATE INDEX IF NOT EXISTS idx_tasks_category
    ON tasks(category_id, deleted_at);
`);

expo.execSync(`
  CREATE INDEX IF NOT EXISTS idx_task_categories_user
    ON task_categories(user_id, deleted_at, "order");
`);

expo.execSync(`
  CREATE INDEX IF NOT EXISTS idx_sync_pending_habits
    ON habits(sync_status) WHERE sync_status = 'pending';
`);

expo.execSync(`
  CREATE INDEX IF NOT EXISTS idx_sync_pending_tasks
    ON tasks(sync_status) WHERE sync_status = 'pending';
`);

expo.execSync(`
  CREATE TABLE IF NOT EXISTS sub_tasks (
    id           TEXT PRIMARY KEY NOT NULL,
    user_id      TEXT NOT NULL,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL,
    deleted_at   TEXT,
    sync_status  TEXT NOT NULL DEFAULT 'pending'
                 CHECK(sync_status IN ('pending','synced','conflict')),
    task_id      TEXT NOT NULL REFERENCES tasks(id),
    title        TEXT NOT NULL,
    is_completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    "order"      INTEGER NOT NULL DEFAULT 0
  );
`);

expo.execSync(`
  CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id                   TEXT PRIMARY KEY NOT NULL,
    user_id              TEXT NOT NULL,
    created_at           TEXT NOT NULL,
    updated_at           TEXT NOT NULL,
    deleted_at           TEXT,
    sync_status          TEXT NOT NULL DEFAULT 'pending'
                         CHECK(sync_status IN ('pending','synced','conflict')),
    task_id              TEXT,
    task_title           TEXT NOT NULL,
    started_at           TEXT NOT NULL,
    ended_at             TEXT,
    completed_cycles     INTEGER NOT NULL DEFAULT 0,
    total_focus_minutes  INTEGER NOT NULL DEFAULT 0,
    was_aborted          INTEGER NOT NULL DEFAULT 0
  );
`);

expo.execSync(`
  CREATE INDEX IF NOT EXISTS idx_sub_tasks_task
    ON sub_tasks(task_id, deleted_at, "order");
`);

expo.execSync(`
  CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user
    ON pomodoro_sessions(user_id, deleted_at, started_at);
`);

// ─── Instância Drizzle (singleton) ───────────────────────────────────────────

export const db = drizzle(expo, { schema });
