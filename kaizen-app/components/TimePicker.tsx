import { View, Text, TouchableOpacity, Platform, Modal, StyleSheet } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  label?: string;
  value: string;         // "HH:MM"
  onChange(time: string): void;
}

function timeToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

function dateToTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function TimePicker({ label, value, onChange }: Props) {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [tempTime, setTempTime]     = useState(value);

  function handleAndroidChange(_: unknown, selected?: Date) {
    setShowPicker(false);
    if (selected) onChange(dateToTime(selected));
  }

  function handleIOSChange(_: unknown, selected?: Date) {
    if (selected) setTempTime(dateToTime(selected));
  }

  function handleIOSOpen() {
    setTempTime(value);
    setShowPicker(true);
  }

  function handleIOSConfirm() {
    onChange(tempTime);
    setShowPicker(false);
  }

  return (
    <View style={s.container}>
      {label ? <Text style={[s.label, { color: colors.textTertiary }]}>{label}</Text> : null}

      <TouchableOpacity
        style={[s.trigger, { backgroundColor: colors.surface2, borderColor: colors.border }]}
        onPress={Platform.OS === 'ios' ? handleIOSOpen : () => setShowPicker(true)}
        activeOpacity={0.8}
      >
        <Text style={[s.time, { color: colors.textPrimary }]}>{value}</Text>
      </TouchableOpacity>

      {Platform.OS === 'android' && showPicker && (
        <RNDateTimePicker
          mode="time"
          value={timeToDate(value)}
          onChange={handleAndroidChange}
          display="default"
          is24Hour
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} transparent animationType="slide">
          <View style={s.overlay}>
            <View style={[s.sheet, { backgroundColor: colors.surface }]}>
              <View style={s.header}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={[s.cancelTxt, { color: colors.textTertiary }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleIOSConfirm}>
                  <Text style={s.confirmTxt}>OK</Text>
                </TouchableOpacity>
              </View>
              <RNDateTimePicker
                mode="time"
                value={timeToDate(tempTime)}
                onChange={handleIOSChange}
                display="spinner"
                textColor={colors.textPrimary}
                locale="pt-BR"
                is24Hour
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1 },
  label:      { fontSize: 12, marginBottom: 6 },
  trigger:    { borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  time:       { fontSize: 16, fontWeight: '600' },
  overlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cancelTxt:  { fontSize: 16 },
  confirmTxt: { color: '#facc15', fontWeight: '600', fontSize: 16 },
});
