import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DailySummary } from '@/types';
import { useTheme } from '@/hooks/useTheme';

interface Props { summary: DailySummary }

export default function DailySummaryCards({ summary }: Props) {
  const { colors, typography, radius } = useTheme();

  const CARDS = [
    { key: 'habits',    icon: 'fire',          label: 'Hábitos',   color: colors.green500,  value: `${summary.habitsCompleted}/${summary.habitsTotal}` },
    { key: 'tasks',     icon: 'check-circle',  label: 'Tarefas',   color: colors.blue500,   value: `${summary.tasksCompletedToday} feitas` },
    { key: 'focus',     icon: 'timer',         label: 'Foco',      color: colors.purple500, value: `${summary.focusMinutesToday} min` },
    { key: 'pomodoros', icon: 'clock-outline', label: 'Pomodoros', color: colors.purple500, value: `${summary.pomodorosToday}` },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
      {CARDS.map((card) => (
        <View key={card.key} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
          <MaterialCommunityIcons name={card.icon as any} size={22} color={card.color} />
          <Text style={[s.value, { color: card.color, fontFamily: typography.fontBodyBold }]}>
            {card.value}
          </Text>
          <Text style={[s.label, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
            {card.label}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingVertical: 4, gap: 10 },
  card:   { width: 100, padding: 14, alignItems: 'center', gap: 6, borderWidth: 0.5 },
  value:  { fontSize: 17 },
  label:  { fontSize: 11, textAlign: 'center' },
});
