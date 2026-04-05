import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import type { PomodoroPhase } from '@/types';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  phase: PomodoroPhase;
  secondsRemaining: number;
  totalSeconds: number;
  currentCycle: number;
  cyclesBeforeLongBreak: number;
}

const PHASE_LABEL: Record<PomodoroPhase, string> = {
  idle: '', focus: 'FOCO', short_break: 'PAUSA CURTA', long_break: 'PAUSA LONGA', done: '',
};

function pad(n: number) { return String(n).padStart(2, '0'); }
function formatTime(seconds: number) {
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

export default function PomodoroTimer({ phase, secondsRemaining, totalSeconds, currentCycle, cyclesBeforeLongBreak }: Props) {
  const { colors, typography } = useTheme();

  const PHASE_COLOR: Record<PomodoroPhase, string> = {
    idle:        colors.blue500,
    focus:       colors.blue500,
    short_break: colors.green500,
    long_break:  colors.purple500,
    done:        colors.green500,
  };

  const pct   = totalSeconds > 0 ? secondsRemaining / totalSeconds : 1;
  const color = PHASE_COLOR[phase];
  const dots  = Array.from({ length: cyclesBeforeLongBreak }).map((_, i) => i < currentCycle);

  const arcStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(color, { duration: 300 }),
    opacity:     withTiming(0.4 + pct * 0.6, { duration: 300 }),
  }));

  return (
    <View style={s.container}>
      <Animated.View style={[s.circle, arcStyle, { borderColor: color, backgroundColor: colors.surface2 }]}>
        <Text style={[s.label, { color: colors.textTertiary, fontFamily: typography.fontBodyBold }]}>
          {PHASE_LABEL[phase]}
        </Text>
        <Text style={[s.time, { color, fontFamily: typography.fontDisplayBold }]}>
          {formatTime(secondsRemaining)}
        </Text>
      </Animated.View>

      <View style={s.dots}>
        {dots.map((done, i) => (
          <View key={i} style={[s.dot, { backgroundColor: done ? color : colors.surface3 }]} />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 24 },
  circle:    { width: 220, height: 220, borderRadius: 110, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  label:     { fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  time:      { fontSize: 52, fontVariant: ['tabular-nums'] },
  dots:      { flexDirection: 'row', gap: 10, marginTop: 20 },
  dot:       { width: 10, height: 10, borderRadius: 5 },
});
