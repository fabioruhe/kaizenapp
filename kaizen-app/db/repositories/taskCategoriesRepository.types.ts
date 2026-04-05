import type { TaskCategory, CreateTaskCategoryDTO, UpdateTaskCategoryDTO } from '@/types';

export interface TaskCategoriesRepository {
  /** Retorna todas as categorias ativas do usuário, ordenadas por `order`. */
  getAll(userId: string): Promise<TaskCategory[]>;

  getById(id: string): Promise<TaskCategory | null>;

  create(userId: string, data: CreateTaskCategoryDTO): Promise<TaskCategory>;

  update(id: string, data: UpdateTaskCategoryDTO): Promise<TaskCategory>;

  /**
   * Soft-delete da categoria.
   * As tarefas vinculadas devem ter categoryId zerado pelo caller (store).
   */
  softDelete(id: string): Promise<void>;

  getPendingSync(): Promise<TaskCategory[]>;
}
