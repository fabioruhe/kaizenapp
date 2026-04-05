import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import type { Habit } from '@/types';
import type { StreakResult } from '@/utils/streakCalculator';
import { diffInDays, todayString } from '@/utils/dateHelpers';

interface Props {
  habit: Habit;
  streak: StreakResult;
  onRenew(): void;
  onComplete(): void;
}

export function isGoalReached(habit: Habit, streak: StreakResult): boolean {
  if (habit.goalType === 'forever') return false;
  if (habit.goalType === 'days' && habit.goalTargetDays) {
    return streak.current >= habit.goalTargetDays;
  }
  if (habit.goalType === 'date_range' && habit.goalEndDate) {
    return todayString() >= habit.goalEndDate;
  }
  return false;
}

export default function HabitGoalCelebration({ onRenew, onComplete }: Props) {
  const { colors } = useTheme();
  const scale   = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value   = withSpring(1, { damping: 12, stiffness: 180 });
    opacity.value = withSpring(1, { damping: 16 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[s.banner, animStyle]}>
      <Text style={s.emoji}>🎯</Text>
      <Text style={s.title}>Meta atingida!</Text>
      <Text style={[s.sub, { color: colors.textSecondary }]}>Parabéns pela conquista. O que deseja fazer agora?</Text>
      <View style={s.btnRow}>
        <TouchableOpacity style={s.btnRenew} onPress={onRenew} activeOpacity={0.8}>
          <MaterialCommunityIcons name="refresh" size={15} color="#facc15" />
          <Text style={s.btnRenewTxt}>Renovar meta</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnDone} onPress={onComplete} activeOpacity={0.8}>
          <MaterialCommunityIcons name="check-circle" size={15} color="#000" />
          <Text style={s.btnDoneTxt}>Concluir hábito</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  banner:      { backgroundColor: 'rgba(250,204,21,0.08)', borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: 'rgba(250,204,21,0.25)', alignItems: 'center', gap: 4 },
  emoji:       { fontSize: 26 },
  title:       { color: '#facc15', fontSize: 15, fontWeight: 'bold' },
  sub:         { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  btnRow:      { flexDirection: 'row', gap: 8, marginTop: 10 },
  btnRenew:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#facc15' },
  btnRenewTxt: { color: '#facc15', fontSize: 13, fontWeight: '600' },
  btnDone:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, backgroundColor: '#facc15' },
  btnDoneTxt:  { color: '#000', fontSize: 13, fontWeight: '600' },
});
