import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { todayString, shiftDays } from '@/utils/dateHelpers';

interface Props {
  completedDates: string[];
  days?: number;
}

const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function HabitCheckInGrid({ completedDates, days = 30 }: Props) {
  const { colors, typography } = useTheme();
  const set = new Set(completedDates);

  const today  = todayString();
  const grid   = Array.from({ length: days }, (_, i) => {
    const date = shiftDays(today, -(days - 1 - i));
    return { date, done: set.has(date) };
  });

  // Split into rows of 7 for weekly view
  const weeks: typeof grid[] = [];
  for (let i = 0; i < grid.length; i += 7) {
    weeks.push(grid.slice(i, i + 7));
  }

  return (
    <View style={s.container}>
      <Text style={[s.label, { color: colors.textTertiary, fontFamily: typography.fontBodyBold }]}>
        Últimos {days} dias
      </Text>
      {weeks.map((week, wi) => (
        <View key={wi} style={s.row}>
          {week.map(({ date, done }) => {
            const d = new Date(date + 'T00:00:00');
            const dayLabel = DAY_LABELS[d.getDay()];
            const isToday  = date === today;
            return (
              <View key={date} style={s.cell}>
                <View style={[
                  s.dot,
                  done
                    ? { backgroundColor: colors.green500 }
                    : { backgroundColor: colors.surface3 },
                  isToday && !done && { borderWidth: 1.5, borderColor: colors.blue500, backgroundColor: 'transparent' },
                ]} />
                <Text style={[s.dayTxt, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                  {dayLabel}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingTop: 12, gap: 6 },
  label:     { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 },
  row:       { flexDirection: 'row', gap: 6 },
  cell:      { flex: 1, alignItems: 'center', gap: 3 },
  dot:       { width: 18, height: 18, borderRadius: 4 },
  dayTxt:    { fontSize: 9 },
});
