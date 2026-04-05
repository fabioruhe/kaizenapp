import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { FrequencyType } from '@/types';

interface FrequencyValues {
  frequencyType: FrequencyType;
  dailyTarget: number | null;
  unitLabel: string | null;
  incrementValue: number | null;
}

interface Props extends FrequencyValues {
  onChange(values: Partial<FrequencyValues>): void;
}

export default function HabitFrequencyFields({
  frequencyType, dailyTarget, unitLabel, incrementValue, onChange,
}: Props) {
  const { colors } = useTheme();
  const isMultiple = frequencyType === 'multiple_daily';
  const checksPerDay =
    isMultiple && dailyTarget && incrementValue && incrementValue > 0
      ? Math.ceil(dailyTarget / incrementValue)
      : null;

  return (
    <View style={s.container}>
      <Text style={[s.label, { color: colors.textPrimary }]}>Frequência</Text>

      <View style={s.row}>
        <TouchableOpacity
          style={[s.freqBtn, { backgroundColor: colors.surface, borderColor: colors.border }, !isMultiple && s.freqBtnActive]}
          onPress={() => onChange({ frequencyType: 'once_daily', dailyTarget: null, unitLabel: null, incrementValue: null })}
          activeOpacity={0.8}
        >
          <Text style={[s.freqTxt, { color: colors.textSecondary }, !isMultiple && s.freqTxtActive]}>1x por dia</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.freqBtn, { backgroundColor: colors.surface, borderColor: colors.border }, isMultiple && s.freqBtnActive]}
          onPress={() => onChange({ frequencyType: 'multiple_daily', dailyTarget: dailyTarget ?? 8, unitLabel: unitLabel ?? 'vezes', incrementValue: incrementValue ?? 1 })}
          activeOpacity={0.8}
        >
          <Text style={[s.freqTxt, { color: colors.textSecondary }, isMultiple && s.freqTxtActive]}>Mais de 1x</Text>
        </TouchableOpacity>
      </View>

      {isMultiple && (
        <View style={[s.multiBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.fieldsRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.fieldLabel, { color: colors.textTertiary }]}>Meta diária</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.surface2, color: colors.textPrimary }]}
                keyboardType="numeric"
                value={dailyTarget?.toString() ?? ''}
                onChangeText={(v) => onChange({ dailyTarget: parseInt(v) || null })}
                placeholder="8"
                placeholderTextColor="#6b7280"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.fieldLabel, { color: colors.textTertiary }]}>Unidade</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.surface2, color: colors.textPrimary }]}
                value={unitLabel ?? ''}
                onChangeText={(v) => onChange({ unitLabel: v })}
                placeholder="copos"
                placeholderTextColor="#6b7280"
              />
            </View>
          </View>

          <View>
            <Text style={[s.fieldLabel, { color: colors.textTertiary }]}>Valor por check</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.surface2, color: colors.textPrimary }]}
              keyboardType="numeric"
              value={incrementValue?.toString() ?? ''}
              onChangeText={(v) => onChange({ incrementValue: parseInt(v) || null })}
              placeholder="1"
              placeholderTextColor="#6b7280"
            />
          </View>

          {checksPerDay !== null && (
            <Text style={s.hint}>
              Você precisará de {checksPerDay} check{checksPerDay !== 1 ? 's' : ''} por dia
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:      { marginBottom: 16 },
  label:          { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  row:            { flexDirection: 'row', gap: 12, marginBottom: 16 },
  freqBtn:        { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  freqBtnActive:  { backgroundColor: 'rgba(250,204,21,0.1)', borderColor: '#facc15' },
  freqTxt:        { fontSize: 14, fontWeight: '600' },
  freqTxtActive:  { color: '#facc15' },
  multiBox:       { borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
  fieldsRow:      { flexDirection: 'row', gap: 12 },
  fieldLabel:     { fontSize: 12, marginBottom: 4 },
  input:          { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15 },
  hint:           { color: 'rgba(250,204,21,0.8)', fontSize: 12, textAlign: 'center' },
});
