import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import DatePicker from '@/components/DatePicker';
import CategoryPicker from '@/components/CategoryPicker';
import SubTasksInput from '@/components/SubTasksInput';
import { useTasksStore } from '@/store/useTasksStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useProStore } from '@/store/useProStore';
import type { Priority } from '@/types';

const FREE_TASK_LIMIT = 10;
import { todayString } from '@/utils/dateHelpers';
import { generateId } from '@/utils/uuid';
import { useTheme } from '@/hooks/useTheme';

interface PendingSub { id: string; title: string }

export default function NewTaskScreen() {
  const { colors, typography, radius } = useTheme();
  const router  = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const isEditing = !!taskId;

  const { tasks, createTask, updateTask, addSubTask } = useTasksStore();
  const userId  = useOnboardingStore((s) => s.userId);
  const isPro   = useProStore((s) => s.isPro);

  const activeTasks = tasks.filter((t) => !t.isCompleted);

  useEffect(() => {
    if (!isEditing && !isPro && activeTasks.length >= FREE_TASK_LIMIT) {
      router.replace('/paywall');
    }
  }, [isEditing, isPro, activeTasks.length]);

  const PRIORITIES: { value: Priority; label: string; color: string; bg: string }[] = [
    { value: 'high',   label: 'Alta',  color: colors.red,    bg: `${colors.red}18`    },
    { value: 'medium', label: 'Média', color: colors.amber,  bg: `${colors.amber}22`  },
    { value: 'low',    label: 'Baixa', color: colors.blue500, bg: colors.blue100       },
  ];

  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority]       = useState<Priority>('medium');
  const [dueDate, setDueDate]         = useState<string | null>(null);
  const [categoryId, setCategoryId]   = useState<string | null>(null);
  const [pendingSubs, setPendingSubs] = useState<PendingSub[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [initializing, setInitializing] = useState(isEditing);

  // Pre-fill when editing
  useEffect(() => {
    if (!isEditing) return;
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setPriority(task.priority);
      setDueDate(task.dueDate ?? null);
      setCategoryId(task.categoryId ?? null);
    }
    setInitializing(false);
  }, [taskId]);

  const initialSnapshot = useRef({
    title: '', description: '', priority: 'medium' as Priority,
    dueDate: null as string | null, categoryId: null as string | null,
    pendingSubs: [] as PendingSub[],
  });
  const { markAsSaved } = useUnsavedChanges(
    { title, description, priority, dueDate, categoryId, pendingSubs },
    initialSnapshot.current,
  );

  const isValid = title.trim().length >= 2;

  async function handleSubmit() {
    if (!isValid) { setError('O título precisa ter pelo menos 2 caracteres.'); return; }
    setError('');
    setLoading(true);
    try {
      if (isEditing) {
        await updateTask(taskId!, {
          title: title.trim(), description: description.trim() || null,
          priority, dueDate, categoryId,
        });
      } else {
        const task = await createTask(userId, {
          title: title.trim(), description: description.trim() || null,
          priority, dueDate, completedAt: null, isCompleted: false, categoryId,
        });
        for (const sub of pendingSubs) {
          await addSubTask(userId, task.id, sub.title);
        }
      }
      markAsSaved();
      router.back();
    } catch { setError('Erro ao salvar. Tente novamente.'); }
    finally { setLoading(false); }
  }

  if (initializing) {
    return (
      <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.blue500} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ marginRight: 12 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
          {isEditing ? 'Editar tarefa' : 'Nova tarefa'}
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

          <Text style={[s.label, { color: colors.textPrimary, fontFamily: typography.fontBodyBold }]}>Título</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.surface2, color: colors.textPrimary, borderColor: colors.border, borderRadius: radius.md, fontFamily: typography.fontBody }]}
            placeholder="O que precisa ser feito?"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={(v) => { setTitle(v); if (error) setError(''); }}
            maxLength={120}
          />

          <Text style={[s.label, { color: colors.textPrimary, fontFamily: typography.fontBodyBold, marginTop: 16 }]}>
            Descrição (opcional)
          </Text>
          <TextInput
            style={[s.input, { minHeight: 80, textAlignVertical: 'top', backgroundColor: colors.surface2, color: colors.textPrimary, borderColor: colors.border, borderRadius: radius.md, fontFamily: typography.fontBody }]}
            placeholder="Detalhes adicionais..."
            placeholderTextColor={colors.textTertiary}
            multiline
            value={description}
            onChangeText={setDescription}
            maxLength={500}
          />

          <Text style={[s.label, { color: colors.textPrimary, fontFamily: typography.fontBodyBold, marginTop: 16 }]}>
            Prioridade
          </Text>
          <View style={s.priorityRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[
                  s.priorityBtn,
                  { borderRadius: radius.md },
                  priority === p.value
                    ? { backgroundColor: p.bg, borderColor: p.color, borderWidth: 0.5 }
                    : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.5 },
                ]}
                onPress={() => setPriority(p.value)}
                activeOpacity={0.8}
              >
                <Text style={[
                  s.priorityTxt,
                  { fontFamily: typography.fontBodyBold },
                  { color: priority === p.value ? p.color : colors.textTertiary },
                ]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: 16 }}>
            <View style={s.dueDateRow}>
              <Text style={[s.label, { color: colors.textPrimary, fontFamily: typography.fontBodyBold }]}>
                Data de entrega (opcional)
              </Text>
              {dueDate && (
                <TouchableOpacity onPress={() => setDueDate(null)}>
                  <Text style={[{ color: colors.textTertiary, fontSize: 12, fontFamily: typography.fontBody }]}>
                    Remover
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {dueDate ? (
              <DatePicker label="" value={dueDate} onChange={setDueDate} />
            ) : (
              <TouchableOpacity
                style={[s.addDateBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}
                onPress={() => setDueDate(todayString())}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="calendar-plus" size={18} color={colors.textTertiary} />
                <Text style={[{ color: colors.textTertiary, fontSize: 14, fontFamily: typography.fontBody }]}>
                  Adicionar data
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ marginTop: 16 }}>
            <CategoryPicker value={categoryId} onChange={setCategoryId} />
          </View>

          {!isEditing && (
            <SubTasksInput
              items={pendingSubs}
              onAdd={(t) => setPendingSubs((prev) => [...prev, { id: generateId(), title: t }])}
              onRemove={(id) => setPendingSubs((prev) => prev.filter((s) => s.id !== id))}
            />
          )}

          {error ? (
            <Text style={[s.errorTxt, { color: colors.red, fontFamily: typography.fontBody }]}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              s.submitBtn,
              { borderRadius: radius.md },
              isValid ? { backgroundColor: colors.blue500 } : { backgroundColor: colors.surface2 },
            ]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={[s.submitTxt, { fontFamily: typography.fontBodyBold }, !isValid && { color: colors.textTertiary }]}>
                  {isEditing ? 'Salvar alterações' : 'Salvar tarefa'}
                </Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 17, flex: 1 },
  label:       { fontSize: 15, marginBottom: 8 },
  input:       { paddingHorizontal: 16, paddingVertical: 12, borderWidth: 0.5, fontSize: 15 },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  priorityTxt: { fontSize: 14 },
  dueDateRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  addDateBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 0.5 },
  errorTxt:    { fontSize: 13, marginBottom: 16, marginTop: 4 },
  submitBtn:   { paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  submitTxt:   { color: '#fff', fontSize: 15 },
});
