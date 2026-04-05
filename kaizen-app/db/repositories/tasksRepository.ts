import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../client';
import { tasks } from '../schema';
import type { Task, CreateTaskDTO, UpdateTaskDTO } from '@/types';
import { generateId } from '@/utils/uuid';
import { nowISO } from '@/utils/dateHelpers';

export interface TasksRepository {
  getAll(userId: string): Promise<Task[]>;
  getByStatus(userId: string, isCompleted: boolean): Promise<Task[]>;
  getById(id: string): Promise<Task | null>;
  create(userId: string, data: CreateTaskDTO): Promise<Task>;
  update(id: string, data: UpdateTaskDTO): Promise<Task>;
  complete(id: string): Promise<Task>;
  uncomplete(id: string): Promise<Task>;
  softDelete(id: string): Promise<void>;
  /** Remove o vínculo de categoria de todas as tarefas que a referenciam. */
  clearCategory(categoryId: string): Promise<void>;
  getPendingSync(): Promise<Task[]>;
}

// ─── Ordem de prioridade para ordenação ──────────────────────────────────────

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

function sortTasks(list: Task[]): Task[] {
  return list.sort((a, b) => {
    const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pDiff !== 0) return pDiff;
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

// ─── Mapeamento row → domínio ─────────────────────────────────────────────────

function toTask(row: typeof tasks.$inferSelect): Task {
  return {
    id:          row.id,
    userId:      row.userId,
    createdAt:   row.createdAt,
    updatedAt:   row.updatedAt,
    deletedAt:   row.deletedAt ?? null,
    syncStatus:  row.syncStatus,
    title:       row.title,
    description: row.description ?? null,
    priority:    row.priority,
    dueDate:     row.dueDate ?? null,
    completedAt: row.completedAt ?? null,
    isCompleted: row.isCompleted,
    categoryId:  row.categoryId ?? null,
  };
}

// ─── Implementação ────────────────────────────────────────────────────────────

export class SQLiteTasksRepository implements TasksRepository {
  async getAll(userId: string): Promise<Task[]> {
    const rows = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), isNull(tasks.deletedAt)));
    return sortTasks(rows.map(toTask));
  }

  async getByStatus(userId: string, isCompleted: boolean): Promise<Task[]> {
    const rows = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.isCompleted, isCompleted),
          isNull(tasks.deletedAt),
        ),
      );
    return sortTasks(rows.map(toTask));
  }

  async getById(id: string): Promise<Task | null> {
    const rows = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), isNull(tasks.deletedAt)));
    return rows[0] ? toTask(rows[0]) : null;
  }

  async create(userId: string, data: CreateTaskDTO): Promise<Task> {
    const now = nowISO();
    const row: typeof tasks.$inferInsert = {
      id:          generateId(),
      userId,
      createdAt:   now,
      updatedAt:   now,
      deletedAt:   null,
      syncStatus:  'pending',
      title:       data.title,
      description: data.description ?? null,
      priority:    data.priority,
      dueDate:     data.dueDate ?? null,
      completedAt: data.completedAt ?? null,
      isCompleted: data.isCompleted,
      categoryId:  data.categoryId ?? null,
    };
    await db.insert(tasks).values(row);
    return toTask(row as typeof tasks.$inferSelect);
  }

  async update(id: string, data: UpdateTaskDTO): Promise<Task> {
    await db
      .update(tasks)
      .set({ ...data, updatedAt: nowISO(), syncStatus: 'pending' })
      .where(eq(tasks.id, id));
    const updated = await this.getById(id);
    if (!updated) throw new Error(`Tarefa ${id} não encontrada após update`);
    return updated;
  }

  async complete(id: string): Promise<Task> {
    const now = nowISO();
    await db
      .update(tasks)
      .set({ isCompleted: true, completedAt: now, updatedAt: now, syncStatus: 'pending' })
      .where(eq(tasks.id, id));
    const updated = await this.getById(id);
    if (!updated) throw new Error(`Tarefa ${id} não encontrada após complete`);
    return updated;
  }

  async uncomplete(id: string): Promise<Task> {
    const now = nowISO();
    await db
      .update(tasks)
      .set({ isCompleted: false, completedAt: null, updatedAt: now, syncStatus: 'pending' })
      .where(eq(tasks.id, id));
    const updated = await this.getById(id);
    if (!updated) throw new Error(`Tarefa ${id} não encontrada após uncomplete`);
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    await db
      .update(tasks)
      .set({ deletedAt: nowISO(), updatedAt: nowISO(), syncStatus: 'pending' })
      .where(eq(tasks.id, id));
  }

  async clearCategory(categoryId: string): Promise<void> {
    await db
      .update(tasks)
      .set({ categoryId: null, updatedAt: nowISO(), syncStatus: 'pending' })
      .where(and(eq(tasks.categoryId, categoryId), isNull(tasks.deletedAt)));
  }

  async getPendingSync(): Promise<Task[]> {
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.syncStatus, 'pending'));
    return rows.map(toTask);
  }
}
