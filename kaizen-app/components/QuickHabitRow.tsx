import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Habit, HabitLog } from '@/types';
import type { StreakResult } from '@/utils/streakCalculator';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  habit: Habit;
  todayLog: HabitLog | null;
  streak: StreakResult;
  onLog(): void;
  onUndo(): void;
}

export default function QuickHabitRow({ habit, todayLog, streak, onLog, onUndo }: Props) {
  const { colors, typography, radius } = useTheme();
  const done = streak.completedToday;

  return (
    <TouchableOpacity style={s.row} onPress={done ? onUndo : onLog} activeOpacity={0.75}>
      <View style={[
        s.iconWrap,
        {
          backgroundColor: done ? colors.green100 : colors.surface2,
          borderColor: done ? colors.green500 : colors.border,
          borderRadius: radius.md,
        },
      ]}>
        <MaterialCommunityIcons
          name={habit.icon as any}
          size={20}
          color={done ? colors.green500 : colors.textSecondary}
        />
      </View>

      <View style={s.info}>
        <Text style={[
          s.name,
          { fontFamily: typography.fontBodyMedium },
          done
            ? { color: colors.textTertiary, textDecorationLine: 'line-through' }
            : { color: colors.textPrimary },
        ]} numberOfLines={1}>
          {habit.name}
        </Text>
        {streak.current > 0 && (
          <Text style={[s.streak, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
            🔥 {streak.current} dias
          </Text>
        )}
      </View>

      <MaterialCommunityIcons
        name={done ? 'check-circle' : 'circle-outline'}
        size={22}
        color={done ? colors.green500 : colors.textTertiary}
      />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 4 },
  iconWrap: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5 },
  info:     { flex: 1 },
  name:     { fontSize: 15 },
  streak:   { fontSize: 12, marginTop: 1 },
});
