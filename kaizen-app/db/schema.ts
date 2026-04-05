import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ─── Sync Metadata (factory — evita referências compartilhadas entre tabelas) ─

const makeSyncColumns = () => ({
  id:         text('id').primaryKey().notNull(),
  userId:     text('user_id').notNull(),
  createdAt:  text('created_at').notNull(),
  updatedAt:  text('updated_at').notNull(),
  deletedAt:  text('deleted_at'),
  syncStatus: text('sync_status', {
    enum: ['pending', 'synced', 'conflict'] as const,
  }).notNull().default('pending'),
});

// ─── habit_templates (tabela pública — admin gerencia, usuário lê) ─────────────

export const habitTemplates = sqliteTable('habit_templates', {
  id:                    text('id').primaryKey().notNull(),
  name:                  text('name').notNull(),
  icon:                  text('icon').notNull(),
  type:                  text('type', { enum: ['build', 'quit'] as const }).notNull(),
  frequencyType:         text('frequency_type', {
    enum: ['once_daily', 'multiple_daily'] as const,
  }).notNull(),
  defaultDailyTarget:    integer('default_daily_target'),
  defaultUnitLabel:      text('default_unit_label'),
  defaultIncrementValue: integer('default_increment_value'),
  category:              text('category').notNull(),
  isActive:              integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt:             text('created_at').notNull(),
});

// ─── task_categories ──────────────────────────────────────────────────────────

export const taskCategories = sqliteTable('task_categories', {
  ...makeSyncColumns(),
  name:  text('name').notNull(),
  color: text('color').notNull(),
  icon:  text('icon'),
  order: integer('order').notNull().default(0),
});

// ─── habits ───────────────────────────────────────────────────────────────────

export const habits = sqliteTable('habits', {
  ...makeSyncColumns(),
  name:           text('name').notNull(),
  icon:           text('icon').notNull(),
  type:           text('type', { enum: ['build', 'quit'] as const }).notNull(),
  frequencyType:  text('frequency_type', {
    enum: ['once_daily', 'multiple_daily'] as const,
  }).notNull(),
  startDate:      text('start_date').notNull(),
  dailyTarget:    integer('daily_target'),
  unitLabel:      text('unit_label'),
  incrementValue: integer('increment_value'),
  isActive:       integer('is_active', { mode: 'boolean' }).notNull().default(true),
  goalType:       text('goal_type', {
    enum: ['days', 'date_range', 'forever'] as const,
  }).notNull().default('forever'),
  goalTargetDays: integer('goal_target_days'),
  goalEndDate:    text('goal_end_date'),
  reminderEnabled:       integer('reminder_enabled', { mode: 'boolean' }).notNull().default(false),
  reminderMode:          text('reminder_mode', {
    enum: ['fixed_time', 'interval', 'both'] as const,
  }),
  reminderFixedTime:     text('reminder_fixed_time'),
  reminderIntervalHours: integer('reminder_interval_hours'),
  reminderIntervalStart: text('reminder_interval_start'),
  reminderIntervalEnd:   text('reminder_interval_end'),
  notificationIds:       text('notification_ids').notNull().default('[]'),
});

// ─── habit_logs ───────────────────────────────────────────────────────────────

export const habitLogs = sqliteTable('habit_logs', {
  ...makeSyncColumns(),
  habitId:     text('habit_id').notNull().references(() => habits.id),
  date:        text('date').notNull(),
  progress:    integer('progress').notNull().default(0),
  completedAt: text('completed_at'),
});

// ─── tasks ────────────────────────────────────────────────────────────────────

export const tasks = sqliteTable('tasks', {
  ...makeSyncColumns(),
  title:       text('title').notNull(),
  description: text('description'),
  priority:    text('priority', {
    enum: ['high', 'medium', 'low'] as const,
  }).notNull(),
  dueDate:     text('due_date'),
  completedAt: text('completed_at'),
  isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
  categoryId:  text('category_id').references(() => taskCategories.id),

  // ── Lembrete por horário ──────────────────────────────────────────────────
  reminderType:           text('reminder_type', {
    enum: ['time', 'location'] as const,
  }),
  reminderAt:             text('reminder_at'),               // ISO 8601 datetime
  reminderNotificationId: text('reminder_notification_id'), // expo-notifications ID

  // ── Lembrete por localização ──────────────────────────────────────────────
  locationName:     text('location_name'),
  locationAddress:  text('location_address'),
  locationLat:      real('location_lat'),
  locationLng:      real('location_lng'),
  locationRadius:   integer('location_radius'),
  locationTrigger:  text('location_trigger', {
    enum: ['arrive', 'leave'] as const,
  }),
  locationRegionId: text('location_region_id'),
});

// ─── sub_tasks ────────────────────────────────────────────────────────────────

export const subTasks = sqliteTable('sub_tasks', {
  ...makeSyncColumns(),
  taskId:      text('task_id').notNull().references(() => tasks.id),
  title:       text('title').notNull(),
  isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
  completedAt: text('completed_at'),
  order:       integer('order').notNull().default(0),
});

// ─── pomodoro_sessions ────────────────────────────────────────────────────────

export const pomodoroSessions = sqliteTable('pomodoro_sessions', {
  ...makeSyncColumns(),
  taskId:              text('task_id'),
  taskTitle:           text('task_title').notNull(),
  startedAt:           text('started_at').notNull(),
  endedAt:             text('ended_at'),
  completedCycles:     integer('completed_cycles').notNull().default(0),
  totalFocusMinutes:   integer('total_focus_minutes').notNull().default(0),
  wasAborted:          integer('was_aborted', { mode: 'boolean' }).notNull().default(false),
});

// ─── saved_locations ──────────────────────────────────────────────────────────

export const savedLocations = sqliteTable('saved_locations', {
  ...makeSyncColumns(),
  name:       text('name').notNull(),
  address:    text('address').notNull(),
  lat:        real('lat').notNull(),
  lng:        real('lng').notNull(),
  icon:       text('icon'),
  usageCount: integer('usage_count').notNull().default(0),
});

// ─── Tipos inferidos do schema ────────────────────────────────────────────────

export type HabitTemplateRow       = typeof habitTemplates.$inferSelect;
export type HabitRow               = typeof habits.$inferSelect;
export type NewHabitRow            = typeof habits.$inferInsert;
export type HabitLogRow            = typeof habitLogs.$inferSelect;
export type NewHabitLogRow         = typeof habitLogs.$inferInsert;
export type TaskRow                = typeof tasks.$inferSelect;
export type NewTaskRow             = typeof tasks.$inferInsert;
export type TaskCategoryRow        = typeof taskCategories.$inferSelect;
export type NewTaskCategoryRow     = typeof taskCategories.$inferInsert;
export type SubTaskRow             = typeof subTasks.$inferSelect;
export type NewSubTaskRow          = typeof subTasks.$inferInsert;
export type PomodoroSessionRow     = typeof pomodoroSessions.$inferSelect;
export type NewPomodoroSessionRow  = typeof pomodoroSessions.$inferInsert;
export type SavedLocationRow       = typeof savedLocations.$inferSelect;
export type NewSavedLocationRow    = typeof savedLocations.$inferInsert;
