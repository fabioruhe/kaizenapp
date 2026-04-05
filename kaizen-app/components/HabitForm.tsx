import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useState, useRef } from 'react';
import IconPicker from './IconPicker';
import HabitTypeToggle from './HabitTypeToggle';
import HabitFrequencyFields from './HabitFrequencyFields';
import HabitGoalFields from './HabitGoalFields';
import HabitReminderFields from './HabitReminderFields';
import DatePicker from './DatePicker';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useTheme } from '@/hooks/useTheme';
import type { CreateHabitDTO, HabitType, FrequencyType, GoalType, ReminderMode } from '@/types';
import { todayString } from '@/utils/dateHelpers';
import { useOnboardingStore } from '@/store/useOnboardingStore';

interface FormState {
  icon: string; name: string; type: HabitType; frequencyType: FrequencyType;
  startDate: string; dailyTarget: number | null; unitLabel: string | null; incrementValue: number | null;
  goalType: GoalType; goalTargetDays: number | null; goalEndDate: string | null;
  reminderEnabled: boolean; reminderMode: ReminderMode | null;
  reminderFixedTime: string | null; reminderIntervalHours: number | null;
  reminderIntervalStart: string | null; reminderIntervalEnd: string | null;
}

interface Props {
  initialValues?: Partial<FormState>;
  onSubmit(data: CreateHabitDTO): Promise<void>;
  onCancel(): void;
  submitLabel?: string;
}

function buildInitial(o?: Partial<FormState>): FormState {
  return {
    icon: o?.icon ?? 'star', name: o?.name ?? '', type: o?.type ?? 'build',
    frequencyType: o?.frequencyType ?? 'once_daily', startDate: o?.startDate ?? todayString(),
    dailyTarget: o?.dailyTarget ?? null, unitLabel: o?.unitLabel ?? null, incrementValue: o?.incrementValue ?? null,
    goalType: o?.goalType ?? 'forever', goalTargetDays: o?.goalTargetDays ?? null, goalEndDate: o?.goalEndDate ?? null,
    reminderEnabled: o?.reminderEnabled ?? false, reminderMode: o?.reminderMode ?? null,
    reminderFixedTime: o?.reminderFixedTime ?? null, reminderIntervalHours: o?.reminderIntervalHours ?? null,
    reminderIntervalStart: o?.reminderIntervalStart ?? null, reminderIntervalEnd: o?.reminderIntervalEnd ?? null,
  };
}

