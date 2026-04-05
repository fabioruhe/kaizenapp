import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserPreferences } from '@/types';

const PREFS_KEY = 'userPreferences';

async function getPrefs(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return { soundEnabled: true, pomodoroSoundEnabled: true, appearanceMode: 'system' };
    return { soundEnabled: true, pomodoroSoundEnabled: true, appearanceMode: 'system', ...JSON.parse(raw) };
  } catch {
    return { soundEnabled: true, pomodoroSoundEnabled: true, appearanceMode: 'system' };
  }
}

async function playAsset(asset: number): Promise<void> {
  const { sound } = await Audio.Sound.createAsync(asset);
  await sound.playAsync();
  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      sound.unloadAsync();
    }
  });
}

/**
 * Toca o som de conclusão de hábito.
 * - build: ao marcar como concluído
 * - quit: ao registrar "não realizei hoje"
 * - multiple_daily: ao atingir a meta diária
 */
export async function playHabitSound(): Promise<void> {
  if (!(await getPrefs()).soundEnabled) return;
  try {
    await playAsset(require('../assets/sounds/habit.mp3'));
  } catch {
    // Arquivo placeholder ou inválido — ignora silenciosamente
  }
}

/** Toca o som de conclusão (tarefa completa). */
export async function playCompletionSound(): Promise<void> {
  if (!(await getPrefs()).soundEnabled) return;
  try {
    // Substitua pelo arquivo real em assets/sounds/complete.mp3
    await playAsset(require('../assets/sounds/complete.mp3'));
  } catch {
    // Arquivo placeholder ou inválido — ignora silenciosamente
  }
}

/** Toca o som de fim de ciclo Pomodoro (foco ou pausa). */
export async function playPomodoroEndSound(): Promise<void> {
  if (!(await getPrefs()).pomodoroSoundEnabled) return;
  try {
    // Substitua pelo arquivo real em assets/sounds/pomodoro_end.mp3
    await playAsset(require('../assets/sounds/pomodoro_end.mp3'));
  } catch {
    // Arquivo placeholder ou inválido — ignora silenciosamente
  }
}
