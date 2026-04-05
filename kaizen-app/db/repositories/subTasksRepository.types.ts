import type { SubTask, CreateSubTaskDTO, UpdateSubTaskDTO } from '@/types';

export interface SubTasksRepository {
  /** Retorna todas as subtarefas ativas de uma tarefa, ordenadas por `order`. */
  getAllByTask(taskId: string): Promise<SubTask[]>;

  create(userId: string, data: CreateSubTaskDTO): Promise<SubTask>;

  update(id: string, data: UpdateSubTaskDTO): Promise<SubTask>;

  /** Soft-delete de uma subtarefa. */
  softDelete(id: string): Promise<void>;

  /** Conta subtarefas ativas (total e concluídas) de uma tarefa. */
  countByTask(taskId: string): Promise<{ total: number; completed: number }>;
}
