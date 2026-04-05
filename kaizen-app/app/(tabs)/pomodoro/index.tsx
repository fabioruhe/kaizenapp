import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, Alert, StyleSheet, TextInput,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import PomodoroTimer from '@/components/PomodoroTimer';
import PomodoroSettingsPanel from '@/components/PomodoroSettingsPanel';
import TaskSubTasksPanel from '@/components/TaskSubTasksPanel';
import { usePomodoroStore } from '@/store/usePomodoroStore';
import { useTasksStore } from '@/store/useTasksStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { schedulePomodoroPhaseEnd, cancelPomodoroNotification } from '@/utils/notificationScheduler';
import { SQLitePomodoroSessionsRepository } from '@/db/repositories/pomodoroSessionsRepository';
import { nowISO } from '@/utils/dateHelpers';
import { useTheme } from '@/hooks/useTheme';
import type { PomodoroPhase, PomodoroSettings, Task } from '@/types';

const sessionsRepo = new SQLitePomodoroSessionsRepository();

const PHASE_NOTIF: Record<PomodoroPhase, { title: string; body: string }> = {
  idle:        { title: '', body: '' },
  focus:       { title: '🍅 Hora de focar!',  body: 'Sua sessão de foco começou.' },
  short_break: { title: '☕ Pausa curta!',     body: 'Descanse um pouco.' },
  long_break:  { title: '🛋 Pausa longa!',     body: 'Você merece uma pausa maior.' },
  done:        { title: '', body: '' },
};