export default function HabitForm({ initialValues, onSubmit, onCancel, submitLabel = 'Salvar hábito' }: Props) {
  const { colors, typography, radius } = useTheme();
  const [form, setForm]     = useState<FormState>(() => buildInitial(initialValues));
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const notifPermission     = useOnboardingStore((s) => s.notificationsPermission);
  const notificationAllowed = notifPermission === 'granted';

  const initialSnapshot = useRef(buildInitial(initialValues));
  const { markAsSaved } = useUnsavedChanges(form, initialSnapshot.current);

  const iconColor = form.type === 'build' ? colors.green500 : colors.red;
  const isValid   = form.name.trim().length >= 2;

  function patch(v: Partial<FormState>) { setForm((p) => ({ ...p, ...v })); }

  function handleTypeChange(type: HabitType) {
    const reminderMode = (type === 'quit' && form.reminderMode !== 'fixed_time')
      ? 'fixed_time' as ReminderMode
      : form.reminderMode;
    patch(type === 'quit'
      ? { type, frequencyType: 'once_daily', dailyTarget: null, unitLabel: null, incrementValue: null, reminderMode }
      : { type });
  }

  async function handleSubmit() {
    if (!isValid) { setError('O nome precisa ter pelo menos 2 caracteres.'); return; }
    if (form.frequencyType === 'multiple_daily') {
      if (!form.dailyTarget || form.dailyTarget < 1) { setError('Informe a meta diária.'); return; }
      if (!form.incrementValue || form.incrementValue < 1) { setError('Informe o valor por check.'); return; }
      if (!form.unitLabel?.trim()) { setError('Informe a unidade.'); return; }
    }
    if (form.goalType === 'days' && (!form.goalTargetDays || form.goalTargetDays < 1)) {
      setError('Informe o número de dias da meta.'); return;
    }
    if (form.goalType === 'date_range' && !form.goalEndDate) {
      setError('Informe a data de término da meta.'); return;
    }
    if (form.reminderEnabled) {
      if ((form.reminderMode === 'fixed_time' || form.reminderMode === 'both') && !form.reminderFixedTime) {
        setError('Informe o horário do lembrete.'); return;
      }
      if (form.reminderMode === 'interval' || form.reminderMode === 'both') {
        if (!form.reminderIntervalHours) { setError('Informe o intervalo em horas.'); return; }
        if (!form.reminderIntervalStart || !form.reminderIntervalEnd) { setError('Informe a janela de horário.'); return; }
      }
    }
    setError('');
    setLoading(true);
    try {
      markAsSaved();
      await onSubmit({
        icon: form.icon, name: form.name.trim(), type: form.type,
        frequencyType: form.frequencyType, startDate: form.startDate, isActive: true,
        dailyTarget: form.dailyTarget, unitLabel: form.unitLabel?.trim() ?? null, incrementValue: form.incrementValue,
        goalType: form.goalType, goalTargetDays: form.goalTargetDays, goalEndDate: form.goalEndDate,
        reminderEnabled: form.reminderEnabled, reminderMode: form.reminderMode,
        reminderFixedTime: form.reminderFixedTime, reminderIntervalHours: form.reminderIntervalHours,
        reminderIntervalStart: form.reminderIntervalStart, reminderIntervalEnd: form.reminderIntervalEnd,
        notificationIds: [],
      });
    } catch { setError('Erro ao salvar. Tente novamente.'); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <IconPicker value={form.icon} onChange={(icon) => patch({ icon })} color={iconColor} />

        <Text style={[s.label, { color: colors.textPrimary, fontFamily: typography.fontBodyBold }]}>
          Nome do hábito
        </Text>
        <TextInput
          style={[s.input, {
            backgroundColor: colors.surface2,
            color: colors.textPrimary,
            borderColor: colors.border,
            borderRadius: radius.md,
            fontFamily: typography.fontBody,
          }]}
          placeholder="Ex: Beber água"
          placeholderTextColor={colors.textTertiary}
          value={form.name}
          onChangeText={(v) => { patch({ name: v }); if (error) setError(''); }}
          maxLength={60}
        />

        <View style={{ height: 16 }} />
        <HabitTypeToggle value={form.type} onChange={handleTypeChange} />

        <DatePicker label="Data de início" value={form.startDate} onChange={(d) => patch({ startDate: d })} />

        {form.type === 'build' && (
          <HabitFrequencyFields
            frequencyType={form.frequencyType} dailyTarget={form.dailyTarget}
            unitLabel={form.unitLabel} incrementValue={form.incrementValue}
            onChange={patch}
          />
        )}

        <HabitGoalFields
          goalType={form.goalType} goalTargetDays={form.goalTargetDays}
          goalEndDate={form.goalEndDate} onChange={patch}
        />

        <HabitReminderFields
          reminderEnabled={form.reminderEnabled} reminderMode={form.reminderMode}
          reminderFixedTime={form.reminderFixedTime} reminderIntervalHours={form.reminderIntervalHours}
          reminderIntervalStart={form.reminderIntervalStart} reminderIntervalEnd={form.reminderIntervalEnd}
          frequencyType={form.frequencyType} notificationAllowed={notificationAllowed} onChange={patch}
        />

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
            : <Text style={[
                s.submitTxt,
                { fontFamily: typography.fontBodyBold },
                !isValid && { color: colors.textTertiary },
              ]}>
                {submitLabel}
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={s.cancelLink} onPress={onCancel} activeOpacity={0.7}>
          <Text style={[s.cancelTxt, { color: colors.textSecondary, fontFamily: typography.fontBodyMedium }]}>
            Cancelar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  label:     { fontSize: 15, marginBottom: 8 },
  input:     { paddingHorizontal: 16, paddingVertical: 12, borderWidth: 0.5, fontSize: 15 },
  errorTxt:  { fontSize: 13, marginBottom: 16, marginTop: 4 },
  submitBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitTxt: { color: '#fff', fontSize: 15 },
  cancelLink:{ alignItems: 'center', paddingVertical: 14 },
  cancelTxt: { fontSize: 15 },
});
