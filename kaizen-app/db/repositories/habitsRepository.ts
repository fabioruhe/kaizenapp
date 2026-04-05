import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../client';
import { habits } from '../schema';
import type { HabitsRepository } from './habitsRepository.types';

export type { HabitsRepository } from './habitsRepository.types';
import type { Habit, CreateHabitDTO, UpdateHabitDTO, GoalType, ReminderMode } from '@/types';
import { generateId } from '@/utils/uuid';
import { nowISO } from '@/utils/dateHelpers';

// ─── Helpers de serialização ──────────────────────────────────────────────────
// notificationIds é armazenado como JSON text no SQLite

function serializeIds(ids: string[]): string {
  return JSON.stringify(ids);
}

function parseIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; }
  catch { return []; }
}

// ─── Mapeamento row → domínio ─────────────────────────────────────────────────

function toHabit(row: typeof habits.$inferSelect): Habit {
  return {
    id:             row.id,
    userId:         row.userId,
    createdAt:      row.createdAt,
    updatedAt:      row.updatedAt,
    deletedAt:      row.deletedAt ?? null,
    syncStatus:     row.syncStatus,
    name:           row.name,
    icon:           row.icon,
    type:           row.type,
    frequencyType:  row.frequencyType,
    startDate:      row.startDate,
    dailyTarget:    row.dailyTarget ?? null,
    unitLabel:      row.unitLabel ?? null,
    incrementValue: row.incrementValue ?? null,
    isActive:       row.isActive,

    // Meta
    goalType:       (row.goalType ?? 'forever') as GoalType,
    goalTargetDays: row.goalTargetDays ?? null,
    goalEndDate:    row.goalEndDate ?? null,

    // Lembretes
    reminderEnabled:       row.reminderEnabled ?? false,
    reminderMode:          (row.reminderMode ?? null) as ReminderMode | null,
    reminderFixedTime:     row.reminderFixedTime ?? null,
    reminderIntervalHours: row.reminderIntervalHours ?? null,
    reminderIntervalStart: row.reminderIntervalStart ?? null,
    reminderIntervalEnd:   row.reminderIntervalEnd ?? null,
    notificationIds:       parseIds(row.notificationIds),
  };
}

// ─── Mapeamento domínio → insert/update ──────────────────────────────────────

function toInsertRow(
  userId: string,
  data: CreateHabitDTO,
  now: string,
): typeof habits.$inferInsert {
  return {
    id:             generateId(),
    userId,
    createdAt:      now,
    updatedAt:      now,
    deletedAt:      null,
    syncStatus:     'pending',
    name:           data.name,
    icon:           data.icon,
    type:           data.type,
    frequencyType:  data.frequencyType,
    startDate:      data.startDate,
    dailyTarget:    data.dailyTarget ?? null,
    unitLabel:      data.unitLabel ?? null,
    incrementValue: data.incrementValue ?? null,
    isActive:       data.isActive,

    // Meta
    goalType:       data.goalType ?? 'forever',
    goalTargetDays: data.goalTargetDays ?? null,
    goalEndDate:    data.goalEndDate ?? null,

    // Lembretes
    reminderEnabled:       data.reminderEnabled ?? false,
    reminderMode:          data.reminderMode ?? null,
    reminderFixedTime:     data.reminderFixedTime ?? null,
    reminderIntervalHours: data.reminderIntervalHours ?? null,
    reminderIntervalStart: data.reminderIntervalStart ?? null,
    reminderIntervalEnd:   data.reminderIntervalEnd ?? null,
    notificationIds:       serializeIds(data.notificationIds ?? []),
  };
}

// ─── Implementação ────────────────────────────────────────────────────────────

export class SQLiteHabitsRepository implements HabitsRepository {
  async getAll(userId: string): Promise<Habit[]> {
    const rows = await db
      .select()
      .from(habits)
      .where(and(eq(habits.userId, userId), isNull(habits.deletedAt)));
    return rows.map(toHabit);
  }

  async getById(id: string): Promise<Habit | null> {
    const rows = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, id), isNull(habits.deletedAt)));
    return rows[0] ? toHabit(rows[0]) : null;
  }

  async create(userId: string, data: CreateHabitDTO): Promise<Habit> {
    const now = nowISO();
    const row = toInsertRow(userId, data, now);
    await db.insert(habits).values(row);
    return toHabit(row as typeof habits.$inferSelect);
  }

  async update(id: string, data: UpdateHabitDTO): Promise<Habit> {
    const now = nowISO();
    // notificationIds precisa ser serializado se vier no payload
    const payload: Record<string, unknown> = { ...data, updatedAt: now, syncStatus: 'pending' };
    if (Array.isArray(data.notificationIds)) {
      payload['notificationIds'] = serializeIds(data.notificationIds);
    }
    await db.update(habits).set(payload).where(eq(habits.id, id));
    const updated = await this.getById(id);
    if (!updated) throw new Error(`Hábito ${id} não encontrado após update`);
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    await db
      .update(habits)
      .set({ deletedAt: nowISO(), updatedAt: nowISO(), syncStatus: 'pending' })
      .where(eq(habits.id, id));
  }

  async getPendingSync(): Promise<Habit[]> {
    const rows = await db
      .select()
      .from(habits)
      .where(eq(habits.syncStatus, 'pending'));
    return rows.map(toHabit);
  }
}
