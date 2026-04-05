import { View, Text, TouchableOpacity, Switch, SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useTheme } from '@/hooks/useTheme';

export default function SettingsScreen() {
  const router          = useRouter();
  const { colors }      = useTheme();
  const preferences     = useOnboardingStore((s) => s.preferences);
  const setSoundEnabled = useOnboardingStore((s) => s.setSoundEnabled);

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ marginRight: 12 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary }]}>Configurações</Text>
      </View>

      <View style={s.section}>
        <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>Áudio</Text>

        <View style={[s.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.rowLeft}>
            <MaterialCommunityIcons name="volume-high" size={20} color={colors.textSecondary} />
            <Text style={[s.rowLabel, { color: colors.textPrimary }]}>Sons de conclusão</Text>
          </View>
          <Switch
            value={preferences.soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: colors.surface3, true: colors.amber }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={s.section}>
        <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>Tarefas</Text>

        <TouchableOpacity style={[s.row, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push('/(tabs)/tasks/categories' as any)} activeOpacity={0.8}>
          <View style={s.rowLeft}>
            <MaterialCommunityIcons name="tag-multiple" size={20} color={colors.textSecondary} />
            <Text style={[s.rowLabel, { color: colors.textPrimary }]}>Gerenciar categorias</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:       { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  title:        { fontSize: 17, fontWeight: '600', flex: 1 },
  section:      { paddingHorizontal: 16, marginTop: 24 },
  sectionLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600', marginBottom: 8 },
  row:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1 },
  rowLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel:     { fontSize: 15 },
});
