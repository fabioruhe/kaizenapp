import { View, Text, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  userName: string;
  onAvatarPress(): void;
}

function formatDate(): string {
  const raw = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date());
  return raw
    .replace(/\./g, '')
    .replace(' de ', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default function HomeHeader({ userName, onAvatarPress }: Props) {
  const { colors, typography } = useTheme();

  return (
    <View style={s.container}>
      <View>
        <Text style={[s.date, { color: colors.textTertiary, fontFamily: typography.fontBodyMedium }]}>
          {formatDate()}
        </Text>
        <Text style={[s.title, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
          Início
        </Text>
      </View>
      <Avatar name={userName} size={40} onPress={onAvatarPress} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  date:      { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 },
  title:     { fontSize: 22, marginTop: 2 },
});
