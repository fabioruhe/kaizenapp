import { View, Text, TouchableOpacity, Platform, Modal, StyleSheet } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { fromDateString, toDateString, formatDatePT } from '@/utils/dateHelpers';

interface Props {
  label: string;
  value: string;   // YYYY-MM-DD
  onChange(date: string): void;
  minimumDate?: string;
}

export default function DatePicker({ label, value, onChange, minimumDate }: Props) {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const date = fromDateString(value);
  const minDate = minimumDate ? fromDateString(minimumDate) : undefined;

  function handleAndroidChange(_: unknown, selected?: Date) {
    setShowPicker(false);
    if (selected) onChange(toDateString(selected));
  }

  function handleIOSChange(_: unknown, selected?: Date) {
    if (selected) setTempDate(toDateString(selected));
  }

  function handleIOSOpen() {
    setTempDate(value);
    setShowPicker(true);
  }

  function handleIOSConfirm() {
    onChange(tempDate);
    setShowPicker(false);
  }

  function handleIOSCancel() {
    setShowPicker(false);
  }

  return (
    <View style={s.container}>
      {label ? <Text style={[s.label, { color: colors.textPrimary }]}>{label}</Text> : null}

      <TouchableOpacity
        style={[s.trigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={Platform.OS === 'ios' ? handleIOSOpen : () => setShowPicker(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="calendar" size={20} color="#facc15" />
        <Text style={[s.triggerTxt, { color: colors.textPrimary }]}>{formatDatePT(value)}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {Platform.OS === 'android' && showPicker && (
        <RNDateTimePicker
          mode="date"
          value={date}
          minimumDate={minDate}
          onChange={handleAndroidChange}
          display="default"
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} transparent animationType="slide">
          <View style={s.modalOverlay}>
            <View style={[s.modalSheet, { backgroundColor: colors.surface }]}>
              <View style={s.modalHeader}>
                <TouchableOpacity onPress={handleIOSCancel}>
                  <Text style={[s.cancelTxt, { color: colors.textTertiary }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleIOSConfirm}>
                  <Text style={s.confirmTxt}>OK</Text>
                </TouchableOpacity>
              </View>
              <RNDateTimePicker
                mode="date"
                value={fromDateString(tempDate)}
                minimumDate={minDate}
                onChange={handleIOSChange}
                display="spinner"
                textColor={colors.textPrimary}
                locale="pt-BR"
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:    { marginBottom: 16 },
  label:        { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  trigger:      { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  triggerTxt:   { flex: 1 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet:   { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cancelTxt:    { fontSize: 16 },
  confirmTxt:   { color: '#facc15', fontWeight: '600', fontSize: 16 },
});
