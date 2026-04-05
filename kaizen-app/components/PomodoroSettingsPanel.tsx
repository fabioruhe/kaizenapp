import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { PomodoroSettings } from '@/types';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  settings: PomodoroSettings;
  onSave(s: PomodoroSettings): void;
}

const DEFAULT: PomodoroSettings = {
  focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLongBreak: 4,
};

interface Field { key: keyof PomodoroSettings; label: string; min: number; max: number }
const FIELDS: Field[] = [
  { key: 'focusMinutes',          label: 'Foco (min)',             min: 1, max: 120 },
  { key: 'shortBreakMinutes',     label: 'Pausa curta (min)',      min: 1, max: 30  },
  { key: 'longBreakMinutes',      label: 'Pausa longa (min)',      min: 1, max: 60  },
  { key: 'cyclesBeforeLongBreak', label: 'Ciclos até pausa longa', min: 1, max: 10  },
];

export default function PomodoroSettingsPanel({ settings, onSave }: Props) {
  const { colors, typography, radius } = useTheme();
  const [draft, setDraft] = useState<PomodoroSettings>(settings);

  function patch(key: keyof PomodoroSettings, raw: string) {
    const n = parseInt(raw, 10);
    if (isNaN(n)) return;
    const field = FIELDS.find((f) => f.key === key)!;
    setDraft((d) => ({ ...d, [key]: Math.min(field.max, Math.max(field.min, n)) }));
  }

  return (
    <View style={[s.container, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
      {FIELDS.map((f) => (
        <View key={f.key} style={[s.row, { borderBottomColor: colors.border }]}>
          <Text style={[s.label, { color: colors.textSecondary, fontFamily: typography.fontBodyMedium }]}>
            {f.label}
          </Text>
          <TextInput
            style={[s.input, {
              backgroundColor: colors.surface2,
              color: colors.textPrimary,
              borderColor: colors.border,
              borderRadius: radius.sm,
              fontFamily: typography.fontBodyBold,
            }]}
            value={String(draft[f.key])}
            onChangeText={(v) => patch(f.key, v)}
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>
      ))}

      <View style={s.actions}>
        <TouchableOpacity
          style={[s.resetBtn, { backgroundColor: colors.surface2, borderRadius: radius.md }]}
          onPress={() => setDraft(DEFAULT)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="refresh" size={16} color={colors.textTertiary} />
          <Text style={[s.resetTxt, { color: colors.textSecondary, fontFamily: typography.fontBodyMedium }]}>
            Restaurar padrão
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: colors.blue500, borderRadius: radius.md }]}
          onPress={() => onSave(draft)}
          activeOpacity={0.85}
        >
          <Text style={[s.saveTxt, { fontFamily: typography.fontBodyBold }]}>Aplicar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { padding: 16, marginTop: 12, borderWidth: 0.5 },
  row:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5 },
  label:     { flex: 1, fontSize: 14 },
  input:     { paddingHorizontal: 12, paddingVertical: 6, fontSize: 15, width: 64, textAlign: 'center', borderWidth: 0.5 },
  actions:   { flexDirection: 'row', gap: 10, marginTop: 14 },
  resetBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  resetTxt:  { fontSize: 13 },
  saveBtn:   { flex: 1, paddingVertical: 10, alignItems: 'center' },
  saveTxt:   { color: '#fff', fontSize: 14 },
});
