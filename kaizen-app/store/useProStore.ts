import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRO_KEY = 'kaizen_is_pro';

interface ProState {
  isPro: boolean;
  isLoading: boolean;
  load(): Promise<void>;
  /** Mock purchase — TODO: replace with RevenueCat/Stripe */
  purchasePro(): Promise<void>;
  restorePurchases(): Promise<void>;
}

export const useProStore = create<ProState>((set) => ({
  isPro: false,
  isLoading: true,

  async load() {
    const value = await AsyncStorage.getItem(PRO_KEY);
    set({ isPro: value === 'true', isLoading: false });
  },

  async purchasePro() {
    // TODO: integrate RevenueCat or Stripe before production
    await AsyncStorage.setItem(PRO_KEY, 'true');
    set({ isPro: true });
  },

  async restorePurchases() {
    // TODO: RevenueCat restore
    const value = await AsyncStorage.getItem(PRO_KEY);
    set({ isPro: value === 'true' });
  },
}));
