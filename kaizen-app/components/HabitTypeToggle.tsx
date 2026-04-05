import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import type { HabitType } from '@/types';

interface Props {
  value: HabitType;
  onChange(type: HabitType): void;
}

export default function HabitTypeToggle({ value, onChange }: Props) {
  const { colors } = useTheme();
  const buildActive = value === 'build';
  const quitActive  = value === 'quit';

  return (
    <View style={s.container}>
      <Text style={[s.label, { color: colors.textPrimary }]}>Tipo</Text>
      <View style={s.row}>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: colors.surface, borderColor: colors.border }, buildActive && s.btnBuild]}
          onPress={() => onChange('build')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="trending-up" size={18} color={buildActive ? '#22c55e' : '#6b7280'} />
          <Text style={[s.btnTxt, { color: colors.textSecondary }, buildActive && s.btnTxtBuild]}>CONSTRUIR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, { backgroundColor: colors.surface, borderColor: colors.border }, quitActive && s.btnQuit]}
          onPress={() => onChange('quit')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="trending-down" size={18} color={quitActive ? '#ef4444' : '#6b7280'} />
          <Text style={[s.btnTxt, { color: colors.textSecondary }, quitActive && s.btnTxtQuit]}>ELIMINAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { marginBottom: 16 },
  label:      { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  row:        { flexDirection: 'row', gap: 12 },
  btn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  btnBuild:   { backgroundColor: 'rgba(21,128,61,0.13)', borderColor: '#22c55e' },
  btnQuit:    { backgroundColor: 'rgba(185,28,28,0.13)', borderColor: '#ef4444' },
  btnTxt:     { fontWeight: '600', fontSize: 14 },
  btnTxtBuild:{ color: '#4ade80' },
  btnTxtQuit: { color: '#f87171' },
});
