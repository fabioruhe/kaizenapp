import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HabitForm from '@/components/HabitForm';
import { StaticHabitTemplatesRepository } from '@/db/repositories/habitTemplatesRepository';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useProStore } from '@/store/useProStore';
import type { CreateHabitDTO, HabitTemplate } from '@/types';
import { useTheme } from '@/hooks/useTheme';

const FREE_HABIT_LIMIT = 3;

const templatesRepo = new StaticHabitTemplatesRepository();

export default function NewHabitScreen() {
  const { colors, typography } = useTheme();
  const router = useRouter();
  const { templateId, habitId } = useLocalSearchParams<{ templateId?: string; habitId?: string }>();
  const isEditing = !!habitId;

  const habits      = useHabitsStore((s) => s.habits);
  const createHabit = useHabitsStore((s) => s.createHabit);
  const updateHabit = useHabitsStore((s) => s.updateHabit);
  const userId      = useOnboardingStore((s) => s.userId);
  const isPro       = useProStore((s) => s.isPro);

  // Redirect to paywall if free limit reached (only when creating)
  useEffect(() => {
    if (!isEditing && !isPro && habits.length >= FREE_HABIT_LIMIT) {
      router.replace('/paywall');
    }
  }, [isEditing, isPro, habits.length]);

  const [template, setTemplate]           = useState<HabitTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(!!templateId);

  useEffect(() => {
    if (!templateId) return;
    templatesRepo.getById(templateId).then((t) => { setTemplate(t); setLoadingTemplate(false); });
  }, [templateId]);

  async function handleSubmit(data: CreateHabitDTO) {
    if (isEditing) {
      await updateHabit(habitId!, data);
    } else {
      await createHabit(userId, data);
    }
    router.back();
  }

  // Pre-fill from existing habit when editing
  const existingHabit = isEditing ? habits.find((h) => h.id === habitId) : undefined;

  const initialValues = existingHabit ? {
    icon: existingHabit.icon,
    name: existingHabit.name,
    type: existingHabit.type,
    frequencyType: existingHabit.frequencyType,
    startDate: existingHabit.startDate,
    dailyTarget: existingHabit.dailyTarget,
    unitLabel: existingHabit.unitLabel,
    incrementValue: existingHabit.incrementValue,
    goalType: existingHabit.goalType,
    goalTargetDays: existingHabit.goalTargetDays,
    goalEndDate: existingHabit.goalEndDate,
    reminderEnabled: existingHabit.reminderEnabled,
    reminderMode: existingHabit.reminderMode,
    reminderFixedTime: existingHabit.reminderFixedTime,
    reminderIntervalHours: existingHabit.reminderIntervalHours,
    reminderIntervalStart: existingHabit.reminderIntervalStart,
    reminderIntervalEnd: existingHabit.reminderIntervalEnd,
  } : template ? {
    icon: template.icon, name: template.name, type: template.type,
    frequencyType: template.frequencyType, dailyTarget: template.defaultDailyTarget,
    unitLabel: template.defaultUnitLabel, incrementValue: template.defaultIncrementValue,
  } : undefined;

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ marginRight: 12 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
          {isEditing ? 'Editar hábito' : templateId ? 'Personalizar hábito' : 'Novo hábito'}
        </Text>
      </View>

      {loadingTemplate ? (
        <View style={s.center}><ActivityIndicator color={colors.blue500} /></View>
      ) : (
        <HabitForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitLabel={isEditing ? 'Salvar alterações' : 'Salvar hábito'}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 17, flex: 1 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
