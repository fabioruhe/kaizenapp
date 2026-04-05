import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useTheme } from '@/hooks/useTheme';

type Mode = 'light' | 'dark' | 'system';

const OPTIONS: { value: Mode; icon: string; label: string }[] = [
  { value: 'light',  icon: 'weather-sunny', label: 'Claro'   },
  { value: 'dark',   icon: 'weather-night', label: 'Escuro'  },
  { value: 'system', icon: 'cellphone',      label: 'Sistema' },
];

export default function AppearanceScreen() {
  const { colors, typography, radius } = useTheme();
  const router            = useRouter();
  const preferences       = useOnboardingStore((s) => s.preferences);
  const setAppearanceMode = useOnboardingStore((s) => s.setAppearanceMode);

  // TODO: aplicar tema via ThemeProvider na Fase 2
  // Por ora apenas persiste a escolha no AsyncStorage

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ marginRight: 12 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>Aparência</Text>
      </View>

      <View style={s.section}>
        <Text style={[s.sectionLabel, { color: colors.textTertiary, fontFamily: typography.fontBodyBold }]}>Tema</Text>
        <View style={s.grid}>
          {OPTIONS.map((opt) => {
            const active = preferences.appearanceMode === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  s.card,
                  { borderRadius: radius.lg },
                  active
                    ? { backgroundColor: colors.blue100, borderColor: colors.blue500, borderWidth: 1.5 }
                    : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.5 },
                ]}
                onPress={() => setAppearanceMode(opt.value)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={opt.icon as any}
                  size={28}
                  color={active ? colors.blue500 : colors.textTertiary}
                />
                <Text style={[
                  s.cardLabel,
                  { fontFamily: typography.fontBodyMedium },
                  { color: active ? colors.blue500 : colors.textTertiary },
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[s.note, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
          O tema será aplicado em uma atualização futura.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  title:       { fontSize: 17, flex: 1 },
  section:     { paddingHorizontal: 16, marginTop: 24 },
  sectionLabel:{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  grid:        { flexDirection: 'row', gap: 10 },
  card:        { flex: 1, paddingVertical: 20, alignItems: 'center', gap: 8 },
  cardLabel:   { fontSize: 13 },
  note:        { fontSize: 12, textAlign: 'center', marginTop: 16 },
});
