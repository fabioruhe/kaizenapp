import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import IconPickerModal from './IconPickerModal';

interface Props {
  value: string;
  onChange(icon: string): void;
  color?: string;
  label?: string;
}

export default function IconPicker({ value, onChange, color = '#facc15', label = 'Ícone' }: Props) {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <View style={s.container}>
        {label ? <Text style={[s.label, { color: colors.textPrimary }]}>{label}</Text> : null}

        <TouchableOpacity
          style={[s.trigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={[s.iconBox, { backgroundColor: `${color}22` }]}>
            <MaterialCommunityIcons name={value as never} size={24} color={color} />
          </View>
          <Text style={[s.iconName, { color: colors.textSecondary }]}>{value}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <IconPickerModal
        visible={modalVisible}
        selected={value}
        onSelect={onChange}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: 16 },
  label:     { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  trigger:   { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  iconBox:   { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  iconName:  { flex: 1, fontSize: 14 },
});
