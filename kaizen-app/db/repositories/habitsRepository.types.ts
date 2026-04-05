import type { Habit, CreateHabitDTO, UpdateHabitDTO } from '@/types';

export interface HabitsRepository {
  getAll(userId: string): Promise<Habit[]>;
  getById(id: string): Promise<Habit | null>;
  create(userId: string, data: CreateHabitDTO): Promise<Habit>;
  update(id: string, data: UpdateHabitDTO): Promise<Habit>;
  softDelete(id: string): Promise<void>;
  getPendingSync(): Promise<Habit[]>;
}
