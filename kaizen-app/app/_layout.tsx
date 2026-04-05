import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useProStore } from '@/store/useProStore';
import { initNotifications } from '@/utils/notificationScheduler';

function AuthGuard() {
  const router   = useRouter();
  const segments = useSegments();

  const { session, isLoading: authLoading, triggerSync } = useAuthStore();
  const { hasCompletedOnboarding, isLoading: onboardingLoading, userId: localUserId } = useOnboardingStore();

  // Trigger sync once when the user first gets a valid session
  const syncedSessionRef = useRef<string | null>(null);
  useEffect(() => {
    if (session?.user.id && session.user.id !== syncedSessionRef.current && localUserId) {
      syncedSessionRef.current = session.user.id;
      triggerSync(localUserId);
    }
  }, [session?.user.id, localUserId]);

  useEffect(() => {
    if (authLoading || onboardingLoading) return;

    const inAuth       = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const inTabs       = segments[0] === '(tabs)';

    if (!session) {
      // Não autenticado → tela de login
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }

    // Autenticado, mas não fez onboarding
    if (!hasCompletedOnboarding) {
      if (!inOnboarding) router.replace('/(onboarding)');
      return;
    }

    // Autenticado + onboarding feito → app principal
    if (inAuth || inOnboarding) router.replace('/(tabs)');
  }, [session, authLoading, hasCompletedOnboarding, onboardingLoading, segments]);

  return null;
}

export default function RootLayout() {
  const loadOnboarding = useOnboardingStore((s) => s.load);
  const initAuth       = useAuthStore((s) => s.init);
  const loadPro        = useProStore((s) => s.load);

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    loadOnboarding();
    initAuth();
    loadPro();
    initNotifications();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
