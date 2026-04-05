import { Redirect } from 'expo-router';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useTheme } from '@/hooks/useTheme';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { hasCompletedOnboarding, isLoading } = useOnboardingStore();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#facc15" />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)/habits" />;
}
