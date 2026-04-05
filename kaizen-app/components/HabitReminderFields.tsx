import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import TimePicker from './TimePicker';
import type { ReminderMode, FrequencyType } from '@/types';
import { describeReminder } from '@/utils/reminderHelpers';

interface ReminderValues {
  reminderEnabled: boolean;
  reminderMode: ReminderMode | null;
  reminderFixedTime: string | null;
  reminderIntervalHours: number | null;
  reminderIntervalStart: string | null;
  reminderIntervalEnd: string | null;
}

interface Props extends ReminderValues {
  frequencyType: FrequencyType;
  notificationAllowed: boolean;
  onChange(values: Partial<ReminderValues>): void;
}

const ALL_MODES: { value: ReminderMode; label: string }[] = [
  { value: 'fixed_time', label: 'Horário fixo' },
  { value: 'interval',   label: 'Intervalo' },
  { value: 'both',       label: 'Ambos' },
];

export default function HabitReminderFields({
  reminderEnabled, reminderMode, reminderFixedTime,
  reminderIntervalHours, reminderIntervalStart, reminderIntervalEnd,
  frequencyType, notificationAllowed, onChange,
}: Props) {
  const { colors } = useTheme();

  // Etapa 15: se permissão negada, oculta silenciosamente a seção
  if (!notificationAllowed) return null;
  const isMultiple   = frequencyType === 'multiple_daily';
  const modes        = isMultiple ? ALL_MODES : ALL_MODES.slice(0, 1);
  const showFixed    = reminderEnabled && (reminderMode === 'fixed_time' || reminderMode === 'both');
  const showInterval = reminderEnabled && isMultiple && (reminderMode === 'interval' || reminderMode === 'both');

  const preview = describeReminder({
    reminderEnabled, reminderMode, reminderFixedTime,
    reminderIntervalHours, reminderIntervalStart, reminderIntervalEnd,
  });

  function handleToggle() {
    if (reminderEnabled) {
      onChange({ reminderEnabled: false, reminderMode: null });
    } else {
      onChange({ reminderEnabled: true, reminderMode: 'fixed_time', reminderFixedTime: reminderFixedTime ?? '07:00' });
    }
  }

  return (
    <View style={s.container}>
      {/* Toggle row */}
      <TouchableOpacity style={[s.toggleRow, { backgroundColor: colors.surface, borderColor: colors.surface2 }]} onPress={handleToggle} activeOpacity={0.8}>
        <View style={s.toggleLeft}>
          <MaterialCommunityIcons name="bell" size={18} color={reminderEnabled ? '#facc15' : '#6b7280'} />
          <Text style={[s.toggleTxt, { color: reminderEnabled ? colors.textPrimary : colors.textSecondary }]}>Receber lembretes</Text>
        </View>
        <View style={[s.pill, { backgroundColor: colors.surface3 }, reminderEnabled && s.pillOn]}>
          <View style={[s.dot, { backgroundColor: colors.textSecondary }, reminderEnabled && s.dotOn]} />
        </View>
      </TouchableOpacity>

      {reminderEnabled && (
        <View style={s.body}>
          {/* Modo */}
          <View style={s.modeRow}>
            {modes.map((m) => (
              <TouchableOpacity
                key={m.value}
                style={[s.modeBtn, { backgroundColor: colors.surface, borderColor: colors.border }, reminderMode === m.value && s.modeBtnActive]}
                onPress={() => onChange({ reminderMode: m.value })}
                activeOpacity={0.8}
              >
                <Text style={[s.modeTxt, { color: colors.textSecondary }, reminderMode === m.value && s.modeTxtActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Horário fixo */}
          {showFixed && (
            <View style={[s.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.groupLabel, { color: colors.textTertiary }]}>Horário do lembrete</Text>
              <TimePicker value={reminderFixedTime ?? '07:00'} onChange={(t) => onChange({ reminderFixedTime: t })} />
            </View>
          )}

          {/* Intervalo */}
          {showInterval && (
            <View style={[s.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.groupLabel, { color: colors.textTertiary }]}>A cada quantas horas?</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.surface2, color: colors.textPrimary, borderColor: colors.border }]}
                keyboardType="numeric"
                value={reminderIntervalHours?.toString() ?? ''}
                onChangeText={(v) => onChange({ reminderIntervalHours: parseInt(v) || null })}
                placeholder="Ex: 4"
                placeholderTextColor="#6b7280"
              />
              <Text style={[s.groupLabel, { marginTop: 12, color: colors.textTertiary }]}>Janela de horário</Text>
              <View style={s.timeRow}>
                <TimePicker label="Das" value={reminderIntervalStart ?? '08:00'} onChange={(t) => onChange({ reminderIntervalStart: t })} />
                <TimePicker label="Até" value={reminderIntervalEnd ?? '22:00'} onChange={(t) => onChange({ reminderIntervalEnd: t })} />
              </View>
            </View>
          )}

          {/* Preview */}
          {preview ? (
            <View style={s.preview}>
              <MaterialCommunityIcons name="information-outline" size={14} color="#facc15" />
              <Text style={s.previewTxt}>{preview}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:    { marginBottom: 16 },
  toggleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, padding: 16, borderWidth: 1 },
  toggleLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleTxt:    { fontSize: 15, fontWeight: '500' },
  pill:         { width: 44, height: 24, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 2 },
  pillOn:       { backgroundColor: '#facc15' },
  dot:          { width: 20, height: 20, borderRadius: 10 },
  dotOn:        { backgroundColor: '#000000', alignSelf: 'flex-end' },
  body:         { marginTop: 10, gap: 10 },
  modeRow:      { flexDirection: 'row', gap: 8 },
  modeBtn:      { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  modeBtnActive:{ backgroundColor: 'rgba(250,204,21,0.1)', borderColor: '#facc15' },
  modeTxt:      { fontSize: 13, fontWeight: '600' },
  modeTxtActive:{ color: '#facc15' },
  group:        { borderRadius: 12, padding: 12, borderWidth: 1, gap: 6 },
  groupLabel:   { fontSize: 12 },
  input:        { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, borderWidth: 1 },
  timeRow:      { flexDirection: 'row', gap: 12 },
  preview:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(250,204,21,0.08)', borderRadius: 8, padding: 10 },
  previewTxt:   { color: '#facc15', fontSize: 13, flex: 1 },
});
