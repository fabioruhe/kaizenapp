import { create } from 'zustand';
import { SQLiteTaskCategoriesRepository } from '@/db/repositories/taskCategoriesRepository';
import { SQLiteTasksRepository } from '@/db/repositories/tasksRepository';
import type { TaskCategory, CreateTaskCategoryDTO, UpdateTaskCategoryDTO } from '@/types';

const categoriesRepo = new SQLiteTaskCategoriesRepository();
const tasksRepo      = new SQLiteTasksRepository();

interface TaskCategoriesState {
  categories: TaskCategory[];
  isLoading: boolean;

  load(userId: string): Promise<void>;
  createCategory(userId: string, data: CreateTaskCategoryDTO): Promise<TaskCategory>;
  updateCategory(id: string, data: UpdateTaskCategoryDTO): Promise<void>;
  /** Soft-deleta categoria e zera categoryId nas tarefas vinculadas. */
  deleteCategory(id: string): Promise<void>;
  /** Move categoria uma posição para cima ou para baixo e persiste o novo order. */
  moveCategory(id: string, direction: 'up' | 'down'): Promise<void>;
}

export const useTaskCategoriesStore = create<TaskCategoriesState>((set, get) => ({
  categories: [],
  isLoading: false,

  async load(userId: string) {
    set({ isLoading: true });
    try {
      const categories = await categoriesRepo.getAll(userId);
      set({ categories, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  async createCategory(userId: string, data: CreateTaskCategoryDTO) {
    const category = await categoriesRepo.create(userId, data);
    set((s) => ({ categories: [...s.categories, category] }));
    return category;
  },

  async updateCategory(id: string, data: UpdateTaskCategoryDTO) {
    const updated = await categoriesRepo.update(id, data);
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? updated : c)) }));
  },

  async deleteCategory(id: string) {
    // Etapa 15: zera categoryId nas tarefas antes de deletar — tarefas nunca somem
    await tasksRepo.clearCategory(id);
    await categoriesRepo.softDelete(id);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },

  async moveCategory(id: string, direction: 'up' | 'down') {
    const { categories } = get();
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return;
    if (direction === 'up'   && idx === 0)                   return;
    if (direction === 'down' && idx === categories.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const next = [...categories];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];

    // Update order field to match new position
    next[idx].order    = idx;
    next[swapIdx].order = swapIdx;
    set({ categories: next });

    await Promise.all([
      categoriesRepo.update(next[idx].id,    { order: idx    }),
      categoriesRepo.update(next[swapIdx].id, { order: swapIdx }),
    ]);
  },
}));