export default function PomodoroScreen() {
  const { colors, typography, radius } = useTheme();
  const {
    phase, currentCycle, secondsRemaining, isRunning, selectedTask, settings,
    loadSettings, saveSettings, selectTask, createQuickTask,
    start, pause, resume, tick, skipBreak, abort, reset,
  } = usePomodoroStore();

  const { tasks, subTasks, loadSubTasks, completeSubTask, uncompleteSubTask } = useTasksStore();
  const userId      = useOnboardingStore((s) => s.userId);
  const preferences = useOnboardingStore((s) => s.preferences);
  const setSoundEnabled = useOnboardingStore((s) => s.setSoundEnabled);

  const [showSettings, setShowSettings]     = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [quickTitle, setQuickTitle]         = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifIdRef  = useRef<string | null>(null);

  useEffect(() => { loadSettings(); }, []);

  useEffect(() => {
    if (phase !== 'idle' && isRunning) { activateKeepAwakeAsync(); }
    else { deactivateKeepAwake(); }
    return () => { deactivateKeepAwake(); };
  }, [phase, isRunning]);

  useEffect(() => {
    async function scheduleNotif() {
      if (notifIdRef.current) { await cancelPomodoroNotification(notifIdRef.current); notifIdRef.current = null; }
      if (phase === 'idle' || phase === 'done') return;
      const { title, body } = PHASE_NOTIF[phase];
      notifIdRef.current = await schedulePomodoroPhaseEnd(title, body, secondsRemaining);
    }
    scheduleNotif();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== 'idle' && isRunning) {
      intervalRef.current = setInterval(() => tick(), 1000);
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, isRunning]);

  useEffect(() => {
    if (selectedTask && 'userId' in selectedTask) {
      const taskId = (selectedTask as Task).id;
      if (!subTasks[taskId]) loadSubTasks(taskId);
    }
  }, [selectedTask]);

  async function persistSession(wasAborted: boolean) {
    const snap = abort();
    if (!snap) return;
    const focusMinutes = Math.floor(snap.totalFocusSeconds / 60);
    await sessionsRepo.create(userId, {
      taskId: snap.taskId, taskTitle: snap.taskTitle, startedAt: snap.startedAt,
      endedAt: nowISO(), completedCycles: snap.completedCycles,
      totalFocusMinutes: focusMinutes, wasAborted,
    });
    return { completedCycles: snap.completedCycles, focusMinutes };
  }

  async function saveAndAbort() {
    const result = await persistSession(true);
    if (!result) return;
    Alert.alert('Sessão encerrada', `${result.completedCycles} pomodoro(s) · ${result.focusMinutes} min de foco`);
  }

  function handleAbort() {
    Alert.alert('Encerrar sessão?', 'O progresso desta sessão será salvo.', [
      { text: 'Continuar', style: 'cancel' },
      { text: 'Encerrar', style: 'destructive', onPress: saveAndAbort },
    ]);
  }

  async function handlePause() {
    pause();
    if (notifIdRef.current) { await cancelPomodoroNotification(notifIdRef.current); notifIdRef.current = null; }
  }

  async function handleResume() {
    resume();
    const { title, body } = PHASE_NOTIF[phase];
    notifIdRef.current = await schedulePomodoroPhaseEnd(title, body, secondsRemaining);
  }

  function handleSelectTask(task: Task) { selectTask(task); setShowTaskPicker(false); }

  function handleCreateQuick() {
    if (!quickTitle.trim()) return;
    createQuickTask(quickTitle.trim());
    setQuickTitle('');
    setShowTaskPicker(false);
  }

  const totalSeconds = phase === 'focus'
    ? settings.focusMinutes * 60
    : phase === 'short_break' ? settings.shortBreakMinutes * 60 : settings.longBreakMinutes * 60;

  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const taskSubs = selectedTask && 'userId' in selectedTask
    ? subTasks[(selectedTask as Task).id] ?? []
    : (selectedTask && 'subTasks' in selectedTask ? selectedTask.subTasks : []);

  // ── Idle ─────────────────────────────────────────────────────────────────────

  if (phase === 'idle') {
    return (
      <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[s.pageTitle, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
            Pomodoro
          </Text>

          <Text style={[s.sectionTitle, { color: colors.textTertiary, fontFamily: typography.fontBodyBold }]}>
            Tarefa em foco
          </Text>

          {selectedTask ? (
            <View style={[s.selectedTask, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
              <Text style={[s.selectedTaskTitle, { color: colors.textPrimary, fontFamily: typography.fontBodyMedium }]} numberOfLines={2}>
                {selectedTask.title}
              </Text>
              <TouchableOpacity onPress={() => selectTask(null)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[s.noTask, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
              Nenhuma tarefa selecionada
            </Text>
          )}

          <View style={s.taskBtns}>
            {[
              { icon: 'format-list-bulleted', label: 'Da minha lista' },
              { icon: 'lightning-bolt',       label: 'Tarefa rápida'  },
            ].map((btn) => (
              <TouchableOpacity
                key={btn.label}
                style={[s.taskBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}
                onPress={() => setShowTaskPicker((v) => !v)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name={btn.icon as any} size={16} color={colors.blue500} />
                <Text style={[s.taskBtnTxt, { color: colors.blue500, fontFamily: typography.fontBodyBold }]}>
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {showTaskPicker && (
            <View style={[s.picker, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
              <View style={s.quickRow}>
                <TextInput
                  style={[s.quickInput, { backgroundColor: colors.surface2, color: colors.textPrimary, borderColor: colors.border, borderRadius: radius.md, fontFamily: typography.fontBody }]}
                  placeholder="Título da tarefa rápida..."
                  placeholderTextColor={colors.textTertiary}
                  value={quickTitle}
                  onChangeText={setQuickTitle}
                  onSubmitEditing={handleCreateQuick}
                  returnKeyType="done"
                  maxLength={120}
                />
                <TouchableOpacity
                  style={[s.quickAdd, { borderRadius: radius.md }, quickTitle.trim() ? { backgroundColor: colors.blue500 } : { backgroundColor: colors.surface2, borderWidth: 0.5, borderColor: colors.border }]}
                  onPress={handleCreateQuick}
                  disabled={!quickTitle.trim()}
                >
                  <MaterialCommunityIcons name="plus" size={18} color={quickTitle.trim() ? '#fff' : colors.textTertiary} />
                </TouchableOpacity>
              </View>
              {pendingTasks.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[s.taskItem, { borderTopColor: colors.border }]}
                  onPress={() => handleSelectTask(t)}
                  activeOpacity={0.75}
                >
                  <MaterialCommunityIcons name="circle-outline" size={16} color={colors.textTertiary} />
                  <Text style={[s.taskItemTxt, { color: colors.textPrimary, fontFamily: typography.fontBody }]} numberOfLines={1}>
                    {t.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={s.settingsToggle}
            onPress={() => setShowSettings((v) => !v)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name={showSettings ? 'chevron-up' : 'cog-outline'} size={18} color={colors.textSecondary} />
            <Text style={[s.settingsTxt, { color: colors.textSecondary, fontFamily: typography.fontBodyMedium }]}>
              Configurações do timer
            </Text>
          </TouchableOpacity>
          {showSettings && <PomodoroSettingsPanel settings={settings} onSave={(s) => { saveSettings(s); setShowSettings(false); }} />}

          <TouchableOpacity
            style={[
              s.startBtn,
              { borderRadius: radius.md },
              selectedTask ? { backgroundColor: colors.blue500 } : { backgroundColor: colors.surface2 },
            ]}
            onPress={start}
            disabled={!selectedTask}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="play" size={20} color={selectedTask ? '#fff' : colors.textTertiary} />
            <Text style={[s.startTxt, { fontFamily: typography.fontBodyBold }, !selectedTask && { color: colors.textTertiary }]}>
              Iniciar Pomodoro
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Conclusão natural ─────────────────────────────────────────────────────────

  if (phase === 'done') {
    const snap = usePomodoroStore.getState().session;
    const focusMinutes = snap ? Math.floor(snap.totalFocusSeconds / 60) : 0;
    const cycles       = snap?.completedCycles ?? 0;

    return (
      <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
        <View style={s.doneContainer}>
          <Text style={s.doneEmoji}>🎉</Text>
          <Text style={[s.doneTitle, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
            Round completo!
          </Text>
          <Text style={[s.doneSubtitle, { color: colors.textSecondary, fontFamily: typography.fontBody }]}>
            Você concluiu todos os pomodoros do ciclo.
          </Text>

          <View style={[s.doneSummary, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl }]}>
            <View style={s.doneStat}>
              <Text style={[s.doneStatValue, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>{cycles}</Text>
              <Text style={[s.doneStatLabel, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>Pomodoros</Text>
            </View>
            <View style={[s.doneDivider, { backgroundColor: colors.border }]} />
            <View style={s.doneStat}>
              <Text style={[s.doneStatValue, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>{focusMinutes}</Text>
              <Text style={[s.doneStatLabel, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>Min de foco</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[s.doneBtn, { backgroundColor: colors.green500, borderRadius: radius.md }]}
            activeOpacity={0.85}
            onPress={async () => { await persistSession(false); }}
          >
            <Text style={[s.doneBtnTxt, { fontFamily: typography.fontBodyBold }]}>Concluir e salvar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Ativo ─────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.activeHeader}>
          <TouchableOpacity onPress={() => setSoundEnabled(!preferences.soundEnabled)} hitSlop={8} style={s.soundBtn}>
            <MaterialCommunityIcons
              name={preferences.soundEnabled ? 'volume-high' : 'volume-off'}
              size={22} color={colors.textSecondary}
            />
          </TouchableOpacity>
          <Text style={[s.pageTitle, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>Pomodoro</Text>
          <TouchableOpacity onPress={handleAbort} hitSlop={8}>
            <MaterialCommunityIcons name="stop-circle-outline" size={24} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <PomodoroTimer
          phase={phase} secondsRemaining={secondsRemaining} totalSeconds={totalSeconds}
          currentCycle={currentCycle} cyclesBeforeLongBreak={settings.cyclesBeforeLongBreak}
        />

        {selectedTask && (
          <View style={[s.focusTask, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
            <Text style={[s.focusLabel, { color: colors.textTertiary, fontFamily: typography.fontBodyBold }]}>Em foco</Text>
            <Text style={[s.focusTitle, { color: colors.textPrimary, fontFamily: typography.fontBodyMedium }]}>
              {selectedTask.title}
            </Text>
          </View>
        )}

        {taskSubs.length > 0 && (
          <View style={[s.subsCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
            <TaskSubTasksPanel
              subTasks={taskSubs as any}
              onComplete={(id) => selectedTask && 'userId' in selectedTask && completeSubTask(id, (selectedTask as Task).id)}
              onUncomplete={(id) => selectedTask && 'userId' in selectedTask && uncompleteSubTask(id, (selectedTask as Task).id)}
            />
          </View>
        )}

        <View style={s.controls}>
          <TouchableOpacity
            style={[s.controlBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}
            onPress={isRunning ? handlePause : handleResume}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name={isRunning ? 'pause' : 'play'} size={28} color={colors.textPrimary} />
            <Text style={[s.controlTxt, { color: colors.textSecondary, fontFamily: typography.fontBodyMedium }]}>
              {isRunning ? 'Pausar' : 'Retomar'}
            </Text>
          </TouchableOpacity>

          {(phase === 'short_break' || phase === 'long_break') && (
            <TouchableOpacity style={s.skipBtn} onPress={skipBreak} activeOpacity={0.8}>
              <MaterialCommunityIcons name="skip-next" size={20} color={colors.purple500} />
              <Text style={[s.skipTxt, { color: colors.purple500, fontFamily: typography.fontBodyMedium }]}>Pular pausa</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[s.bgWarning, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
          ⚠ Mantenha o app aberto para o timer funcionar.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:           { flex: 1 },
  scroll:           { paddingHorizontal: 16, paddingBottom: 80 },
  pageTitle:        { fontSize: 22, paddingTop: 24, paddingBottom: 16 },
  sectionTitle:     { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  noTask:           { fontSize: 15, paddingVertical: 10 },
  selectedTask:     { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10, gap: 10, borderWidth: 0.5 },
  selectedTaskTitle:{ flex: 1, fontSize: 15 },
  taskBtns:         { flexDirection: 'row', gap: 10, marginBottom: 10 },
  taskBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderWidth: 0.5 },
  taskBtnTxt:       { fontSize: 13 },
  picker:           { padding: 12, borderWidth: 0.5, marginBottom: 12 },
  quickRow:         { flexDirection: 'row', gap: 8, marginBottom: 10 },
  quickInput:       { flex: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 0.5 },
  quickAdd:         { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  taskItem:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 0.5 },
  taskItemTxt:      { flex: 1, fontSize: 14 },
  settingsToggle:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  settingsTxt:      { fontSize: 14 },
  startBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, marginTop: 24 },
  startTxt:         { color: '#fff', fontSize: 16 },
  activeHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, paddingBottom: 8 },
  soundBtn:         { padding: 4 },
  focusTask:        { padding: 14, borderWidth: 0.5, marginBottom: 12 },
  focusLabel:       { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  focusTitle:       { fontSize: 16 },
  subsCard:         { paddingHorizontal: 14, paddingVertical: 4, borderWidth: 0.5, marginBottom: 12 },
  controls:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 8 },
  controlBtn:       { alignItems: 'center', gap: 4, paddingHorizontal: 32, paddingVertical: 14, borderWidth: 0.5 },
  controlTxt:       { fontSize: 13 },
  skipBtn:          { alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 14 },
  skipTxt:          { fontSize: 13 },
  bgWarning:        { fontSize: 12, textAlign: 'center', marginTop: 24 },
  doneContainer:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  doneEmoji:        { fontSize: 64 },
  doneTitle:        { fontSize: 26, textAlign: 'center' },
  doneSubtitle:     { fontSize: 15, textAlign: 'center', marginBottom: 8 },
  doneSummary:      { flexDirection: 'row', paddingVertical: 20, paddingHorizontal: 32, borderWidth: 0.5, gap: 24, marginBottom: 8 },
  doneStat:         { alignItems: 'center', gap: 4 },
  doneStatValue:    { fontSize: 28 },
  doneStatLabel:    { fontSize: 13 },
  doneDivider:      { width: 1 },
  doneBtn:          { paddingVertical: 14, paddingHorizontal: 40, marginTop: 8 },
  doneBtnTxt:       { color: '#fff', fontSize: 16 },
});
