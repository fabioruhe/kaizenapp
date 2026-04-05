import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, RefreshControl, Alert, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import HomeHeader from '@/components/HomeHeader';
import DailySummaryCards from '@/components/DailySummaryCards';
import QuickHabitRow from '@/components/QuickHabitRow';
import EditWhyModal from '@/components/EditWhyModal';
import ProfileMenu from '@/components/ProfileMenu';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useTasksStore } from '@/store/useTasksStore';
import { SQLitePomodoroSessionsRepository } from '@/db/repositories/pomodoroSessionsRepository';
import { todayString } from '@/utils/dateHelpers';
import { useTheme } from '@/hooks/useTheme';
import type { DailySummary } from '@/types';

const pomodoroRepo = new SQLitePomodoroSessionsRepository();

export default function HomeScreen() {
  const { colors, typography, radius } = useTheme();
  const router   = useRouter();
  const userId   = useOnboardingStore((s) => s.userId);
  const why      = useOnboardingStore((s) => s.why);
  const userName = useOnboardingStore((s) => s.userName);
  const updateWhy = useOnboardingStore((s) => s.updateWhy);
  const signOut   = useAuthStore((s) => s.signOut);

  const [editWhyVisible, setEditWhyVisible]         = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [pomodoroStats, setPomodoroStats]           = useState({ count: 0, focusMinutes: 0 });

  function handleWhyPress() {
    if (!why) { setEditWhyVisible(true); return; }
    Alert.alert(
      'Alterar seu porquê?',
      'Seu porquê é a base da sua jornada. Tem certeza que deseja alterá-lo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sim, quero alterar', onPress: () => setEditWhyVisible(true) },
      ],
    );
  }

  async function handleSaveWhy(newWhy: string) {
    await updateWhy(newWhy);
    setEditWhyVisible(false);
  }

  const { habits, todayLogs, streaks, isLoading: habitsLoading, load: loadHabits, logProgress, undoLog } = useHabitsStore();
  const { tasks, isLoading: tasksLoading, load: loadTasks, completeTask, loadSubTasks } = useTasksStore();

  const loadData = useCallback(() => {
    if (!userId) return;
    loadHabits(userId);
    loadTasks(userId);
    pomodoroRepo.getToday(userId, todayString()).then(setPomodoroStats);
  }, [userId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const activeHabits = habits.filter((h) => h.isActive);
  const pendingTasks = tasks.filter((t) => !t.isCompleted).slice(0, 3);
  const today        = todayString();

  const PRIORITY_COLOR: Record<string, string> = {
    high: colors.red, medium: colors.amber, low: colors.blue500,
  };

  const summary: DailySummary = {
    habitsTotal:         activeHabits.length,
    habitsCompleted:     Object.values(streaks).filter((s) => s.completedToday).length,
    tasksTotal:          tasks.filter((t) => !t.isCompleted).length,
    tasksCompletedToday: tasks.filter((t) => t.isCompleted && t.completedAt?.startsWith(today)).length,
    pomodorosToday:      pomodoroStats.count,
    focusMinutesToday:   pomodoroStats.focusMinutes,
  };

  const isLoading = habitsLoading || tasksLoading;

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={colors.blue500} />}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader userName={userName} onAvatarPress={() => setProfileMenuVisible(true)} />

        {/* Porquê */}
        <TouchableOpacity
          style={[s.whyCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}
          onPress={handleWhyPress}
          activeOpacity={0.85}
        >
          <View style={s.whyHeader}>
            <Text style={[s.whyLabel, { color: colors.blue500, fontFamily: typography.fontBodyBold }]}>
              Meu porquê
            </Text>
            <MaterialCommunityIcons name="pencil" size={13} color={colors.textTertiary} />
          </View>
          {why
            ? <Text style={[s.whyText, { color: colors.textSecondary, fontFamily: typography.fontBody }]}>"{why}"</Text>
            : <Text style={[s.whyEmpty, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                Toque para definir seu porquê...
              </Text>
          }
        </TouchableOpacity>

        <EditWhyModal
          visible={editWhyVisible}
          currentWhy={why}
          onSave={handleSaveWhy}
          onCancel={() => setEditWhyVisible(false)}
        />

        {/* Resumo */}
        <Text style={[s.sectionTitle, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
          Resumo de hoje
        </Text>
        <DailySummaryCards summary={summary} />

        {/* Hábitos */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
            Hábitos de hoje
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/habits')}>
            <Text style={[s.seeAll, { color: colors.blue500, fontFamily: typography.fontBodyMedium }]}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
          {activeHabits.length === 0
            ? <Text style={[s.empty, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>Nenhum hábito ativo.</Text>
            : activeHabits.map((h) => (
                <QuickHabitRow
                  key={h.id}
                  habit={h}
                  todayLog={todayLogs[h.id] ?? null}
                  streak={streaks[h.id] ?? { current: 0, best: 0, completedToday: false }}
                  onLog={() => logProgress(h.id, userId)}
                  onUndo={() => undoLog(h.id)}
                />
              ))
          }
        </View>

        {/* Tarefas */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
            Tarefas prioritárias
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
            <Text style={[s.seeAll, { color: colors.blue500, fontFamily: typography.fontBodyMedium }]}>Ver todas</Text>
          </TouchableOpacity>
        </View>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
          {pendingTasks.length === 0
            ? <Text style={[s.empty, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>Tudo em dia! 🎉</Text>
            : pendingTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={[s.taskRow, { borderBottomColor: colors.border }]}
                  activeOpacity={0.75}
                  onPress={async () => {
                    const subs = await loadSubTasks(task.id);
                    if (subs.some((st) => !st.isCompleted)) {
                      Alert.alert('Subtarefas pendentes', 'Complete todas as subtarefas antes de concluir a tarefa.');
                      return;
                    }
                    completeTask(task.id);
                  }}
                >
                  <View style={[s.priorityDot, { backgroundColor: PRIORITY_COLOR[task.priority] }]} />
                  <Text style={[s.taskTitle, { color: colors.textPrimary, fontFamily: typography.fontBodyMedium }]} numberOfLines={1}>
                    {task.title}
                  </Text>
                  <MaterialCommunityIcons name="circle-outline" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              ))
          }
        </View>

        <ProfileMenu
          visible={profileMenuVisible}
          userName={userName}
          onClose={() => setProfileMenuVisible(false)}
          onNavigate={(route) => router.push(route as any)}
          onSignOut={() => {
            setProfileMenuVisible(false);
            signOut();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:        { flex: 1 },
  scroll:        { paddingBottom: 100 },
  whyCard:       { marginHorizontal: 16, marginTop: 16, padding: 16, borderWidth: 0.5 },
  whyHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  whyLabel:      { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 },
  whyText:       { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  whyEmpty:      { fontSize: 14, fontStyle: 'italic' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 20, marginBottom: 8 },
  sectionTitle:  { fontSize: 15, paddingHorizontal: 16, marginTop: 20, marginBottom: 8 },
  seeAll:        { fontSize: 13 },
  card:          { marginHorizontal: 16, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 0.5 },
  empty:         { fontSize: 14, textAlign: 'center', paddingVertical: 12 },
  taskRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5 },
  priorityDot:   { width: 8, height: 8, borderRadius: 4 },
  taskTitle:     { flex: 1, fontSize: 15 },
});
