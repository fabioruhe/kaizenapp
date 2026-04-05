import { eq, and, isNull, isNotNull, gte, lte } from 'drizzle-orm';
import { db } from '../client';
import { habitLogs } from '../schema';
import type { HabitLog, CreateHabitLogDTO, UpdateHabitLogDTO } from '@/types';
import { generateId } from '@/utils/uuid';
import { nowISO } from '@/utils/dateHelpers';

export interface HabitLogsRepository {
  getByHabitAndDate(userId: string, habitId: string, date: string): Promise<HabitLog | null>;
  getByHabitInRange(userId: string, habitId: string, fromDate: string, toDate: string): Promise<HabitLog[]>;
  getCompletedDates(userId: string, habitId: string): Promise<string[]>;
  create(userId: string, data: CreateHabitLogDTO): Promise<HabitLog>;
  update(id: string, data: UpdateHabitLogDTO): Promise<HabitLog>;
  softDelete(id: string): Promise<void>;
  getPendingSync(): Promise<HabitLog[]>;
}

// ─── Mapeamento row → domínio ─────────────────────────────────────────────────

function toHabitLog(row: typeof habitLogs.$inferSelect): HabitLog {
  return {
    id:          row.id,
    userId:      row.userId,
    createdAt:   row.createdAt,
    updatedAt:   row.updatedAt,
    deletedAt:   row.deletedAt ?? null,
    syncStatus:  row.syncStatus,
    habitId:     row.habitId,
    date:        row.date,
    progress:    row.progress,
    completedAt: row.completedAt ?? null,
  };
}

// ─── Implementação ────────────────────────────────────────────────────────────

export class SQLiteHabitLogsRepository implements HabitLogsRepository {
  async getByHabitAndDate(userId: string, habitId: string, date: string): Promise<HabitLog | null> {
    const rows = await db
      .select()
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.userId, userId),
          eq(habitLogs.habitId, habitId),
          eq(habitLogs.date, date),
          isNull(habitLogs.deletedAt),
        ),
      );
    return rows[0] ? toHabitLog(rows[0]) : null;
  }

  async getByHabitInRange(
    userId: string,
    habitId: string,
    fromDate: string,
    toDate: string,
  ): Promise<HabitLog[]> {
    const rows = await db
      .select()
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.userId, userId),
          eq(habitLogs.habitId, habitId),
          gte(habitLogs.date, fromDate),
          lte(habitLogs.date, toDate),
          isNull(habitLogs.deletedAt),
        ),
      );
    return rows.map(toHabitLog);
  }

  async getCompletedDates(userId: string, habitId: string): Promise<string[]> {
    const rows = await db
      .select({ date: habitLogs.date })
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.userId, userId),
          eq(habitLogs.habitId, habitId),
          isNotNull(habitLogs.completedAt),
          isNull(habitLogs.deletedAt),
        ),
      );
    return rows.map((r) => r.date);
  }

  async create(userId: string, data: CreateHabitLogDTO): Promise<HabitLog> {
    const now = nowISO();
    const row: typeof habitLogs.$inferInsert = {
      id:          generateId(),
      userId,
      createdAt:   now,
      updatedAt:   now,
      deletedAt:   null,
      syncStatus:  'pending',
      habitId:     data.habitId,
      date:        data.date,
      progress:    data.progress,
      completedAt: data.completedAt ?? null,
    };
    await db.insert(habitLogs).values(row);
    return toHabitLog(row as typeof habitLogs.$inferSelect);
  }

  async update(id: string, data: UpdateHabitLogDTO): Promise<HabitLog> {
    const now = nowISO();
    await db
      .update(habitLogs)
      .set({ ...data, updatedAt: now, syncStatus: 'pending' })
      .where(eq(habitLogs.id, id));
    const rows = await db
      .select()
      .from(habitLogs)
      .where(eq(habitLogs.id, id));
    if (!rows[0]) throw new Error(`HabitLog ${id} não encontrado após update`);
    return toHabitLog(rows[0]);
  }

  async softDelete(id: string): Promise<void> {
    await db
      .update(habitLogs)
      .set({ deletedAt: nowISO(), updatedAt: nowISO(), syncStatus: 'pending' })
      .where(eq(habitLogs.id, id));
  }

  async getPendingSync(): Promise<HabitLog[]> {
    const rows = await db
      .select()
      .from(habitLogs)
      .where(eq(habitLogs.syncStatus, 'pending'));
    return rows.map(toHabitLog);
  }
}
