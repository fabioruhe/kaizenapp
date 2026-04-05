import { eq, and, isNull, desc, like } from 'drizzle-orm';
import { db } from '../client';
import { pomodoroSessions } from '../schema';
import type { PomodoroSession, CreatePomodoroSessionDTO } from '@/types';
import { generateId } from '@/utils/uuid';
import { nowISO } from '@/utils/dateHelpers';

function toSession(row: typeof pomodoroSessions.$inferSelect): PomodoroSession {
  return {
    id:                  row.id,
    userId:              row.userId,
    createdAt:           row.createdAt,
    updatedAt:           row.updatedAt,
    deletedAt:           row.deletedAt ?? null,
    syncStatus:          row.syncStatus,
    taskId:              row.taskId ?? null,
    taskTitle:           row.taskTitle,
    startedAt:           row.startedAt,
    endedAt:             row.endedAt ?? null,
    completedCycles:     row.completedCycles ?? 0,
    totalFocusMinutes:   row.totalFocusMinutes ?? 0,
    wasAborted:          row.wasAborted ?? false,
  };
}

export class SQLitePomodoroSessionsRepository {
  async create(userId: string, data: CreatePomodoroSessionDTO): Promise<PomodoroSession> {
    const now = nowISO();
    const row: typeof pomodoroSessions.$inferInsert = {
      id:                generateId(),
      userId,
      createdAt:         now,
      updatedAt:         now,
      deletedAt:         null,
      syncStatus:        'pending',
      taskId:            data.taskId ?? null,
      taskTitle:         data.taskTitle,
      startedAt:         data.startedAt,
      endedAt:           data.endedAt ?? null,
      completedCycles:   data.completedCycles,
      totalFocusMinutes: data.totalFocusMinutes,
      wasAborted:        data.wasAborted,
    };
    await db.insert(pomodoroSessions).values(row);
    return toSession(row as typeof pomodoroSessions.$inferSelect);
  }

  async getToday(userId: string, dateStr: string): Promise<{ count: number; focusMinutes: number }> {
    const rows = await db
      .select()
      .from(pomodoroSessions)
      .where(and(
        eq(pomodoroSessions.userId, userId),
        isNull(pomodoroSessions.deletedAt),
        like(pomodoroSessions.startedAt, `${dateStr}%`),
      ));
    return {
      count:        rows.length,
      focusMinutes: rows.reduce((acc, r) => acc + (r.totalFocusMinutes ?? 0), 0),
    };
  }

  async getRecent(userId: string, limit = 20): Promise<PomodoroSession[]> {
    const rows = await db
      .select()
      .from(pomodoroSessions)
      .where(and(eq(pomodoroSessions.userId, userId), isNull(pomodoroSessions.deletedAt)))
      .orderBy(desc(pomodoroSessions.startedAt))
      .limit(limit);
    return rows.map(toSession);
  }
}
