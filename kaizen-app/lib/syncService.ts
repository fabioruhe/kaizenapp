/**
 * syncService — sincronização bidirecional SQLite ↔ Supabase
 *
 * Estratégia:
 *  1. PUSH  — envia todas as linhas com syncStatus='pending' para o Supabase (upsert).
 *             Após sucesso, marca como 'synced' no SQLite.
 *  2. PULL  — busca todas as linhas do usuário no Supabase e faz upsert no SQLite.
 *             Linhas locais com syncStatus='pending' NÃO são sobrescritas (ganhos locais
 *             ainda não enviados têm prioridade). Para as demais, vence quem tem
 *             updated_at mais recente.
 *
 * Mapeamento de userId:
 *  - SQLite:   userId = device UUID (useOnboardingStore)
 *  - Supabase: user_id = Supabase auth UUID (session.user.id)
 *  No push reescrevemos user_id → Supabase UUID.
 *  No pull armazenamos com localUserId → device UUID.
 */

import { supabase } from './supabase';
import { db } from '@/db/client';
import {
  habits          as habitsT,
  habitLogs       as habitLogsT,
  tasks           as tasksT,
  subTasks        as subTasksT,
  taskCategories  as categoriesT,
  pomodoroSessions as pomodoroT,
} from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

// ─── Utilitários ──────────────────────────────────────────────────────────────

async function markSynced(table: typeof habitsT | typeof habitLogsT | typeof tasksT |
  typeof subTasksT | typeof categoriesT | typeof pomodoroT, ids: string[]) {
  if (ids.length === 0) return;
  await db.update(table as any).set({ syncStatus: 'synced' }).where(inArray((table as any).id, ids));
}

/** Retorna o Set de IDs locais que ainda têm syncStatus='pending'. */
async function pendingIds(
  table: typeof habitsT | typeof habitLogsT | typeof tasksT |
    typeof subTasksT | typeof categoriesT | typeof pomodoroT,
): Promise<Set<string>> {
  const rows = await db.select({ id: (table as any).id }).from(table as any)
    .where(eq((table as any).syncStatus, 'pending'));
  return new Set(rows.map((r: any) => r.id));
}

// ─── PUSH ─────────────────────────────────────────────────────────────────────

async function pushCategories(supabaseUserId: string) {
  const rows = await db.select().from(categoriesT).where(eq(categoriesT.syncStatus, 'pending'));
  if (!rows.length) return;

  const payload = rows.map((r) => ({
    id:          r.id,
    user_id:     supabaseUserId,
    created_at:  r.createdAt,
    updated_at:  r.updatedAt,
    deleted_at:  r.deletedAt ?? null,
    sync_status: 'synced',
    name:        r.name,
    color:       r.color,
    icon:        r.icon ?? null,
    order:       r.order,
  }));

  const { error } = await supabase.from('task_categories').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
  await markSynced(categoriesT, rows.map((r) => r.id));
}

async function pushHabits(supabaseUserId: string) {
  const rows = await db.select().from(habitsT).where(eq(habitsT.syncStatus, 'pending'));
  if (!rows.length) return;

  const payload = rows.map((r) => ({
    id:                      r.id,
    user_id:                 supabaseUserId,
    created_at:              r.createdAt,
    updated_at:              r.updatedAt,
    deleted_at:              r.deletedAt ?? null,
    sync_status:             'synced',
    name:                    r.name,
    icon:                    r.icon,
    type:                    r.type,
    frequency_type:          r.frequencyType,
    start_date:              r.startDate,
    daily_target:            r.dailyTarget ?? null,
    unit_label:              r.unitLabel ?? null,
    increment_value:         r.incrementValue ?? null,
    is_active:               r.isActive,
    goal_type:               r.goalType,
    goal_target_days:        r.goalTargetDays ?? null,
    goal_end_date:           r.goalEndDate ?? null,
    reminder_enabled:        r.reminderEnabled,
    reminder_mode:           r.reminderMode ?? null,
    reminder_fixed_time:     r.reminderFixedTime ?? null,
    reminder_interval_hours: r.reminderIntervalHours ?? null,
    reminder_interval_start: r.reminderIntervalStart ?? null,
    reminder_interval_end:   r.reminderIntervalEnd ?? null,
    notification_ids:        r.notificationIds,
  }));

  const { error } = await supabase.from('habits').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
  await markSynced(habitsT, rows.map((r) => r.id));
}

