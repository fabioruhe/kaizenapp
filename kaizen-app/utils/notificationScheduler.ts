/**
 * notificationScheduler.ts
 *
 * Centraliza toda a lógica de agendamento, cancelamento e reagendamento
 * de notificações locais usando expo-notifications.
 *
 * IMPORTANTE: este módulo importa código nativo (expo-notifications).
 * Chamar initNotifications() uma única vez no _layout.tsx após o app montar.
 * Não importar este arquivo em componentes que só precisam de texto —
 * usar reminderHelpers.ts para funções puras.
 */

import * as Notifications from 'expo-notifications';
import type { Habit } from '@/types';

// ─── Re-exporta describeReminder para compatibilidade ────────────────────────

export { describeReminder } from './reminderHelpers';

// ─── Init (chamar uma vez no _layout.tsx) ────────────────────────────────────

export function initNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function parseTime(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { hour: h ?? 0, minute: m ?? 0 };
}

async function hasPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

async function scheduleFixed(habitName: string, hhmm: string): Promise<string> {
  const { hour, minute } = parseTime(hhmm);
  return Notifications.scheduleNotificationAsync({
    content: { title: '⏰ Hora do seu hábito!', body: habitName, data: {} },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

async function scheduleInterval(
  habitName: string,
  intervalHours: number,
  startHhmm: string,
  endHhmm: string,
): Promise<string[]> {
  const ids: string[] = [];
  const { hour: startH, minute: startM } = parseTime(startHhmm);
  const { hour: endH } = parseTime(endHhmm);

  let currentHour = startH;
  while (currentHour <= endH) {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: '🔁 Lembrete de hábito', body: habitName, data: {} },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: currentHour,
        minute: startM,
      },
    });
    ids.push(id);
    currentHour += intervalHours;
  }
  return ids;
}

// ─── API pública ──────────────────────────────────────────────────────────────

export async function cancelHabitNotifications(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

export async function scheduleHabitNotifications(habit: Habit): Promise<string[]> {
  await cancelHabitNotifications(habit.notificationIds);

  if (!habit.reminderEnabled || !habit.reminderMode) return [];
  if (!(await hasPermission())) {
    // DEBUG: console.log('[Notifications] Permissão não concedida — nada agendado');
    return [];
  }

  const newIds: string[] = [];
  const mode = habit.reminderMode;

  if ((mode === 'fixed_time' || mode === 'both') && habit.reminderFixedTime) {
    newIds.push(await scheduleFixed(habit.name, habit.reminderFixedTime));
  }

  if (
    (mode === 'interval' || mode === 'both') &&
    habit.frequencyType === 'multiple_daily' &&
    habit.reminderIntervalHours &&
    habit.reminderIntervalStart &&
    habit.reminderIntervalEnd
  ) {
    const ids = await scheduleInterval(
      habit.name,
      habit.reminderIntervalHours,
      habit.reminderIntervalStart,
      habit.reminderIntervalEnd,
    );
    newIds.push(...ids);
  }

  // DEBUG: console.log(`[Notifications] Agendado ${newIds.length} notificação(ões) para "${habit.name}"`);
  return newIds;
}

/**
 * Agenda uma notificação única para daqui a `seconds` segundos.
 * Usada para alertar o fim de cada fase do Pomodoro.
 * Retorna o id da notificação (para cancelamento se necessário).
 */
export async function schedulePomodoroPhaseEnd(
  title: string,
  body: string,
  seconds: number,
): Promise<string | null> {
  if (!(await hasPermission())) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data: {} },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });
}

export async function cancelPomodoroNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function requestNotificationPermission(): Promise<'granted' | 'denied'> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted' ? 'granted' : 'denied';
}

export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as 'granted' | 'denied' | 'undetermined';
}
