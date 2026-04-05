// ─── Enums ────────────────────────────────────────────────────────────────────

export type SyncStatus        = 'pending' | 'synced' | 'conflict';
export type HabitType         = 'build' | 'quit';
export type FrequencyType     = 'once_daily' | 'multiple_daily';
export type Priority          = 'high' | 'medium' | 'low';
export type GoalType          = 'days' | 'date_range' | 'forever';
export type ReminderMode      = 'fixed_time' | 'interval' | 'both';
export type PomodoroPhase     = 'idle' | 'focus' | 'short_break' | 'long_break' | 'done';

// ─── SyncMetadata ─────────────────────────────────────────────────────────────

export interface SyncMetadata {
  id: string;
  userId: string;
  createdAt: string;          // ISO 8601
  updatedAt: string;          // ISO 8601 — atualizado em todo UPDATE
  deletedAt: string | null;   // null = ativo | ISO 8601 = soft deleted
  syncStatus: SyncStatus;
}

// ─── HabitTemplate (tabela pública — sem userId, sem RLS) ─────────────────────

export interface HabitTemplate {
  id: string;
  name: string;
  icon: string;
  type: HabitType;
  frequencyType: FrequencyType;
  defaultDailyTarget: number | null;
  defaultUnitLabel: string | null;
  defaultIncrementValue: number | null;
  category: string;
  isActive: boolean;
  createdAt: string;
}

// ─── HabitGoal ────────────────────────────────────────────────────────────────
// Representa o objetivo de duração configurado pelo usuário para um hábito.
// Os campos opcionais são mutuamente exclusivos conforme o GoalType.

export interface HabitGoal {
  type: GoalType;
  targetDays?: number;   // usado quando type === 'days'
  endDate?: string;      // YYYY-MM-DD — usado quando type === 'date_range'
}

// ─── HabitReminder ────────────────────────────────────────────────────────────

export interface HabitReminder {
  enabled: boolean;
  mode?: ReminderMode;
  fixedTime?: string;          // "HH:MM" — usado em 'fixed_time' e 'both'
  intervalHours?: number;      // horas — usado em 'interval' e 'both' (só multiple_daily)
  intervalStartTime?: string;  // "HH:MM"
  intervalEndTime?: string;    // "HH:MM"
}

// ─── Habit ────────────────────────────────────────────────────────────────────

export interface Habit extends SyncMetadata {
  name: string;
  icon: string;
  type: HabitType;
  frequencyType: FrequencyType;   // quit é sempre once_daily
  startDate: string;              // YYYY-MM-DD
  dailyTarget: number | null;     // apenas multiple_daily
  unitLabel: string | null;       // apenas multiple_daily
  incrementValue: number | null;  // apenas multiple_daily
  isActive: boolean;

  // Meta de duração
  goalType: GoalType;
  goalTargetDays: number | null;  // apenas goalType === 'days'
  goalEndDate: string | null;     // YYYY-MM-DD — apenas goalType === 'date_range'

  // Lembretes
  reminderEnabled: boolean;
  reminderMode: ReminderMode | null;
  reminderFixedTime: string | null;       // "HH:MM"
  reminderIntervalHours: number | null;
  reminderIntervalStart: string | null;   // "HH:MM"
  reminderIntervalEnd: string | null;     // "HH:MM"
  notificationIds: string[];              // IDs do expo-notifications (array em memória)
}

// ─── HabitLog ─────────────────────────────────────────────────────────────────

export interface HabitLog extends SyncMetadata {
  habitId: string;
  date: string;               // YYYY-MM-DD
  progress: number;           // once_daily: 0|1 — multiple_daily: acumulado
  completedAt: string | null; // ISO 8601 quando atingiu meta
}

// ─── TaskCategory ─────────────────────────────────────────────────────────────

export interface TaskCategory extends SyncMetadata {
  name: string;
  color: string;        // hex — ex: '#ef4444'
  icon: string | null;  // MaterialCommunityIcons opcional
  order: number;        // para reordenação futura
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task extends SyncMetadata {
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: string | null;     // YYYY-MM-DD
  completedAt: string | null; // ISO 8601
  isCompleted: boolean;
  categoryId: string | null;
}

// ─── SubTask ──────────────────────────────────────────────────────────────────

export interface SubTask extends SyncMetadata {
  taskId: string;
  title: string;
  isCompleted: boolean;
  completedAt: string | null;
  order: number;
}

// ─── PomodoroSession ──────────────────────────────────────────────────────────

export interface PomodoroSession extends SyncMetadata {
  taskId: string | null;
  taskTitle: string;
  startedAt: string;
  endedAt: string | null;
  completedCycles: number;
  totalFocusMinutes: number;
  wasAborted: boolean;
}

// ─── PomodoroSettings ────────────────────────────────────────────────────────

export interface PomodoroSettings {
  focusMinutes: number;            // default: 25
  shortBreakMinutes: number;       // default: 5
  longBreakMinutes: number;        // default: 15
  cyclesBeforeLongBreak: number;   // default: 4
}

// ─── PomodoroQuickTask ────────────────────────────────────────────────────────
// Tarefa efêmera do Pomodoro — nunca persiste na tabela tasks.

export interface PomodoroQuickTask {
  id: string;
  title: string;
  subTasks: { id: string; title: string; isCompleted: boolean }[];
}

// ─── DailySummary ─────────────────────────────────────────────────────────────

export interface DailySummary {
  habitsTotal: number;
  habitsCompleted: number;
  tasksTotal: number;
  tasksCompletedToday: number;
  pomodorosToday: number;
  focusMinutesToday: number;
}

// ─── UserPreferences ──────────────────────────────────────────────────────────

export interface UserPreferences {
  soundEnabled: boolean;
  pomodoroSoundEnabled: boolean;
  appearanceMode: 'light' | 'dark' | 'system';
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export type CreateHabitDTO = Omit<Habit,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncStatus'
>;

export type UpdateHabitDTO = Partial<Omit<Habit,
  'id' | 'userId' | 'createdAt' | 'deletedAt' | 'syncStatus'
>>;

export type CreateHabitLogDTO = Omit<HabitLog,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncStatus'
>;

export type UpdateHabitLogDTO = Pick<HabitLog, 'progress' | 'completedAt'>;

export type CreateTaskCategoryDTO = Omit<TaskCategory,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncStatus'
>;

export type UpdateTaskCategoryDTO = Partial<Omit<TaskCategory,
  'id' | 'userId' | 'createdAt' | 'deletedAt' | 'syncStatus'
>>;

export type CreateTaskDTO = Omit<Task,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncStatus'
>;

export type UpdateTaskDTO = Partial<Omit<Task,
  'id' | 'userId' | 'createdAt' | 'deletedAt' | 'syncStatus'
>>;

export type CreateSubTaskDTO = Omit<SubTask,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncStatus'
>;

export type UpdateSubTaskDTO = Partial<Omit<SubTask,
  'id' | 'userId' | 'taskId' | 'createdAt' | 'deletedAt' | 'syncStatus'
>>;

export type CreatePomodoroSessionDTO = Omit<PomodoroSession,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncStatus'
>;
