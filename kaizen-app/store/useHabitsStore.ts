import { create } from 'zustand';
import { SQLiteHabitsRepository } from '@/db/repositories/habitsRepository';
import { SQLiteHabitLogsRepository } from '@/db/repositories/habitLogsRepository';
import type { Habit, HabitLog, CreateHabitDTO, UpdateHabitDTO } from '@/types';
import { todayString } from '@/utils/dateHelpers';
import { calculateStreak } from '@/utils/streakCalculator';
import { shiftDays } from '@/utils/dateHelpers';
import type { StreakResult } from '@/utils/streakCalculator';
import { scheduleHabitNotifications, cancelHabitNotifications } from '@/utils/notificationScheduler';
import { playHabitSound } from '@/utils/soundPlayer';

// ─── Repositórios (singleton) ─────────────────────────────────────────────────

const habitsRepo = new SQLiteHabitsRepository();
const logsRepo = new SQLiteHabitLogsRepository();

// ─── Tipos do store ───────────────────────────────────────────────────────────

/** Log de hoje para um hábito, se existir. */
type TodayLogMap = Record<string, HabitLog | null>;

/** Cache de streaks por habitId. */
type StreakMap = Record<string, StreakResult>;

/** Datas completadas recentes por habitId (últimos N dias). */
type RecentLogsMap = Record<string, string[]>;

interface HabitsState {
  habits: Habit[];
  todayLogs: TodayLogMap;
  streaks: StreakMap;
  recentLogs: RecentLogsMap;
  isLoading: boolean;
  error: string | null;

  /** Carrega todos os hábitos ativos + logs de hoje + streaks. */
  load(userId: string): Promise<void>;

  /** Cria um hábito e atualiza o estado local. */
  createHabit(userId: string, data: CreateHabitDTO): Promise<Habit>;

  /** Atualiza um hábito e atualiza o estado local. */
  updateHabit(id: string, data: UpdateHabitDTO): Promise<void>;

  /** Soft delete de um hábito. */
  deleteHabit(id: string): Promise<void>;

  /**
   * Registra progresso em um hábito para hoje.
   * - once_daily (build): cria/atualiza log com progress=1 e completedAt=now
   * - multiple_daily: incrementa progress; completa automaticamente ao atingir dailyTarget
   * - once_daily (quit): mesmo comportamento de once_daily build
   */
  logProgress(habitId: string, userId: string): Promise<void>;

  /**
   * Desfaz o check de hoje de um hábito once_daily.
   * Soft-deleta o log existente.
   */
  undoLog(habitId: string): Promise<void>;

  /** Recarrega o streak de um hábito específico. */
  refreshStreak(habitId: string): Promise<void>;

