import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProgressBar from './ProgressBar';
import type { Habit, HabitLog } from '@/types';

interface Props {
  habit: Habit;
  todayLog: HabitLog | null;
  onLog(): void;
  onUndo(): void;
}

// ─── once_daily (build) ───────────────────────────────────────────────────────

function OnceDailyBuildActions({ todayLog, onLog, onUndo }: Omit<Props, 'habit'>) {
  const done = !!todayLog?.completedAt;
  return (
    <View style={s.actRow}>
      <TouchableOpacity
        style={[s.actBtn, done ? s.actBtnGreenDone : s.actBtnGreen]}
        onPress={done ? onUndo : onLog}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={done ? 'check-circle' : 'circle-outline'}
          size={20}
          color={done ? '#22c55e' : '#fff'}
        />
        <Text style={[s.actTxt, done ? s.actTxtGreen : s.actTxtWhite]}>
          {done ? 'Concluído' : 'Marcar como feito'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── once_daily (quit) ────────────────────────────────────────────────────────

function QuitActions({ todayLog, onLog, onUndo }: Omit<Props, 'habit'>) {
  const done = !!todayLog?.completedAt;
  return (
    <View style={s.actRow}>
      <TouchableOpacity
        style={[s.actBtn, done ? s.actBtnRedDone : s.actBtnRed]}
        onPress={done ? onUndo : onLog}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={done ? 'shield-check' : 'shield-outline'}
          size={20}
          color={done ? '#ef4444' : '#fff'}
        />
        <Text style={[s.actTxt, done ? s.actTxtRed : s.actTxtWhite]}>
          {done ? 'Resistiu hoje!' : 'Não recaí hoje'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── multiple_daily ───────────────────────────────────────────────────────────

function MultipleDailyActions({ habit, todayLog, onLog }: Omit<Props, 'onUndo'>) {
  const progress = todayLog?.progress ?? 0;
  const target = habit.dailyTarget ?? 1;
  const done = !!todayLog?.completedAt;

  return (
    <View style={s.multiContainer}>
      <ProgressBar
        progress={progress}
        target={target}
        unitLabel={habit.unitLabel}
        color={done ? '#22c55e' : '#facc15'}
      />
      <TouchableOpacity
        style={[s.actBtn, done ? s.actBtnGreenDone : s.actBtnYellow]}
        onPress={onLog}
        disabled={done}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={done ? 'check-all' : 'plus'}
          size={20}
          color={done ? '#22c55e' : '#000'}
        />
        <Text style={[s.actTxt, done ? s.actTxtGreen : s.actTxtBlack]}>
          {done ? 'Meta atingida!' : `+${habit.incrementValue ?? 1} ${habit.unitLabel ?? ''}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────

export default function HabitCardActions({ habit, todayLog, onLog, onUndo }: Props) {
  if (habit.type === 'quit') {
    return <QuitActions todayLog={todayLog} onLog={onLog} onUndo={onUndo} />;
  }
  if (habit.frequencyType === 'multiple_daily') {
    return <MultipleDailyActions habit={habit} todayLog={todayLog} onLog={onLog} />;
  }
  return <OnceDailyBuildActions todayLog={todayLog} onLog={onLog} onUndo={onUndo} />;
}

const s = StyleSheet.create({
  actRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  multiContainer: { marginTop: 12, gap: 8 },
  actBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12 },
  actBtnGreen:    { backgroundColor: '#16a34a' },
  actBtnGreenDone:{ backgroundColor: 'rgba(34,197,94,0.15)' },
  actBtnRed:      { backgroundColor: '#dc2626' },
  actBtnRedDone:  { backgroundColor: 'rgba(239,68,68,0.15)' },
  actBtnYellow:   { backgroundColor: '#facc15' },
  actTxt:         { fontSize: 14, fontWeight: '600' },
  actTxtWhite:    { color: '#ffffff' },
  actTxtBlack:    { color: '#000000' },
  actTxtGreen:    { color: '#22c55e' },
  actTxtRed:      { color: '#ef4444' },
});
