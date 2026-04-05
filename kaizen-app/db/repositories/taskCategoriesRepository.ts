import { eq, and, isNull, asc } from 'drizzle-orm';
import { db } from '../client';
import { taskCategories } from '../schema';
import type { TaskCategoriesRepository } from './taskCategoriesRepository.types';

export type { TaskCategoriesRepository } from './taskCategoriesRepository.types';
import type { TaskCategory, CreateTaskCategoryDTO, UpdateTaskCategoryDTO } from '@/types';
import { generateId } from '@/utils/uuid';
import { nowISO } from '@/utils/dateHelpers';

// ─── Mapeamento row → domínio ─────────────────────────────────────────────────

function toCategory(row: typeof taskCategories.$inferSelect): TaskCategory {
  return {
    id:         row.id,
    userId:     row.userId,
    createdAt:  row.createdAt,
    updatedAt:  row.updatedAt,
    deletedAt:  row.deletedAt ?? null,
    syncStatus: row.syncStatus,
    name:       row.name,
    color:      row.color,
    icon:       row.icon ?? null,
    order:      row.order,
  };
}

// ─── Implementação ────────────────────────────────────────────────────────────

export class SQLiteTaskCategoriesRepository implements TaskCategoriesRepository {
  async getAll(userId: string): Promise<TaskCategory[]> {
    const rows = await db
      .select()
      .from(taskCategories)
      .where(and(eq(taskCategories.userId, userId), isNull(taskCategories.deletedAt)))
      .orderBy(asc(taskCategories.order), asc(taskCategories.createdAt));
    return rows.map(toCategory);
  }

  async getById(id: string): Promise<TaskCategory | null> {
    const rows = await db
      .select()
      .from(taskCategories)
      .where(and(eq(taskCategories.id, id), isNull(taskCategories.deletedAt)));
    return rows[0] ? toCategory(rows[0]) : null;
  }

  async create(userId: string, data: CreateTaskCategoryDTO): Promise<TaskCategory> {
    const now = nowISO();
    const row: typeof taskCategories.$inferInsert = {
      id:         generateId(),
      userId,
      createdAt:  now,
      updatedAt:  now,
      deletedAt:  null,
      syncStatus: 'pending',
      name:       data.name,
      color:      data.color,
      icon:       data.icon ?? null,
      order:      data.order ?? 0,
    };
    await db.insert(taskCategories).values(row);
    return toCategory(row as typeof taskCategories.$inferSelect);
  }

  async update(id: string, data: UpdateTaskCategoryDTO): Promise<TaskCategory> {
    await db
      .update(taskCategories)
      .set({ ...data, updatedAt: nowISO(), syncStatus: 'pending' })
      .where(eq(taskCategories.id, id));
    const updated = await this.getById(id);
    if (!updated) throw new Error(`Categoria ${id} não encontrada após update`);
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    await db
      .update(taskCategories)
      .set({ deletedAt: nowISO(), updatedAt: nowISO(), syncStatus: 'pending' })
      .where(eq(taskCategories.id, id));
  }

  async getPendingSync(): Promise<TaskCategory[]> {
    const rows = await db
      .select()
      .from(taskCategories)
      .where(eq(taskCategories.syncStatus, 'pending'));
    return rows.map(toCategory);
  }
}
