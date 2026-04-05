import { View, Text, Switch, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useTheme } from '@/hooks/useTheme';

export default function SoundsScreen() {
  const { colors, typography, radius } = useTheme();
  const router                  = useRouter();
  const preferences             = useOnboardingStore((s) => s.preferences);
  const setSoundEnabled         = useOnboardingStore((s) => s.setSoundEnabled);
  const setPomodoroSoundEnabled = useOnboardingStore((s) => s.setPomodoroSoundEnabled);

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ marginRight: 12 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>Sons</Text>
      </View>

      <View style={s.section}>
        <View style={[s.row, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
          <View style={s.rowLeft}>
            <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.textSecondary} />
            <View>
              <Text style={[s.rowLabel, { color: colors.textPrimary, fontFamily: typography.fontBodyMedium }]}>
                Sons do app
              </Text>
              <Text style={[s.rowDesc, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                Toca ao concluir hábitos e tarefas
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: colors.surface3, true: colors.blue500 }}
            thumbColor="#fff"
          />
        </View>

        <View style={[s.row, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
          <View style={s.rowLeft}>
            <MaterialCommunityIcons name="timer-outline" size={20} color={colors.textSecondary} />
            <View>
              <Text style={[s.rowLabel, { color: colors.textPrimary, fontFamily: typography.fontBodyMedium }]}>
                Sons do Pomodoro
              </Text>
              <Text style={[s.rowDesc, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                Toca ao fim de cada ciclo
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.pomodoroSoundEnabled}
            onValueChange={setPomodoroSoundEnabled}
            trackColor={{ false: colors.surface3, true: colors.blue500 }}
            thumbColor="#fff"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:   { flex: 1 },
  header:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  title:    { fontSize: 17, flex: 1 },
  section:  { paddingHorizontal: 16, marginTop: 24, gap: 8 },
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 0.5, padding: 16 },
  rowLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 15 },
  rowDesc:  { fontSize: 12, marginTop: 2 },
});
