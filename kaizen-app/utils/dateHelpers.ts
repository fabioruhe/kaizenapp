/**
 * Helpers de data — sem dependências externas.
 * Todas as datas internas usam o fuso local do dispositivo.
 * Formato canônico para armazenamento: YYYY-MM-DD (datas) e ISO 8601 (timestamps).
 */

/** Retorna a data de hoje no formato YYYY-MM-DD (fuso local). */
export function todayString(): string {
  return toDateString(new Date());
}

/** Converte um objeto Date para YYYY-MM-DD (fuso local). */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Converte YYYY-MM-DD → Date (meia-noite no fuso local). */
export function fromDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Retorna o timestamp ISO 8601 atual (ex: "2026-03-31T14:23:00.000Z"). */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Calcula a diferença em dias inteiros entre duas datas YYYY-MM-DD.
 * Resultado positivo = `to` é mais recente que `from`.
 */
export function diffInDays(from: string, to: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const fromMs = fromDateString(from).getTime();
  const toMs   = fromDateString(to).getTime();
  return Math.round((toMs - fromMs) / msPerDay);
}

/**
 * Retorna a data de N dias atrás (ou à frente, com N negativo)
 * no formato YYYY-MM-DD.
 */
export function shiftDays(dateStr: string, days: number): string {
  const date = fromDateString(dateStr);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

/**
 * Verifica se uma data YYYY-MM-DD é hoje.
 */
export function isToday(dateStr: string): boolean {
  return dateStr === todayString();
}

/**
 * Verifica se uma data YYYY-MM-DD é ontem.
 */
export function isYesterday(dateStr: string): boolean {
  return dateStr === shiftDays(todayString(), -1);
}

/**
 * Formata uma data YYYY-MM-DD para exibição em português.
 * Ex: "31 de março de 2026"
 */
export function formatDatePT(dateStr: string): string {
  const date = fromDateString(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formata uma data YYYY-MM-DD de forma curta.
 * Ex: "31/03/2026"
 */
export function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Retorna o nome do dia da semana em português.
 * Ex: "Segunda-feira"
 */
export function weekdayPT(dateStr: string): string {
  const date = fromDateString(dateStr);
  return date.toLocaleDateString('pt-BR', { weekday: 'long' });
}

/**
 * Retorna true se `dateStr` é posterior ou igual a `startDate`.
 * Usado para verificar se um hábito está ativo para uma determinada data.
 */
export function isOnOrAfter(dateStr: string, startDate: string): boolean {
  return dateStr >= startDate;
}

/**
 * Retorna true se a data de entrega já passou (anterior a hoje).
 */
export function isOverdue(dueDate: string): boolean {
  return dueDate < todayString();
}
