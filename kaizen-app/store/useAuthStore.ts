import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { runSync } from '@/lib/syncService';
import type { Session, User, AuthError } from '@supabase/supabase-js';

interface AuthState {
  session:     Session | null;
  user:        User | null;
  isLoading:   boolean;
  isSyncing:   boolean;
  lastSyncAt:  string | null;
  syncError:   string | null;

  /** Inicializa a sessão a partir do storage e configura o listener de mudanças. */
  init(): Promise<void>;
  signUp(email: string, password: string): Promise<{ error: AuthError | null }>;
  signIn(email: string, password: string): Promise<{ error: AuthError | null }>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<{ error: AuthError | null }>;
  /**
   * Dispara a sincronização manual.
   * @param localUserId  device UUID de useOnboardingStore
   */
  triggerSync(localUserId: string): Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session:    null,
  user:       null,
  isLoading:  true,
  isSyncing:  false,
  lastSyncAt: null,
  syncError:  null,

  async init() {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, isLoading: false });

    supabase.auth.onAuthStateChange((event, newSession) => {
      set({ session: newSession, user: newSession?.user ?? null });

      // Dispara sync automático ao fazer login em qualquer dispositivo.
      // O localUserId é injetado pelo chamador via triggerSync; aqui apenas
      // registramos o evento para que o componente possa reagir se quiser.
      if (event === 'SIGNED_OUT') {
        set({ lastSyncAt: null, syncError: null });
      }
    });
  },

  async signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session) {
      set({ session: data.session, user: data.session.user });
    }
    return { error };
  },

  async signOut() {
    await supabase.auth.signOut();
    set({ session: null, user: null, lastSyncAt: null, syncError: null });
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  },

  async triggerSync(localUserId: string) {
    const { user, isSyncing } = get();
    if (!user || isSyncing) return;

    set({ isSyncing: true, syncError: null });
    try {
      await runSync(user.id, localUserId);
      set({ lastSyncAt: new Date().toISOString() });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao sincronizar';
      set({ syncError: msg });
      console.error('[sync]', msg);
    } finally {
      set({ isSyncing: false });
    }
  },
}));
