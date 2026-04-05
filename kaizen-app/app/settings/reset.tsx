import {
  View, Text, TouchableOpacity, SafeAreaView,
  Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { db } from '@/db/client';
import { habits, habitLogs, tasks, subTasks, taskCategories, pomodoroSessions } from '@/db/schema';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useTheme } from '@/hooks/useTheme';

interface Counts {
  habits: number; logs: number; tasks: number;
  subs: number; categories: number; sessions: number;
}

async function fetchCounts(): Promise<Counts> {
  const [h, l, t, st, tc, ps] = await Promise.all([
    db.select().from(habits),
    db.select().from(habitLogs),
    db.select().from(tasks),
    db.select().from(subTasks),
    db.select().from(taskCategories),
    db.select().from(pomodoroSessions),
  ]);
  return { habits: h.length, logs: l.length, tasks: t.length, subs: st.length, categories: tc.length, sessions: ps.length };
}

export default function ResetScreen() {
  const { colors, typography, radius } = useTheme();
  const router     = useRouter();
  const resetPrefs = useOnboardingStore((s) => s.resetPreferences);
  const [counts, setCounts]       = useState<Counts | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => { fetchCounts().then(setCounts); }, []);

  async function handleReset() {
    setResetting(true);
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      // ⚠ DELETE FÍSICO — única exceção à regra de soft delete. Reset intencional do usuário.
      // Ordem: dependentes primeiro para não violar FK constraints
      await db.delete(subTasks);
      await db.delete(habitLogs);
      await db.delete(pomodoroSessions);
      await db.delete(habits);
      await db.delete(tasks);
      await db.delete(taskCategories);

      await resetPrefs();
      router.replace('/(onboarding)' as any);
    } catch {
      setResetting(false);
      Alert.alert('Erro', 'Não foi possível resetar. Tente novamente.');
    }
  }

  function confirmReset() {
    Alert.alert(
      'Tem absoluta certeza?',
      'Todos os seus dados serão apagados. Esta ação é irreversível.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sim, apagar tudo', style: 'destructive', onPress: handleReset },
      ],
    );
  }

  const DATA_ITEMS = counts ? [
    ['lightning-bolt',          `${counts.habits} hábitos cadastrados`     ],
    ['calendar-check',          `${counts.logs} registros de hábitos`      ],
    ['checkbox-marked-circle',  `${counts.tasks} tarefas`                   ],
    ['format-list-checks',      `${counts.subs} subtarefas`                 ],
    ['tag-multiple',            `${counts.categories} categorias`           ],
    ['timer',                   `${counts.sessions} sessões do Pomodoro`    ],
    ['cog',                     'Suas configurações e preferências'         ],
    ['heart',                   'Seu porquê'                                ],
  ] : [];

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ marginRight: 12 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
          Resetar conta
        </Text>
      </View>

      <View style={s.content}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={48}
          color={colors.red}
          style={{ alignSelf: 'center', marginBottom: 16 }}
        />
        <Text style={[s.subtitle, { color: colors.textSecondary, fontFamily: typography.fontBody }]}>
          Os seguintes dados serão permanentemente apagados:
        </Text>

        {counts ? (
          <View style={[s.list, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
            {DATA_ITEMS.map(([icon, label]) => (
              <View key={label as string} style={s.listRow}>
                <MaterialCommunityIcons name={icon as any} size={16} color={colors.textTertiary} />
                <Text style={[s.listLabel, { color: colors.textSecondary, fontFamily: typography.fontBody }]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <ActivityIndicator color={colors.blue500} style={{ marginVertical: 24 }} />
        )}

        <Text style={[s.warning, { color: colors.red, fontFamily: typography.fontBodyBold }]}>
          Esta ação não pode ser desfeita.
        </Text>

        <TouchableOpacity
          style={[s.resetBtn, { backgroundColor: colors.red, borderRadius: radius.md }]}
          onPress={confirmReset}
          disabled={resetting}
          activeOpacity={0.85}
        >
          {resetting
            ? <ActivityIndicator color="#fff" />
            : <Text style={[s.resetTxt, { fontFamily: typography.fontBodyBold }]}>Entendo, quero resetar</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={[s.cancelTxt, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:    { flex: 1 },
  header:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  title:     { fontSize: 17, flex: 1 },
  content:   { padding: 24 },
  subtitle:  { fontSize: 15, marginBottom: 16, textAlign: 'center' },
  list:      { borderWidth: 0.5, padding: 16, marginBottom: 20, gap: 12 },
  listRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listLabel: { fontSize: 14 },
  warning:   { fontSize: 13, textAlign: 'center', marginBottom: 24 },
  resetBtn:  { paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  resetTxt:  { color: '#fff', fontSize: 15 },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelTxt: { fontSize: 15 },
});
