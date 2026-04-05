/**
 * reminderHelpers.ts
 *
 * Funções puras de lembrete — sem dependências nativas.
 * Separadas do notificationScheduler para evitar carregar
 * expo-notifications em componentes que só precisam de texto descritivo.
 */

import type { ReminderMode } from '@/types';

interface ReminderDescription {
  reminderEnabled: boolean;
  reminderMode: ReminderMode | null;
  reminderFixedTime: string | null;
  reminderIntervalHours: number | null;
  reminderIntervalStart: string | null;
  reminderIntervalEnd: string | null;
}

/**
 * Gera uma string legível descrevendo o lembrete configurado.
 *
 * Exemplos:
 *  "Todo dia às 07:00"
 *  "A cada 4h, das 08:00 às 22:00"
 *  "Todo dia às 07:00 + a cada 4h, das 08:00 às 22:00"
 */
export function describeReminder(r: ReminderDescription): string {
  if (!r.reminderEnabled || !r.reminderMode) return '';

  const parts: string[] = [];

  if ((r.reminderMode === 'fixed_time' || r.reminderMode === 'both') && r.reminderFixedTime) {
    parts.push(`Todo dia às ${r.reminderFixedTime}`);
  }

  if (
    (r.reminderMode === 'interval' || r.reminderMode === 'both') &&
    r.reminderIntervalHours &&
    r.reminderIntervalStart &&
    r.reminderIntervalEnd
  ) {
    parts.push(`A cada ${r.reminderIntervalHours}h, das ${r.reminderIntervalStart} às ${r.reminderIntervalEnd}`);
  }

  return parts.join(' + ');
}
