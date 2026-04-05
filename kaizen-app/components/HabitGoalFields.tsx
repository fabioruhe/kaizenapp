import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import DatePicker from './DatePicker';
import type { GoalType } from '@/types';
import { shiftDays, todayString } from '@/utils/dateHelpers';

interface GoalValues {
  goalType: GoalType;
  goalTargetDays: number | null;
  goalEndDate: string | null;
}

interface Props extends GoalValues {
  onChange(values: Partial<GoalValues>): void;
}

const QUICK_DAYS = [21, 66, 90];

const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'days',       label: 'Dias' },
  { value: 'date_range', label: 'Período' },
  { value: 'forever',    label: 'Para sempre' },
];

export default function HabitGoalFields({ goalType, goalTargetDays, goalEndDate, onChange }: Props) {
  const { colors } = useTheme();
  const tomorrow = shiftDays(todayString(), 1);

  return (
    <View style={s.container}>
      <Text style={[s.label, { color: colors.textPrimary }]}>Meta</Text>

      {/* Segmented control */}
      <View style={s.segRow}>
        {GOAL_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[s.segBtn, { backgroundColor: colors.surface, borderColor: colors.border }, goalType === opt.value && s.segBtnActive]}
            onPress={() => onChange({ goalType: opt.value })}
            activeOpacity={0.8}
          >
            <Text style={[s.segTxt, { color: colors.textSecondary }, goalType === opt.value && s.segTxtActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Dias */}
      {goalType === 'days' && (
        <View style={s.daysBox}>
          <TextInput
            style={[s.input, { backgroundColor: colors.surface2, color: colors.textPrimary, borderColor: colors.border }]}
            keyboardType="numeric"
            value={goalTargetDays?.toString() ?? ''}
            onChangeText={(v) => onChange({ goalTargetDays: parseInt(v) || null })}
            placeholder="Quantos dias?"
            placeholderTextColor="#6b7280"
          />
          <View style={s.quickRow}>
            {QUICK_DAYS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[s.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }, goalTargetDays === d && s.quickBtnActive]}
                onPress={() => onChange({ goalTargetDays: d })}
                activeOpacity={0.8}
              >
                <Text style={[s.quickTxt, { color: colors.textSecondary }, goalTargetDays === d && s.quickTxtActive]}>
                  {d} dias
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Período */}
      {goalType === 'date_range' && (
        <DatePicker
          label="Data de término"
          value={goalEndDate ?? tomorrow}
          minimumDate={tomorrow}
          onChange={(d) => onChange({ goalEndDate: d })}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:     { marginBottom: 16 },
  label:         { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  segRow:        { flexDirection: 'row', gap: 8, marginBottom: 12 },
  segBtn:        { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  segBtnActive:  { backgroundColor: 'rgba(250,204,21,0.1)', borderColor: '#facc15' },
  segTxt:        { fontSize: 12, fontWeight: '600' },
  segTxtActive:  { color: '#facc15' },
  daysBox:       { gap: 10 },
  input:         { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, textAlign: 'center', borderWidth: 1 },
  quickRow:      { flexDirection: 'row', gap: 8 },
  quickBtn:      { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  quickBtnActive:{ backgroundColor: 'rgba(250,204,21,0.1)', borderColor: '#facc15' },
  quickTxt:      { fontSize: 13 },
  quickTxtActive:{ color: '#facc15' },
});