async function pushHabitLogs(supabaseUserId: string) {
  const rows = await db.select().from(habitLogsT).where(eq(habitLogsT.syncStatus, 'pending'));
  if (!rows.length) return;

  const payload = rows.map((r) => ({
    id:           r.id,
    user_id:      supabaseUserId,
    created_at:   r.createdAt,
    updated_at:   r.updatedAt,
    deleted_at:   r.deletedAt ?? null,
    sync_status:  'synced',
    habit_id:     r.habitId,
    date:         r.date,
    progress:     r.progress,
    completed_at: r.completedAt ?? null,
  }));

  const { error } = await supabase.from('habit_logs').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
  await markSynced(habitLogsT, rows.map((r) => r.id));
}

async function pushTasks(supabaseUserId: string) {
  const rows = await db.select().from(tasksT).where(eq(tasksT.syncStatus, 'pending'));
  if (!rows.length) return;

  const payload = rows.map((r) => ({
    id:           r.id,
    user_id:      supabaseUserId,
    created_at:   r.createdAt,
    updated_at:   r.updatedAt,
    deleted_at:   r.deletedAt ?? null,
    sync_status:  'synced',
    title:        r.title,
    description:  r.description ?? null,
    priority:     r.priority,
    due_date:     r.dueDate ?? null,
    completed_at: r.completedAt ?? null,
    is_completed: r.isCompleted,
    category_id:  r.categoryId ?? null,
  }));

  const { error } = await supabase.from('tasks').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
  await markSynced(tasksT, rows.map((r) => r.id));
}

async function pushSubTasks(supabaseUserId: string) {
  const rows = await db.select().from(subTasksT).where(eq(subTasksT.syncStatus, 'pending'));
  if (!rows.length) return;

  const payload = rows.map((r) => ({
    id:           r.id,
    user_id:      supabaseUserId,
    created_at:   r.createdAt,
    updated_at:   r.updatedAt,
    deleted_at:   r.deletedAt ?? null,
    sync_status:  'synced',
    task_id:      r.taskId,
    title:        r.title,
    is_completed: r.isCompleted,
    completed_at: r.completedAt ?? null,
    order:        r.order,
  }));

  const { error } = await supabase.from('sub_tasks').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
  await markSynced(subTasksT, rows.map((r) => r.id));
}

async function pushPomodoroSessions(supabaseUserId: string) {
  const rows = await db.select().from(pomodoroT).where(eq(pomodoroT.syncStatus, 'pending'));
  if (!rows.length) return;

  const payload = rows.map((r) => ({
    id:                  r.id,
    user_id:             supabaseUserId,
    created_at:          r.createdAt,
    updated_at:          r.updatedAt,
    deleted_at:          r.deletedAt ?? null,
    sync_status:         'synced',
    task_id:             r.taskId ?? null,
    task_title:          r.taskTitle,
    started_at:          r.startedAt,
    ended_at:            r.endedAt ?? null,
    completed_cycles:    r.completedCycles,
    total_focus_minutes: r.totalFocusMinutes,
    was_aborted:         r.wasAborted,
  }));

  const { error } = await supabase.from('pomodoro_sessions').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
  await markSynced(pomodoroT, rows.map((r) => r.id));
}

// ─── PULL ─────────────────────────────────────────────────────────────────────

/**
 * Upsert a lista de linhas remotas numa tabela local.
 * Regras de conflito:
 *  - Se o ID está no Set pendingSet → pula (local tem mudanças não enviadas)
 *  - Se a linha já existe localmente mas remote.updated_at <= local.updated_at → pula
 *  - Caso contrário → upsert (insert ou update)
 */
async function upsertRows(
  table: any,
  localRows: Map<string, { updatedAt: string }>,
  pendingSet: Set<string>,
  newRows: (typeof table.$inferInsert)[],
) {
  for (const row of newRows) {
    if (pendingSet.has(row.id)) continue;
    const existing = localRows.get(row.id);
    if (existing && existing.updatedAt >= row.updatedAt) continue;

    await db.insert(table).values(row).onConflictDoUpdate({
      target: table.id,
      set: (() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...rest } = row as any;
        return rest;
      })(),
    });
  }
}

