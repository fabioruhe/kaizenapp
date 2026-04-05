import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingStore } from '@/store/useOnboardingStore';

interface Props {
  name?: string;
  size?: number;
  onPress?(): void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Avatar({ name, size = 40, onPress }: Props) {
  const { colors, typography } = useTheme();
  const avatarUri = useOnboardingStore((s) => s.avatarUri);
  const hasName   = name && name.trim().length > 0;

  const circle = (
    <View style={[
      s.circle,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.blue100,
        borderColor: colors.border2,
      },
    ]}>
      {avatarUri ? (
        <Image
          source={{ uri: avatarUri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : hasName ? (
        <Text style={[s.initials, { fontSize: size * 0.35, color: colors.blue500, fontFamily: typography.fontBodyBold }]}>
          {initials(name!)}
        </Text>
      ) : (
        <MaterialCommunityIcons name="account" size={size * 0.55} color={colors.textSecondary} />
      )}
    </View>
  );

  if (!onPress) return circle;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} hitSlop={8}>
      {circle}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  circle:   { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, overflow: 'hidden' },
  initials: {},
});
