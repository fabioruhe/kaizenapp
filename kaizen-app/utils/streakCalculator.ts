import type { HabitType } from '@/types';
import { todayString, shiftDays, diffInDays } from './dateHelpers';

/**
 * Resultado do cálculo de streak.
 */
export interface StreakResult {
  /** Streak atual em dias. */
  current: number;
  /** Maior streak já atingido. */
  best: number;
  /** Se o hábito foi completado hoje. */
  completedToday: boolean;
}

/**
 * Calcula o streak de um hábito dado o array de datas em que foi completado.
 *
 * Algoritmo — hábito BUILD (once_daily ou multiple_daily):
 *   - Streak cresce 1 por cada dia consecutivo com log completado.
 *   - Dias sem log quebram a sequência.
 *   - Faltou hoje mas completou ontem → streak continua (ainda dá tempo hoje).
 *   - Faltou ontem (e não é hoje) → streak = 0.
 *
 * Algoritmo — hábito QUIT (sempre once_daily):
 *   - A lógica é inversa: o streak é o número de dias consecutivos
 *     desde o último dia SEM recaída (check "não recaí hoje").
 *   - `completedDates` contém as datas em que o usuário fez o check "ok".
 *   - Se o usuário não fez o check hoje nem ontem → streak quebra.
 *
 * @param completedDates - Array de strings YYYY-MM-DD em que o hábito foi completado.
 *                         Pode conter duplicatas; serão deduplicadas internamente.
 * @param type           - 'build' ou 'quit'.
 * @param startDate      - Data de início do hábito (YYYY-MM-DD).
 */
export function calculateStreak(
  completedDates: string[],
  type: HabitType,
  startDate: string,
): StreakResult {
  const today = todayString();
  const yesterday = shiftDays(today, -1);

  // Deduplica e ordena datas em ordem decrescente
  const unique = Array.from(new Set(completedDates)).sort((a, b) =>
    b.localeCompare(a),
  );

  const completedToday = unique.includes(today);

  if (unique.length === 0) {
    return { current: 0, best: 0, completedToday: false };
  }

  if (type === 'build') {
    return calculateBuildStreak(unique, today, yesterday, startDate, completedToday);
  }

  return calculateQuitStreak(unique, today, yesterday, completedToday);
}

// ─── Build ────────────────────────────────────────────────────────────────────

function calculateBuildStreak(
  sortedDates: string[],
  today: string,
  yesterday: string,
  startDate: string,
  completedToday: boolean,
): StreakResult {
  // Ponto de partida: hoje ou ontem (o usuário ainda pode completar hoje)
  const anchor = completedToday ? today : yesterday;

  // Se a data mais recente é anterior a ontem, streak quebrou
  if (sortedDates[0] < yesterday) {
    return { current: 0, best: calculateBestStreak(sortedDates), completedToday };
  }

  // Conta streak atual retrocedendo a partir do anchor
  let current = 0;
  let expected = anchor;

  for (const date of sortedDates) {
    if (date > anchor) continue; // ignorar datas futuras (não deveria ocorrer)
    if (date < startDate) break;  // não contar antes do início do hábito

    if (date === expected) {
      current++;
      expected = shiftDays(expected, -1);
    } else {
      break; // lacuna encontrada — streak interrompido
    }
  }

  return {
    current,
    best: Math.max(current, calculateBestStreak(sortedDates)),
    completedToday,
  };
}

// ─── Quit ─────────────────────────────────────────────────────────────────────

function calculateQuitStreak(
  sortedDates: string[],
  today: string,
  yesterday: string,
  completedToday: boolean,
): StreakResult {
  // Para quit, a lógica é idêntica ao build:
  // cada dia com check "não recaí" conta como +1.
  // Se o usuário faltou ontem (e não completou hoje), streak = 0.
  const anchor = completedToday ? today : yesterday;

  if (sortedDates[0] < yesterday) {
    return { current: 0, best: calculateBestStreak(sortedDates), completedToday };
  }

  let current = 0;
  let expected = anchor;

  for (const date of sortedDates) {
    if (date > anchor) continue;

    if (date === expected) {
      current++;
      expected = shiftDays(expected, -1);
    } else {
      break;
    }
  }

  return {
    current,
    best: Math.max(current, calculateBestStreak(sortedDates)),
    completedToday,
  };
}

// ─── Melhor streak histórico ──────────────────────────────────────────────────

/**
 * Calcula o maior streak contínuo no histórico completo de datas.
 * As datas devem estar ordenadas de forma decrescente.
 */
function calculateBestStreak(sortedDatesDesc: string[]): number {
  if (sortedDatesDesc.length === 0) return 0;

  // Reordena em ordem crescente para iterar cronologicamente
  const asc = [...sortedDatesDesc].reverse();

  let best = 1;
  let current = 1;

  for (let i = 1; i < asc.length; i++) {
    const gap = diffInDays(asc[i - 1], asc[i]);
    if (gap === 1) {
      current++;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }

  return best;
}

/**
 * Retorna quantos dias se passaram sem recaída para hábitos QUIT.
 * Diferente do streak (que quebra se o usuário não fizer o check),
 * este contador é calculado a partir da data de início ou do último log.
 *
 * Usado como fallback visual quando o histórico de checks está vazio.
 */
export function daysSinceStart(startDate: string): number {
  return Math.max(0, diffInDays(startDate, todayString()));
}
