import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface Bar {
  label: string;
  value: number;
}

interface Props {
  data: Bar[];
  color: string;
  maxValue?: number;
  unit?: string;
  height?: number;
}

export default function SimpleBarChart({ data, color, maxValue, unit = '', height = 100 }: Props) {
  const { colors, typography } = useTheme();
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={s.container}>
      <View style={[s.chart, { height }]}>
        {data.map((bar, i) => {
          const pct = max > 0 ? bar.value / max : 0;
          return (
            <View key={i} style={s.barCol}>
              <View style={[s.barTrack, { height }]}>
                <View
                  style={[
                    s.barFill,
                    {
                      height: `${Math.max(pct * 100, bar.value > 0 ? 4 : 0)}%`,
                      backgroundColor: pct > 0 ? color : colors.surface3,
                      borderRadius: 4,
                    },
                  ]}
                />
              </View>
              {bar.value > 0 && (
                <Text style={[s.valueLabel, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                  {bar.value}{unit}
                </Text>
              )}
            </View>
          );
        })}
      </View>
      <View style={s.labels}>
        {data.map((bar, i) => (
          <Text key={i} style={[s.label, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
            {bar.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 4 },
  chart:     { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barCol:    { flex: 1, alignItems: 'center', gap: 3 },
  barTrack:  { width: '100%', justifyContent: 'flex-end' },
  barFill:   { width: '100%' },
  valueLabel:{ fontSize: 9 },
  labels:    { flexDirection: 'row', gap: 4 },
  label:     { flex: 1, textAlign: 'center', fontSize: 10 },
});
