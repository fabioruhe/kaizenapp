import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  progress: number;
  target: number;
  unitLabel?: string | null;
  /** 'habits' | 'tasks' | 'pomodoro' | 'goal' — determina a cor do fill */
  variant?: 'habits' | 'tasks' | 'pomodoro' | 'goal';
  /** Cor customizada — sobrepõe variant */
  color?: string;
}

export default function ProgressBar({ progress, target, unitLabel, variant = 'habits', color }: Props) {
  const { colors, typography } = useTheme();
  const pct = target > 0 ? Math.min(progress / target, 1) : 0;

  const VARIANT_COLOR: Record<string, string> = {
    habits:   colors.green500,
    tasks:    colors.blue500,
    pomodoro: colors.purple500,
    goal:     colors.amber,
  };

  const fillColor = color ?? VARIANT_COLOR[variant];

  return (
    <View style={s.container}>
      <View style={[s.track, { backgroundColor: colors.surface3 }]}>
        <View style={[s.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: fillColor }]} />
      </View>
      <View style={s.labels}>
        <Text style={[s.labelTxt, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
          {progress}{unitLabel ? ` ${unitLabel}` : ''}
        </Text>
        <Text style={[s.labelTxt, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
          meta: {target}{unitLabel ? ` ${unitLabel}` : ''}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { width: '100%' },
  track:     { height: 6, borderRadius: 999, overflow: 'hidden' },
  fill:      { height: 6, borderRadius: 999 },
  labels:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  labelTxt:  { fontSize: 12 },
});