async function pullCategories(supabaseUserId: string, localUserId: string) {
  const { data, error } = await supabase
    .from('task_categories').select('*').eq('user_id', supabaseUserId);
  if (error) throw error;
  if (!data?.length) return;

  const [existing, pending] = await Promise.all([
    db.select({ id: categoriesT.id, updatedAt: categoriesT.updatedAt }).from(categoriesT),
    pendingIds(categoriesT),
  ]);
  const localMap = new Map(existing.map((r) => [r.id, r]));

  const rows = data.map((r) => ({
    id:         r.id,
    userId:     localUserId,
    createdAt:  r.created_at,
    updatedAt:  r.updated_at,
    deletedAt:  r.deleted_at ?? null,
    syncStatus: 'synced' as const,
    name:       r.name,
    color:      r.color,
    icon:       r.icon ?? null,
    order:      r.order ?? 0,
  }));

  await upsertRows(categoriesT, localMap, pending, rows);
}

async function pullHabits(supabaseUserId: string, localUserId: string) {
  const { data, error } = await supabase
    .from('habits').select('*').eq('user_id', supabaseUserId);
  if (error) throw error;
  if (!data?.length) return;

  const [existing, pending] = await Promise.all([
    db.select({ id: habitsT.id, updatedAt: habitsT.updatedAt }).from(habitsT),
    pendingIds(habitsT),
  ]);
  const localMap = new Map(existing.map((r) => [r.id, r]));

  const rows = data.map((r) => ({
    id:                      r.id,
    userId:                  localUserId,
    createdAt:               r.created_at,
    updatedAt:               r.updated_at,
    deletedAt:               r.deleted_at ?? null,
    syncStatus:              'synced' as const,
    name:                    r.name,
    icon:                    r.icon,
    type:                    r.type,
    frequencyType:           r.frequency_type,
    startDate:               r.start_date,
    dailyTarget:             r.daily_target ?? null,
    unitLabel:               r.unit_label ?? null,
    incrementValue:          r.increment_value ?? null,
    isActive:                r.is_active ?? true,
    goalType:                r.goal_type ?? 'forever',
    goalTargetDays:          r.goal_target_days ?? null,
    goalEndDate:             r.goal_end_date ?? null,
    reminderEnabled:         r.reminder_enabled ?? false,
    reminderMode:            r.reminder_mode ?? null,
    reminderFixedTime:       r.reminder_fixed_time ?? null,
    reminderIntervalHours:   r.reminder_interval_hours ?? null,
    reminderIntervalStart:   r.reminder_interval_start ?? null,
    reminderIntervalEnd:     r.reminder_interval_end ?? null,
    notificationIds:         r.notification_ids ?? '[]',
  }));

  await upsertRows(habitsT, localMap, pending, rows);
}

async function pullHabitLogs(supabaseUserId: string, localUserId: string) {
  const { data, error } = await supabase
    .from('habit_logs').select('*').eq('user_id', supabaseUserId);
  if (error) throw error;
  if (!data?.length) return;

  const [existing, pending] = await Promise.all([
    db.select({ id: habitLogsT.id, updatedAt: habitLogsT.updatedAt }).from(habitLogsT),
    pendingIds(habitLogsT),
  ]);
  const localMap = new Map(existing.map((r) => [r.id, r]));

  const rows = data.map((r) => ({
    id:          r.id,
    userId:      localUserId,
    createdAt:   r.created_at,
    updatedAt:   r.updated_at,
    deletedAt:   r.deleted_at ?? null,
    syncStatus:  'synced' as const,
    habitId:     r.habit_id,
    date:        r.date,
    progress:    r.progress ?? 0,
    completedAt: r.completed_at ?? null,
  }));

  await upsertRows(habitLogsT, localMap, pending, rows);
}

async function pullTasks(supabaseUserId: string, localUserId: string) {
  const { data, error } = await supabase
    .from('tasks').select('*').eq('user_id', supabaseUserId);
  if (error) throw error;
  if (!data?.length) return;

  const [existing, pending] = await Promise.all([
    db.select({ id: tasksT.id, updatedAt: tasksT.updatedAt }).from(tasksT),
    pendingIds(tasksT),
  ]);
  const localMap = new Map(existing.map((r) => [r.id, r]));

  const rows = data.map((r) => ({
    id:          r.id,
    userId:      localUserId,
    createdAt:   r.created_at,
    updatedAt:   r.updated_at,
    deletedAt:   r.deleted_at ?? null,
    syncStatus:  'synced' as const,
    title:       r.title,
    description: r.description ?? null,
    priority:    r.priority,
    dueDate:     r.due_date ?? null,
    completedAt: r.completed_at ?? null,
    isCompleted: r.is_completed ?? false,
    categoryId:  r.category_id ?? null,
  }));

  await upsertRows(tasksT, localMap, pending, rows);
}

