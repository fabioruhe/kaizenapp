import { useColorScheme } from 'react-native';
import { Colors, Typography, Spacing, Radius, BorderWidth } from '@/constants/theme';
import { useOnboardingStore } from '@/store/useOnboardingStore';

export function useTheme() {
  const systemScheme   = useColorScheme();
  const appearanceMode = useOnboardingStore((s) => s.preferences.appearanceMode);

  const effectiveScheme = appearanceMode === 'system' ? systemScheme : appearanceMode;
  const colors          = effectiveScheme === 'dark' ? Colors.dark : Colors.light;

  return {
    colors,
    typography: Typography,
    spacing: Spacing,
    radius: Radius,
    border: BorderWidth,
    isDark: effectiveScheme === 'dark',
  };
}
