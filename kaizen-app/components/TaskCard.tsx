import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useState } from 'react';
import TaskSubTasksPanel from './TaskSubTasksPanel';
import { useTasksStore } from '@/store/useTasksStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import type { Task, Priority } from '@/types';
import { formatDateShort, isOverdue } from '@/utils/dateHelpers';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  task: Task;
  onComplete(): void;
  onUncomplete(): void;
  onDelete(): void;
  onEdit?(): void;
}

const PRIORITY_LABEL: Record<Priority, string> = { high: 'Alta', medium: 'Média', low: 'Baixa' };
const SWIPE_THRESHOLD = 80;

export default function TaskCard({ task, onComplete, onUncomplete, onDelete, onEdit }: Props) {
  const { colors, typography, radius } = useTheme();
  const translateX  = useSharedValue(0);
  const [expanded, setExpanded] = useState(false);

  const userId = useOnboardingStore((s) => s.userId);
  const { subTasks, loadSubTasks, completeSubTask, uncompleteSubTask } = useTasksStore();
  const subs = subTasks[task.id];

  const hasIncompleteSubs = subs !== undefined && subs.some((st) => !st.isCompleted);

  const PRIORITY_COLOR: Record<Priority, string> = {
    high:   colors.red,
    medium: colors.amber,
    low:    colors.blue500,
  };
  const PRIORITY_BG: Record<Priority, string> = {
    high:   `${colors.red}18`,
    medium: `${colors.amber}22`,
    low:    colors.blue100,
  };
  const priorityColor = PRIORITY_COLOR[task.priority];
  const priorityBg    = PRIORITY_BG[task.priority];

  function toggleExpand() {
    if (!expanded && subs === undefined) loadSubTasks(task.id);
    setExpanded((v) => !v);
  }

  async function handleCheck() {
    if (task.isCompleted) { onUncomplete(); return; }
    const currentSubs = subs !== undefined ? subs : await loadSubTasks(task.id);
    if (currentSubs.some((st) => !st.isCompleted)) {
      Alert.alert('Subtarefas pendentes', 'Complete todas as subtarefas primeiro.');
      return;
    }
    onComplete();
  }

  function confirmDelete() {
    Alert.alert('Excluir tarefa', `Deseja excluir "${task.title}"?`, [
      { text: 'Cancelar', style: 'cancel', onPress: () => { translateX.value = withTiming(0); } },
      { text: 'Excluir',  style: 'destructive', onPress: onDelete },
    ]);
  }

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => { translateX.value = Math.max(-120, Math.min(80, e.translationX)); })
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-120);
        runOnJS(confirmDelete)();
      } else if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(0);
        runOnJS(handleCheck)();
      } else {
        translateX.value = withTiming(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  const progressBar = subs && subs.length > 0 ? (() => {
    const done = subs.filter((st) => st.isCompleted).length;
    const pct  = done / subs.length;
    return (
      <View style={s.progressWrap}>
        <View style={[s.progressBg, { backgroundColor: colors.surface3 }]}>
          <View style={[s.progressFill, { width: `${pct * 100}%`, backgroundColor: colors.blue500 }]} />
        </View>
        <Text style={[s.progressTxt, { color: colors.textTertiary, fontFamily: typography.fontBodyMedium }]}>
          {done}/{subs.length}
        </Text>
      </View>
    );
  })() : null;

  return (
    <View style={[s.wrapper, { borderRadius: radius.lg }]}>
      <View style={[s.bg, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
        <View style={s.bgAction}>
          <MaterialCommunityIcons name={task.isCompleted ? 'undo' : 'check-circle'} size={24} color={colors.green500} />
          <Text style={[s.bgGreen, { color: colors.green500, fontFamily: typography.fontBodyMedium }]}>
            {task.isCompleted ? 'Reabrir' : 'Feito'}
          </Text>
        </View>
        <View style={s.bgAction}>
          <MaterialCommunityIcons name="trash-can" size={24} color={colors.red} />
          <Text style={[s.bgRed, { color: colors.red, fontFamily: typography.fontBodyMedium }]}>Excluir</Text>
        </View>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[
          s.card,
          animatedStyle,
          { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg },
        ]}>
          <TouchableOpacity activeOpacity={0.85} onPress={toggleExpand}>
            <View style={s.row}>
              <TouchableOpacity onPress={handleCheck} hitSlop={8} style={s.checkbox}>
                <MaterialCommunityIcons
                  name={task.isCompleted ? 'check-circle' : (hasIncompleteSubs ? 'circle-half-full' : 'circle-outline')}
                  size={22}
                  color={task.isCompleted ? colors.green500 : (hasIncompleteSubs ? colors.amber : colors.textTertiary)}
                />
              </TouchableOpacity>

              <View style={s.content}>
                <Text style={[
                  s.title,
                  { color: colors.textPrimary, fontFamily: typography.fontBodyMedium },
                  task.isCompleted && { color: colors.textTertiary, textDecorationLine: 'line-through' },
                ]}>
                  {task.title}
                </Text>
                {task.description ? (
                  <Text style={[s.description, { color: colors.textSecondary, fontFamily: typography.fontBody }]} numberOfLines={2}>
                    {task.description}
                  </Text>
                ) : null}
                <View style={s.meta}>
                  <View style={[s.priorityBadge, { backgroundColor: priorityBg, borderRadius: radius.full }]}>
                    <Text style={[s.priorityTxt, { color: priorityColor, fontFamily: typography.fontBodyBold }]}>
                      {PRIORITY_LABEL[task.priority]}
                    </Text>
                  </View>
                  {task.dueDate ? (() => {
                    const overdue = !task.isCompleted && isOverdue(task.dueDate);
                    return (
                      <View style={[s.dateRow, overdue && { backgroundColor: `${colors.red}14`, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }]}>
                        <MaterialCommunityIcons name="calendar" size={12} color={overdue ? colors.red : colors.textTertiary} />
                        <Text style={[s.dateTxt, { color: overdue ? colors.red : colors.textTertiary, fontFamily: overdue ? typography.fontBodyBold : typography.fontBody }]}>
                          {overdue ? `Atrasada · ${formatDateShort(task.dueDate)}` : formatDateShort(task.dueDate)}
                        </Text>
                      </View>
                    );
                  })() : null}
                </View>
                {!expanded && progressBar}
              </View>

              <MaterialCommunityIcons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={18} color={colors.textTertiary}
              />
            </View>
          </TouchableOpacity>

          {expanded && (
            <>
              {onEdit && !task.isCompleted && (
                <TouchableOpacity
                  style={[s.editRow, { borderTopColor: colors.border }]}
                  onPress={onEdit}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.blue500} />
                  <Text style={[s.editTxt, { color: colors.blue500, fontFamily: typography.fontBodyMedium }]}>
                    Editar tarefa
                  </Text>
                </TouchableOpacity>
              )}
              {subs !== undefined && (
                <TaskSubTasksPanel
                  subTasks={subs}
                  onComplete={(id) => completeSubTask(id, task.id)}
                  onUncomplete={(id) => uncompleteSubTask(id, task.id)}
                />
              )}
            </>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper:      { marginBottom: 8, overflow: 'hidden' },
  bg:           { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  bgAction:     { alignItems: 'center' },
  bgGreen:      { fontSize: 12, marginTop: 2 },
  bgRed:        { fontSize: 12, marginTop: 2 },
  card:         { borderWidth: 0.5, paddingHorizontal: 16, paddingVertical: 12 },
  row:          { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox:     { marginTop: 2 },
  content:      { flex: 1 },
  title:        { fontSize: 15, lineHeight: 21 },
  description:  { fontSize: 13, marginTop: 2 },
  meta:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  priorityBadge:{ paddingHorizontal: 8, paddingVertical: 2 },
  priorityTxt:  { fontSize: 11 },
  dateRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateTxt:      { fontSize: 13 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  progressBg:   { flex: 1, height: 6, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 999 },
  progressTxt:  { fontSize: 11 },
  editRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 4, borderTopWidth: 0.5, marginTop: 4 },
  editTxt:      { fontSize: 13 },
});
