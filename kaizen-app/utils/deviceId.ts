import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from './uuid';

const DEVICE_ID_KEY = 'userId';

/**
 * Retorna o userId local do dispositivo.
 * Na primeira chamada, gera um UUID v4, persiste no AsyncStorage e retorna.
 * Em chamadas subsequentes, retorna o valor já existente.
 *
 * Fase 2: este valor será substituído pelo auth.uid() do Supabase após login.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing !== null) return existing;

  const newId = generateId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
  return newId;
}

/**
 * Retorna o userId local sem criar um novo caso não exista.
 * Use apenas após o onboarding ter sido concluído.
 */
export async function getDeviceId(): Promise<string | null> {
  return AsyncStorage.getItem(DEVICE_ID_KEY);
}
