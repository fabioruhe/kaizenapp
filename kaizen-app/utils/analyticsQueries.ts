/**
 * analyticsQueries.ts
 * Queries agregadas para a tela de Relatórios.
 * Todas as operações são feitas localmente sobre o SQLite via Drizzle.
 */

import { eq, and, isNull, isNotNull, gte, lte } from 'drizzle-orm';
import { db } from '@/db/client';
import { habits, habitLogs, tasks, pomodoroSessions } from '@/db/schema';
import { todayString, shiftDays } from '@/utils/dateHelpers';

// ─── Tipos de retorno ─────────────────────────────────────────────────────────

export interface DayBar {
  label: string;   // "Seg", "Ter", etc.
  date:  string;   // YYYY-MM-DD
  value: number;
}

export interface WeekBar {
  label: string;   // "Sem 1", "Sem 2", etc.
  value: number;
}

export interface HabitConsistency {
  habitId: string;
  name:    string;
  icon:    string;
  pct:     number;  // 0–1
  streak:  number;
}

export interface AnalyticsSummary {
  /** Check-ins de hábitos por dia (últimos 7 dias). */
  habitCheckinsPerDay: DayBar[];
  /** % de dias nos últimos 30 dias com pelo menos 1 hábito completo. */
  habitConsistency30d: number;
  /** Top hábitos por % de conclusão nos últimos 30 dias. */
  habitConsistencyList: HabitConsistency[];
  /** Tarefas concluídas por semana (últimas 4 semanas). */
  tasksCompletedPerWeek: WeekBar[];
  /** Total de tarefas concluídas nos últimos 30 dias. */
  tasksTotal30d: number;
  /** Minutos de foco por dia (últimos 7 dias). */
  focusMinutesPerDay: DayBar[];
  /** Total de minutos de foco nos últimos 30 dias. */
  focusTotal30d: number;
  /** Número de sessões Pomodoro nos últimos 30 dias. */
  pomodoroSessions30d: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PT_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return PT_SHORT[d.getDay()];
}

function buildDateRange(days: number): string[] {
  const today = todayString();
  return Array.from({ length: days }, (_, i) => shiftDays(today, -(days - 1 - i)));
}

// ─── Query principal ──────────────────────────────────────────────────────────

export async function loadAnalytics(userId: string): Promise<AnalyticsSummary> {
  const today   = todayString();
  const from7d  = shiftDays(today, -6);
  const from30d = shiftDays(today, -29);

  // ── Fetch paralelo ────────────────────────────────────────────────────────

  const [allHabits, allLogs, allTasks, allSessions] = await Promise.all([
    db.select().from(habits).where(
      and(eq(habits.userId, userId), isNull(habits.deletedAt), eq(habits.isActive, true))
    ),
    db.select().from(habitLogs).where(
      and(
        eq(habitLogs.userId, userId),
        isNull(habitLogs.deletedAt),
        isNotNull(habitLogs.completedAt),
        gte(habitLogs.date, from30d),
        lte(habitLogs.date, today),
      )
    ),
    db.select().from(tasks).where(
      and(
        eq(tasks.userId, userId),
        isNull(tasks.deletedAt),
        eq(tasks.isCompleted, true),
        isNotNull(tasks.completedAt),
        gte(tasks.completedAt, from30d + 'T00:00:00'),
      )
    ),
    db.select().from(pomodoroSessions).where(
      and(
        eq(pomodoroSessions.userId, userId),
        isNull(pomodoroSessions.deletedAt),
        gte(pomodoroSessions.startedAt, from30d + 'T00:00:00'),
      )
    ),
  ]);

  // ── Hábitos: check-ins por dia (últimos 7 dias) ───────────────────────────

  const last7 = buildDateRange(7);
  const logsByDate: Record<string, number> = {};
  for (const log of allLogs) {
    if (log.date >= from7d) {
      logsByDate[log.date] = (logsByDate[log.date] ?? 0) + 1;
    }
  }
  const habitCheckinsPerDay: DayBar[] = last7.map((date) => ({
    label: dayLabel(date),
    date,
    value: logsByDate[date] ?? 0,
  }));

  // ── Hábitos: consistência 30 dias ─────────────────────────────────────────

  const daysWithLog = new Set(allLogs.map((l) => l.date));
  const habitConsistency30d = daysWithLog.size / 30;

  // ── Hábitos: % de conclusão por hábito (últimos 30 dias) ─────────────────

  const logsByHabit: Record<string, Set<string>> = {};
  for (const log of allLogs) {
    if (!logsByHabit[log.habitId]) logsByHabit[log.habitId] = new Set();
    logsByHabit[log.habitId].add(log.date);
  }
  const habitConsistencyList: HabitConsistency[] = allHabits
    .map((h) => ({
      habitId: h.id,
      name:    h.name,
      icon:    h.icon,
      pct:     (logsByHabit[h.id]?.size ?? 0) / 30,
      streak:  0, // preenchido depois pelo store se necessário
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  // ── Tarefas: concluídas por semana (últimas 4 semanas) ───────────────────

  const tasksCompletedPerWeek: WeekBar[] = Array.from({ length: 4 }, (_, wi) => {
    const weekEnd   = shiftDays(today, -(wi * 7));
    const weekStart = shiftDays(today, -(wi * 7 + 6));
    const count     = allTasks.filter((t) => {
      const d = t.completedAt?.slice(0, 10) ?? '';
      return d >= weekStart && d <= weekEnd;
    }).length;
    return { label: wi === 0 ? 'Atual' : `-${wi}sem`, value: count };
  }).reverse();

  const tasksTotal30d = allTasks.length;

  // ── Pomodoro: foco por dia (últimos 7 dias) ───────────────────────────────

  const focusByDate: Record<string, number> = {};
  for (const s of allSessions) {
    const date = s.startedAt.slice(0, 10);
    if (date >= from7d) {
      focusByDate[date] = (focusByDate[date] ?? 0) + (s.totalFocusMinutes ?? 0);
    }
  }
  const focusMinutesPerDay: DayBar[] = last7.map((date) => ({
    label: dayLabel(date),
    date,
    value: focusByDate[date] ?? 0,
  }));

  const focusTotal30d = allSessions.reduce((acc, s) => acc + (s.totalFocusMinutes ?? 0), 0);
  const pomodoroSessions30d = allSessions.length;

  return {
    habitCheckinsPerDay,
    habitConsistency30d,
    habitConsistencyList,
    tasksCompletedPerWeek,
    tasksTotal30d,
    focusMinutesPerDay,
    focusTotal30d,
    pomodoroSessions30d,
  };
}
