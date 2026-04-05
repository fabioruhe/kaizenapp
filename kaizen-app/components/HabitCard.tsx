import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import HabitCardActions from './HabitCardActions';
import HabitGoalCelebration, { isGoalReached } from './HabitGoalCelebration';
import HabitCheckInGrid from './HabitCheckInGrid';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import type { Habit, HabitLog } from '@/types';
import type { StreakResult } from '@/utils/streakCalculator';
import { diffInDays, todayString, formatDateShort } from '@/utils/dateHelpers';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  habit: Habit;
  todayLog: HabitLog | null;
  streak: StreakResult;
  onLog(): void;
  onUndo(): void;
  onDelete(): void;
  onRenewGoal(): void;
  onCompleteGoal(): void;
  onEdit?(): void;
}

function StreakBadge({ streak, type }: { streak: StreakResult; type: Habit['type'] }) {
  const { colors, typography } = useTheme();
  const color = type === 'build' ? colors.green500 : colors.red;
  const icon  = type === 'build' ? 'fire' : 'shield-star';
  const label = type === 'build' ? 'dias seguidos' : 'dias sem recaída';
  return (
    <View style={s.streakRow}>
      <MaterialCommunityIcons name={icon as never} size={13} color={color} />
      <Text style={[s.streakTxt, { color, fontFamily: typography.fontBodyBold }]}>
        {streak.current} {label}
      </Text>
      {streak.best > 0 && streak.best > streak.current && (
        <Text style={[s.streakBest, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
          (recorde: {streak.best})
        </Text>
      )}
    </View>
  );
}

function GoalProgress({ habit, streak }: { habit: Habit; streak: StreakResult }) {
  const { colors, typography } = useTheme();
  if (habit.goalType === 'forever') return null;

  let pct = 0;
  let label = '';

  if (habit.goalType === 'days' && habit.goalTargetDays) {
    pct   = Math.min(streak.current / habit.goalTargetDays, 1);
    label = `${streak.current} / ${habit.goalTargetDays} dias`;
  } else if (habit.goalType === 'date_range' && habit.goalEndDate) {
    const total   = diffInDays(habit.startDate, habit.goalEndDate);
    const elapsed = Math.max(0, diffInDays(habit.startDate, todayString()));
    pct   = total > 0 ? Math.min(elapsed / total, 1) : 0;
    label = `até ${formatDateShort(habit.goalEndDate)} · ${Math.round(pct * 100)}%`;
  }

  const reached  = pct >= 1;
  const barColor = reached ? colors.green500 : colors.amber;

  return (
    <View style={s.goalBox}>
      <View style={[s.goalTrack, { backgroundColor: colors.surface3 }]}>
        <View style={[s.goalFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: barColor }]} />
      </View>
      <View style={s.goalLabelRow}>
        <Text style={[s.goalLabel, { color: reached ? colors.green500 : colors.textTertiary, fontFamily: typography.fontBody }]}>
          {reached ? '🎯 Meta atingida!' : label}
        </Text>
        {!reached && (
          <Text style={[s.goalPct, { color: colors.textTertiary, fontFamily: typography.fontBodyMedium }]}>
            {Math.round(pct * 100)}%
          </Text>
        )}
      </View>
    </View>
  );
}

export default function HabitCard({ habit, todayLog, streak, onLog, onUndo, onDelete, onRenewGoal, onCompleteGoal, onEdit }: Props) {
  const { colors, typography, radius } = useTheme();
  const isBuild    = habit.type === 'build';
  const iconColor  = isBuild ? colors.green500 : colors.red;
  const iconBg     = isBuild ? colors.green100  : `${colors.red}22`;
  const goalReached = isGoalReached(habit, streak);

  const [expanded, setExpanded] = useState(false);
  const userId     = useOnboardingStore((s) => s.userId);
  const recentLogs = useHabitsStore((s) => s.recentLogs);
  const loadRecentLogs = useHabitsStore((s) => s.loadRecentLogs);
  const completedDates = recentLogs[habit.id];

  function toggleExpand() {
    if (!expanded && completedDates === undefined) {
      loadRecentLogs(habit.id, userId, 28);
    }
    setExpanded((v) => !v);
  }

  function openMenu() {
    const options: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: onDelete },
    ];
    if (onEdit) options.splice(1, 0, { text: 'Editar', onPress: onEdit });
    Alert.alert(habit.name, undefined, options);
  }

  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
      <View style={s.header}>
        <View style={[s.iconBox, { backgroundColor: iconBg, borderRadius: radius.md }]}>
          <MaterialCommunityIcons name={habit.icon as never} size={24} color={iconColor} />
        </View>
        <View style={s.info}>
          <Text style={[s.name, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
            {habit.name}
          </Text>
          <StreakBadge streak={streak} type={habit.type} />
        </View>
        <TouchableOpacity onPress={toggleExpand} hitSlop={8} style={{ marginRight: 4 }}>
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18} color={colors.textTertiary}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={openMenu} hitSlop={8}>
          <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <GoalProgress habit={habit} streak={streak} />

      {goalReached ? (
        <HabitGoalCelebration habit={habit} streak={streak} onRenew={onRenewGoal} onComplete={onCompleteGoal} />
      ) : (
        <HabitCardActions habit={habit} todayLog={todayLog} onLog={onLog} onUndo={onUndo} />
      )}

      {expanded && completedDates !== undefined && (
        <View style={[s.gridDivider, { borderTopColor: colors.border }]}>
          <HabitCheckInGrid completedDates={completedDates} days={28} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card:         { padding: 16, marginBottom: 10, borderWidth: 0.5 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox:      { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  info:         { flex: 1 },
  name:         { fontSize: 15 },
  streakRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  streakTxt:    { fontSize: 12 },
  streakBest:   { fontSize: 12, marginLeft: 4 },
  goalBox:      { marginTop: 12, gap: 4 },
  goalTrack:    { height: 6, borderRadius: 999, overflow: 'hidden' },
  goalFill:     { height: 6, borderRadius: 999 },
  goalLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  goalLabel:    { fontSize: 11 },
  goalPct:      { fontSize: 11 },
  gridDivider:  { marginTop: 12, paddingTop: 12, borderTopWidth: 0.5 },
});
