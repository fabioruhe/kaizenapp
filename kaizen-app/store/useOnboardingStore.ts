import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrCreateDeviceId } from '@/utils/deviceId';
import type { UserPreferences } from '@/types';

const ONBOARDING_KEY     = 'hasCompletedOnboarding';
const WHY_KEY            = 'userWhy';
const USERNAME_KEY       = 'userName';
const NOTIFICATIONS_KEY  = 'notificationsPermission';
const PREFERENCES_KEY    = 'userPreferences';
const AVATAR_URI_KEY     = 'avatarUri';

const DEFAULT_PREFERENCES: UserPreferences = {
  soundEnabled:         true,
  pomodoroSoundEnabled: true,
  appearanceMode:       'system',
};

export type NotificationPermissionStatus = 'granted' | 'denied' | 'not_asked';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  userId: string;
  why: string;
  userName: string;
  avatarUri: string | null;
  notificationsPermission: NotificationPermissionStatus;
  preferences: UserPreferences;
  isLoading: boolean;

  load(): Promise<void>;
  complete(why: string): Promise<void>;
  saveNotificationPermission(status: NotificationPermissionStatus): Promise<void>;
  updateWhy(why: string): Promise<void>;
  setUserName(name: string): Promise<void>;
  setAvatarUri(uri: string | null): Promise<void>;
  setSoundEnabled(enabled: boolean): Promise<void>;
  setPomodoroSoundEnabled(enabled: boolean): Promise<void>;
  setAppearanceMode(mode: 'light' | 'dark' | 'system'): Promise<void>;
  /** Apaga todas as preferências e dados de onboarding (exceto deviceId). */
  resetPreferences(): Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  hasCompletedOnboarding: false,
  userId: '',
  why: '',
  userName: '',
  avatarUri: null,
  notificationsPermission: 'not_asked',
  preferences: DEFAULT_PREFERENCES,
  isLoading: true,

  async load() {
    const [completed, why, userId, notifPerm, prefsRaw, userName, avatarUri] = await Promise.all([
      AsyncStorage.getItem(ONBOARDING_KEY),
      AsyncStorage.getItem(WHY_KEY),
      getOrCreateDeviceId(),
      AsyncStorage.getItem(NOTIFICATIONS_KEY),
      AsyncStorage.getItem(PREFERENCES_KEY),
      AsyncStorage.getItem(USERNAME_KEY),
      AsyncStorage.getItem(AVATAR_URI_KEY),
    ]);
    const preferences: UserPreferences = prefsRaw
      ? { ...DEFAULT_PREFERENCES, ...JSON.parse(prefsRaw) }
      : DEFAULT_PREFERENCES;
    set({
      hasCompletedOnboarding: completed === 'true',
      why: why ?? '',
      userId,
      userName: userName ?? '',
      avatarUri: avatarUri ?? null,
      notificationsPermission: (notifPerm as NotificationPermissionStatus) ?? 'not_asked',
      preferences,
      isLoading: false,
    });
  },

  async complete(why: string) {
    const userId = get().userId || (await getOrCreateDeviceId());
    await Promise.all([
      AsyncStorage.setItem(ONBOARDING_KEY, 'true'),
      AsyncStorage.setItem(WHY_KEY, why),
    ]);
    set({ hasCompletedOnboarding: true, why, userId });
  },

  async saveNotificationPermission(status: NotificationPermissionStatus) {
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, status);
    set({ notificationsPermission: status });
  },

  async updateWhy(why: string) {
    await AsyncStorage.setItem(WHY_KEY, why);
    set({ why });
  },

  async setUserName(name: string) {
    await AsyncStorage.setItem(USERNAME_KEY, name);
    set({ userName: name });
  },

  async setAvatarUri(uri: string | null) {
    if (uri) {
      await AsyncStorage.setItem(AVATAR_URI_KEY, uri);
    } else {
      await AsyncStorage.removeItem(AVATAR_URI_KEY);
    }
    set({ avatarUri: uri });
  },

  async setSoundEnabled(enabled: boolean) {
    const next: UserPreferences = { ...get().preferences, soundEnabled: enabled };
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
    set({ preferences: next });
  },

  async setPomodoroSoundEnabled(enabled: boolean) {
    const next: UserPreferences = { ...get().preferences, pomodoroSoundEnabled: enabled };
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
    set({ preferences: next });
  },

  async setAppearanceMode(mode: 'light' | 'dark' | 'system') {
    const next: UserPreferences = { ...get().preferences, appearanceMode: mode };
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
    set({ preferences: next });
  },

  async resetPreferences() {
    await AsyncStorage.multiRemove([
      ONBOARDING_KEY, WHY_KEY, USERNAME_KEY,
      NOTIFICATIONS_KEY, PREFERENCES_KEY, AVATAR_URI_KEY,
    ]);
    set({
      hasCompletedOnboarding: false,
      why: '',
      userName: '',
      avatarUri: null,
      notificationsPermission: 'not_asked',
      preferences: DEFAULT_PREFERENCES,
    });
  },
}));
