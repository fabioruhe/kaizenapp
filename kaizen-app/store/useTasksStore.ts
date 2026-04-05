import { create } from 'zustand';
import { SQLiteTasksRepository } from '@/db/repositories/tasksRepository';
import { SQLiteSubTasksRepository } from '@/db/repositories/subTasksRepository';
import { playCompletionSound } from '@/utils/soundPlayer';
import { nowISO } from '@/utils/dateHelpers';
import type { Task, SubTask, CreateTaskDTO, UpdateTaskDTO, Priority } from '@/types';

const repo    = new SQLiteTasksRepository();
const subRepo = new SQLiteSubTasksRepository();

type FilterType = 'all' | 'pending' | 'completed';

interface TasksState {
  tasks: Task[];
  /** Subtarefas por taskId — carregadas sob demanda ao expandir o card. */
  subTasks: Record<string, SubTask[]>;
  filter: FilterType;
  searchQuery: string;
  filterPriority: Priority | null;
  filterCategoryId: string | null;
  isLoading: boolean;
  error: string | null;

  load(userId: string): Promise<void>;
  setFilter(filter: FilterType): void;
  setSearchQuery(q: string): void;
  setFilterPriority(p: Priority | null): void;
  setFilterCategoryId(id: string | null): void;
  createTask(userId: string, data: CreateTaskDTO): Promise<Task>;
  updateTask(id: string, data: UpdateTaskDTO): Promise<void>;
  completeTask(id: string): Promise<void>;
  uncompleteTask(id: string): Promise<void>;
  deleteTask(id: string): Promise<void>;

  /** Carrega (ou recarrega) as subtarefas de uma tarefa específica. Retorna as subs carregadas. */
  loadSubTasks(taskId: string): Promise<SubTask[]>;
  /** Adiciona uma subtarefa à tarefa pai. */
  addSubTask(userId: string, taskId: string, title: string): Promise<SubTask>;
  /** Conclui uma subtarefa; se for a última, conclui a tarefa pai automaticamente. */
  completeSubTask(subTaskId: string, taskId: string): Promise<void>;
  /** Reabre uma subtarefa concluída. */
  uncompleteSubTask(subTaskId: string, taskId: string): Promise<void>;
  /**
   * Remove uma subtarefa (soft delete).
   * Se não restar nenhuma subtarefa ativa, a tarefa pai volta a poder ser
   * concluída manualmente (o bloqueio é calculado na UI pelo comprimento do array).
   */
  deleteSubTask(subTaskId: string, taskId: string): Promise<void>;

  /** Tarefas já filtradas pelo filter ativo. */
  getFiltered(): Task[];
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  subTasks: {},
  filter: 'all',
  searchQuery: '',
  filterPriority: null,
  filterCategoryId: null,
  isLoading: false,
  error: null,

  async load(userId: string) {
    set({ isLoading: true, error: null });
    try {
      const tasks = await repo.getAll(userId);
      set({ tasks, isLoading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao carregar tarefas';
      set({ isLoading: false, error: message });
    }
  },

  setFilter(filter: FilterType) {
    set({ filter });
  },

  setSearchQuery(q: string) { set({ searchQuery: q }); },
  setFilterPriority(p: Priority | null) { set({ filterPriority: p }); },
  setFilterCategoryId(id: string | null) { set({ filterCategoryId: id }); },

  async createTask(userId: string, data: CreateTaskDTO) {
    const task = await repo.create(userId, data);
    set((s) => ({ tasks: [task, ...s.tasks] }));
    return task;
  },

  async updateTask(id: string, data: UpdateTaskDTO) {
    const updated = await repo.update(id, data);
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }));
  },

  async completeTask(id: string) {
    const updated = await repo.complete(id);
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }));
    playCompletionSound();
  },

  async uncompleteTask(id: string) {
    const updated = await repo.uncomplete(id);
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }));
  },

  async deleteTask(id: string) {
    await repo.softDelete(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  // ── Subtarefas ───────────────────────────────────────────────────────────────

  async loadSubTasks(taskId: string) {
    const subs = await subRepo.getAllByTask(taskId);
    set((s) => ({ subTasks: { ...s.subTasks, [taskId]: subs } }));
    return subs;
  },

  async addSubTask(userId: string, taskId: string, title: string) {
    const currentSubs = get().subTasks[taskId] ?? [];
    const sub = await subRepo.create(userId, {
      taskId,
      title,
      isCompleted: false,
      completedAt: null,
      order: currentSubs.length,
    });
    set((s) => ({ subTasks: { ...s.subTasks, [taskId]: [...currentSubs, sub] } }));
    return sub;
  },

  async completeSubTask(subTaskId: string, taskId: string) {
    const updated = await subRepo.update(subTaskId, {
      isCompleted: true,
      completedAt: nowISO(),
    });
    const currentSubs = get().subTasks[taskId] ?? [];
    const newSubs = currentSubs.map((st) => (st.id === subTaskId ? updated : st));
    set((s) => ({ subTasks: { ...s.subTasks, [taskId]: newSubs } }));

    // Auto-conclui a tarefa pai quando todas as subtarefas estiverem feitas
    const allDone = newSubs.length > 0 && newSubs.every((st) => st.isCompleted);
    if (allDone) {
      const completedTask = await repo.complete(taskId);
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === taskId ? completedTask : t)) }));
      playCompletionSound();
    }
  },

  async uncompleteSubTask(subTaskId: string, taskId: string) {
    const updated = await subRepo.update(subTaskId, { isCompleted: false, completedAt: null });
    set((s) => ({
      subTasks: {
        ...s.subTasks,
        [taskId]: (s.subTasks[taskId] ?? []).map((st) => (st.id === subTaskId ? updated : st)),
      },
    }));
  },

  async deleteSubTask(subTaskId: string, taskId: string) {
    await subRepo.softDelete(subTaskId);
    set((s) => ({
      subTasks: {
        ...s.subTasks,
        [taskId]: (s.subTasks[taskId] ?? []).filter((st) => st.id !== subTaskId),
      },
    }));
  },

  getFiltered() {
    const { tasks, filter, searchQuery, filterPriority, filterCategoryId } = get();
    let result = tasks;
    if (filter === 'pending')   result = result.filter((t) => !t.isCompleted);
    if (filter === 'completed') result = result.filter((t) => t.isCompleted);
    if (searchQuery.trim())     result = result.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterPriority)         result = result.filter((t) => t.priority === filterPriority);
    if (filterCategoryId)       result = result.filter((t) => t.categoryId === filterCategoryId);
    return result;
  },
}));