  /** Carrega (ou recarrega) as datas completadas dos últimos `days` dias para um hábito. */
  loadRecentLogs(habitId: string, userId: string, days?: number): Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadStreakForHabit(habit: Habit): Promise<StreakResult> {
  const completedDates = await logsRepo.getCompletedDates(habit.userId, habit.id);
  return calculateStreak(completedDates, habit.type, habit.startDate);
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  todayLogs: {},
  streaks: {},
  recentLogs: {},
  isLoading: false,
  error: null,

  async load(userId: string) {
    set({ isLoading: true, error: null });
    try {
      const today = todayString();
      const habits = await habitsRepo.getAll(userId);

      // Carrega log de hoje e streak para cada hábito em paralelo
      const [todayLogsArr, streakResults] = await Promise.all([
        Promise.all(habits.map((h) => logsRepo.getByHabitAndDate(h.userId, h.id, today))),
        Promise.all(habits.map((h) => loadStreakForHabit(h))),
      ]);

      const todayLogs: TodayLogMap = {};
      const streaks: StreakMap = {};
      habits.forEach((h, i) => {
        todayLogs[h.id] = todayLogsArr[i];
        streaks[h.id] = streakResults[i];
      });

      set({ habits, todayLogs, streaks, isLoading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao carregar hábitos';
      set({ isLoading: false, error: message });
    }
  },

  async createHabit(userId: string, data: CreateHabitDTO) {
    const habit = await habitsRepo.create(userId, data);
    // Agenda notificações e persiste os IDs gerados
    const notificationIds = await scheduleHabitNotifications(habit);
    const finalHabit = notificationIds.length > 0
      ? await habitsRepo.update(habit.id, { notificationIds })
      : habit;
    const streak = await loadStreakForHabit(finalHabit);
    set((s) => ({
      habits: [...s.habits, finalHabit],
      todayLogs: { ...s.todayLogs, [finalHabit.id]: null },
      streaks: { ...s.streaks, [finalHabit.id]: streak },
    }));
    return finalHabit;
  },

  async updateHabit(id: string, data: UpdateHabitDTO) {
    const updated = await habitsRepo.update(id, data);

    // Se algum campo de lembrete ou nome foi alterado, reagenda notificações
    const reminderFields: (keyof UpdateHabitDTO)[] = [
      'name', 'reminderEnabled', 'reminderMode', 'reminderFixedTime',
      'reminderIntervalHours', 'reminderIntervalStart', 'reminderIntervalEnd',
    ];
    if (reminderFields.some((f) => f in data)) {
      // scheduleHabitNotifications já cancela os IDs antigos internamente
      const newIds = await scheduleHabitNotifications(updated);
      await habitsRepo.update(id, { notificationIds: newIds });
      updated.notificationIds = newIds;
    }

    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? updated : h)),
    }));
  },

  async deleteHabit(id: string) {
    const habit = get().habits.find((h) => h.id === id);
    if (habit) await cancelHabitNotifications(habit.notificationIds);
    await habitsRepo.softDelete(id);
    set((s) => ({
      habits: s.habits.filter((h) => h.id !== id),
      todayLogs: Object.fromEntries(
        Object.entries(s.todayLogs).filter(([k]) => k !== id),
      ),
      streaks: Object.fromEntries(
        Object.entries(s.streaks).filter(([k]) => k !== id),
      ),
    }));
  },

  async logProgress(habitId: string, userId: string) {
    const today = todayString();
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;

    const existing = get().todayLogs[habitId];

    if (habit.frequencyType === 'once_daily') {
      // Idempotente: só cria/atualiza se ainda não completou
      if (existing?.completedAt) return;

      const now = new Date().toISOString();
      let log: HabitLog;
      if (existing) {
        log = await logsRepo.update(existing.id, { progress: 1, completedAt: now });
      } else {
        log = await logsRepo.create(userId, {
          habitId, date: today, progress: 1, completedAt: now,
        });
      }
      // Cancela a notificação do dia ao completar (não cancela a série toda)
      await cancelHabitNotifications(habit.notificationIds);
      set((s) => ({ todayLogs: { ...s.todayLogs, [habitId]: log } }));
      playHabitSound();

    } else {
      // multiple_daily: incrementa
      const increment = habit.incrementValue ?? 1;
      const target = habit.dailyTarget ?? 1;
      let justCompleted = false;

      if (existing) {
        const newProgress = existing.progress + increment;
        const completedAt = newProgress >= target ? new Date().toISOString() : existing.completedAt;
        justCompleted = !existing.completedAt && newProgress >= target;
        const log = await logsRepo.update(existing.id, {
          progress: newProgress,
          completedAt: completedAt ?? null,
        });
        set((s) => ({ todayLogs: { ...s.todayLogs, [habitId]: log } }));
      } else {
        const newProgress = increment;
        const completedAt = newProgress >= target ? new Date().toISOString() : null;
        justCompleted = newProgress >= target;
        const log = await logsRepo.create(userId, {
          habitId, date: today, progress: newProgress, completedAt,
        });
        set((s) => ({ todayLogs: { ...s.todayLogs, [habitId]: log } }));
      }

      // Cancela notificações apenas no momento em que a meta é atingida
      if (justCompleted) {
        await cancelHabitNotifications(habit.notificationIds);
        playHabitSound();
      }
    }

    // Atualiza streak após registrar progresso
    await get().refreshStreak(habitId);
  },

  async undoLog(habitId: string) {
    const existing = get().todayLogs[habitId];
    if (!existing) return;
    await logsRepo.softDelete(existing.id);
    set((s) => ({ todayLogs: { ...s.todayLogs, [habitId]: null } }));
    await get().refreshStreak(habitId);
  },

  async refreshStreak(habitId: string) {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;
    const streak = await loadStreakForHabit(habit);
    set((s) => ({ streaks: { ...s.streaks, [habitId]: streak } }));
  },

  async loadRecentLogs(habitId: string, userId: string, days = 30) {
    const today    = todayString();
    const fromDate = shiftDays(today, -(days - 1));
    const logs     = await logsRepo.getByHabitInRange(userId, habitId, fromDate, today);
    const dates    = logs.filter((l) => l.completedAt).map((l) => l.date);
    set((s) => ({ recentLogs: { ...s.recentLogs, [habitId]: dates } }));
  },
}));
