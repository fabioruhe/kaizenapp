import { eq, and, isNull, asc } from 'drizzle-orm';
import { db } from '../client';
import { subTasks } from '../schema';
import type { SubTasksRepository } from './subTasksRepository.types';

export type { SubTasksRepository } from './subTasksRepository.types';
import type { SubTask, CreateSubTaskDTO, UpdateSubTaskDTO } from '@/types';
import { generateId } from '@/utils/uuid';
import { nowISO } from '@/utils/dateHelpers';

// ─── Mapeamento row → domínio ─────────────────────────────────────────────────

function toSubTask(row: typeof subTasks.$inferSelect): SubTask {
  return {
    id:          row.id,
    userId:      row.userId,
    taskId:      row.taskId,
    createdAt:   row.createdAt,
    updatedAt:   row.updatedAt,
    deletedAt:   row.deletedAt ?? null,
    syncStatus:  row.syncStatus,
    title:       row.title,
    isCompleted: row.isCompleted ?? false,
    completedAt: row.completedAt ?? null,
    order:       row.order ?? 0,
  };
}

// ─── Implementação ────────────────────────────────────────────────────────────

export class SQLiteSubTasksRepository implements SubTasksRepository {
  async getAllByTask(taskId: string): Promise<SubTask[]> {
    const rows = await db
      .select()
      .from(subTasks)
      .where(and(eq(subTasks.taskId, taskId), isNull(subTasks.deletedAt)))
      .orderBy(asc(subTasks.order), asc(subTasks.createdAt));
    return rows.map(toSubTask);
  }

  async create(userId: string, data: CreateSubTaskDTO): Promise<SubTask> {
    const now = nowISO();
    const row: typeof subTasks.$inferInsert = {
      id:          generateId(),
      userId,
      taskId:      data.taskId,
      createdAt:   now,
      updatedAt:   now,
      deletedAt:   null,
      syncStatus:  'pending',
      title:       data.title,
      isCompleted: false,
      completedAt: null,
      order:       data.order ?? 0,
    };
    await db.insert(subTasks).values(row);
    return toSubTask(row as typeof subTasks.$inferSelect);
  }

  async update(id: string, data: UpdateSubTaskDTO): Promise<SubTask> {
    const now = nowISO();
    await db
      .update(subTasks)
      .set({ ...data, updatedAt: now, syncStatus: 'pending' })
      .where(eq(subTasks.id, id));
    const rows = await db.select().from(subTasks).where(eq(subTasks.id, id));
    if (!rows[0]) throw new Error(`SubTask ${id} não encontrada após update`);
    return toSubTask(rows[0]);
  }

  async softDelete(id: string): Promise<void> {
    await db
      .update(subTasks)
      .set({ deletedAt: nowISO(), updatedAt: nowISO(), syncStatus: 'pending' })
      .where(eq(subTasks.id, id));
  }

  async countByTask(taskId: string): Promise<{ total: number; completed: number }> {
    const rows = await db
      .select()
      .from(subTasks)
      .where(and(eq(subTasks.taskId, taskId), isNull(subTasks.deletedAt)));
    const total     = rows.length;
    const completed = rows.filter((r) => r.isCompleted).length;
    return { total, completed };
  }
}
