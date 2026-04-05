import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playPomodoroEndSound } from '@/utils/soundPlayer';
import { nowISO } from '@/utils/dateHelpers';
import { generateId } from '@/utils/uuid';
import type { PomodoroPhase, PomodoroSettings, PomodoroQuickTask, Task } from '@/types';

const SETTINGS_KEY = 'pomodoroSettings';

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMinutes:          25,
  shortBreakMinutes:     5,
  longBreakMinutes:      15,
  cyclesBeforeLongBreak: 4,
};

type SelectedTask = Task | PomodoroQuickTask | null;

interface SessionSnapshot {
  id: string;
  startedAt: string;
  completedCycles: number;
  totalFocusSeconds: number;
  taskTitle: string;
  taskId: string | null;
}

interface PomodoroState {
  phase: PomodoroPhase;
  currentCycle: number;
  secondsRemaining: number;
  isRunning: boolean;
  selectedTask: SelectedTask;
  settings: PomodoroSettings;
  session: SessionSnapshot | null;

  // ── Setup ────────────────────────────────────────────────────────────────────
  loadSettings(): Promise<void>;
  saveSettings(s: PomodoroSettings): Promise<void>;
  selectTask(task: SelectedTask): void;
  createQuickTask(title: string): void;

  // ── Timer controls ───────────────────────────────────────────────────────────
  start(): void;
  pause(): void;
  resume(): void;
  /** Chamado a cada segundo pelo intervalo da UI. */
  tick(): void;
  skipBreak(): void;
  /** Encerra a sessão; retorna dados para persistência. */
  abort(): SessionSnapshot | null;
  reset(): void;
}

function phaseSeconds(phase: PomodoroPhase, settings: PomodoroSettings): number {
  if (phase === 'focus')       return settings.focusMinutes * 60;
  if (phase === 'short_break') return settings.shortBreakMinutes * 60;
  if (phase === 'long_break')  return settings.longBreakMinutes * 60;
  return 0;
}

function nextPhase(
  current: PomodoroPhase,
  cycle: number,
  settings: PomodoroSettings,
): { phase: PomodoroPhase; cycle: number } {
  if (current === 'focus') {
    const completedCycle = cycle + 1;
    const isLong = completedCycle % settings.cyclesBeforeLongBreak === 0;
    return { phase: isLong ? 'long_break' : 'short_break', cycle: completedCycle };
  }
  if (current === 'long_break') {
    // Após a pausa longa, o round está completo — sessão encerrada naturalmente
    return { phase: 'done', cycle };
  }
  return { phase: 'focus', cycle };
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  phase: 'idle',
  currentCycle: 0,
  secondsRemaining: DEFAULT_SETTINGS.focusMinutes * 60,
  isRunning: false,
  selectedTask: null,
  settings: DEFAULT_SETTINGS,
  session: null,

  async loadSettings() {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PomodoroSettings>;
        set({ settings: { ...DEFAULT_SETTINGS, ...parsed } });
      }
    } catch { /* mantém default */ }
  },

  async saveSettings(s: PomodoroSettings) {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    set({ settings: s, secondsRemaining: s.focusMinutes * 60 });
  },

  selectTask(task: SelectedTask) {
    set({ selectedTask: task });
  },

  createQuickTask(title: string) {
    const quick: PomodoroQuickTask = { id: generateId(), title, subTasks: [] };
    set({ selectedTask: quick });
  },

  start() {
    const { settings, selectedTask } = get();
    const taskTitle = selectedTask?.title ?? '';
    const taskId    = selectedTask && 'userId' in selectedTask ? (selectedTask as Task).id : null;
    set({
      phase: 'focus',
      currentCycle: 0,
      secondsRemaining: phaseSeconds('focus', settings),
      isRunning: true,
      session: {
        id: generateId(),
        startedAt: nowISO(),
        completedCycles: 0,
        totalFocusSeconds: 0,
        taskTitle,
        taskId,
      },
    });
  },

  pause() {
    set({ isRunning: false });
  },

  resume() {
    set({ isRunning: true });
  },

  tick() {
    const { secondsRemaining, phase, currentCycle, settings, session } = get();

    // Acumula segundos de foco na sessão
    const focusDelta = phase === 'focus' ? 1 : 0;
    const updatedSession = session
      ? { ...session, totalFocusSeconds: session.totalFocusSeconds + focusDelta }
      : session;

    if (secondsRemaining > 1) {
      set({ secondsRemaining: secondsRemaining - 1, session: updatedSession });
      return;
    }

    // Tempo esgotado — transição de fase
    playPomodoroEndSound();
    const { phase: next, cycle } = nextPhase(phase, currentCycle, settings);
    const completedCycles = phase === 'focus' ? (session?.completedCycles ?? 0) + 1 : (session?.completedCycles ?? 0);

    set({
      phase: next,
      currentCycle: cycle,
      secondsRemaining: phaseSeconds(next, settings),
      isRunning: next !== 'done',
      session: updatedSession
        ? { ...updatedSession, completedCycles, totalFocusSeconds: updatedSession.totalFocusSeconds }
        : updatedSession,
    });
  },

  skipBreak() {
    const { settings } = get();
    set({ phase: 'focus', secondsRemaining: phaseSeconds('focus', settings), isRunning: true });
  },

  abort() {
    const { session } = get();
    get().reset();
    return session;
  },

  reset() {
    const { settings } = get();
    set({
      phase: 'idle',
      currentCycle: 0,
      secondsRemaining: settings.focusMinutes * 60,
      isRunning: false,
      session: null,
    });
  },
}));