async function pullSubTasks(supabaseUserId: string, localUserId: string) {
  const { data, error } = await supabase
    .from('sub_tasks').select('*').eq('user_id', supabaseUserId);
  if (error) throw error;
  if (!data?.length) return;

  const [existing, pending] = await Promise.all([
    db.select({ id: subTasksT.id, updatedAt: subTasksT.updatedAt }).from(subTasksT),
    pendingIds(subTasksT),
  ]);
  const localMap = new Map(existing.map((r) => [r.id, r]));

  const rows = data.map((r) => ({
    id:          r.id,
    userId:      localUserId,
    createdAt:   r.created_at,
    updatedAt:   r.updated_at,
    deletedAt:   r.deleted_at ?? null,
    syncStatus:  'synced' as const,
    taskId:      r.task_id,
    title:       r.title,
    isCompleted: r.is_completed ?? false,
    completedAt: r.completed_at ?? null,
    order:       r.order ?? 0,
  }));

  await upsertRows(subTasksT, localMap, pending, rows);
}

async function pullPomodoroSessions(supabaseUserId: string, localUserId: string) {
  const { data, error } = await supabase
    .from('pomodoro_sessions').select('*').eq('user_id', supabaseUserId);
  if (error) throw error;
  if (!data?.length) return;

  const [existing, pending] = await Promise.all([
    db.select({ id: pomodoroT.id, updatedAt: pomodoroT.updatedAt }).from(pomodoroT),
    pendingIds(pomodoroT),
  ]);
  const localMap = new Map(existing.map((r) => [r.id, r]));

  const rows = data.map((r) => ({
    id:                r.id,
    userId:            localUserId,
    createdAt:         r.created_at,
    updatedAt:         r.updated_at,
    deletedAt:         r.deleted_at ?? null,
    syncStatus:        'synced' as const,
    taskId:            r.task_id ?? null,
    taskTitle:         r.task_title,
    startedAt:         r.started_at,
    endedAt:           r.ended_at ?? null,
    completedCycles:   r.completed_cycles ?? 0,
    totalFocusMinutes: r.total_focus_minutes ?? 0,
    wasAborted:        r.was_aborted ?? false,
  }));

  await upsertRows(pomodoroT, localMap, pending, rows);
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Envia todas as mudanças locais pendentes para o Supabase.
 * Ordem: categories → habits → tasks → habit_logs → sub_tasks → pomodoro_sessions
 */
export async function pushToCloud(supabaseUserId: string): Promise<void> {
  await pushCategories(supabaseUserId);
  await pushHabits(supabaseUserId);
  await pushTasks(supabaseUserId);
  await pushHabitLogs(supabaseUserId);
  await pushSubTasks(supabaseUserId);
  await pushPomodoroSessions(supabaseUserId);
}

/**
 * Baixa todos os dados do usuário do Supabase e aplica no SQLite local.
 * Ordem: categories → habits → tasks → habit_logs → sub_tasks → pomodoro_sessions
 */
export async function pullFromCloud(supabaseUserId: string, localUserId: string): Promise<void> {
  await pullCategories(supabaseUserId, localUserId);
  await pullHabits(supabaseUserId, localUserId);
  await pullTasks(supabaseUserId, localUserId);
  await pullHabitLogs(supabaseUserId, localUserId);
  await pullSubTasks(supabaseUserId, localUserId);
  await pullPomodoroSessions(supabaseUserId, localUserId);
}

/**
 * Executa a sincronização completa: push primeiro, depois pull.
 * @param supabaseUserId  ID do usuário no Supabase Auth (session.user.id)
 * @param localUserId     ID local do dispositivo (useOnboardingStore → userId)
 */
export async function runSync(supabaseUserId: string, localUserId: string): Promise<void> {
  await pushToCloud(supabaseUserId);
  await pullFromCloud(supabaseUserId, localUserId);
}
