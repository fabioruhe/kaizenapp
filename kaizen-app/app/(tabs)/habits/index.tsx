import {
  View, Text, FlatList, TouchableOpacity, SafeAreaView,
  ActivityIndicator, RefreshControl, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useCallback } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HabitCard from '@/components/HabitCard';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { formatDatePT, todayString, shiftDays, diffInDays } from '@/utils/dateHelpers';
import { useTheme } from '@/hooks/useTheme';

export default function HabitsScreen() {
  const { colors, typography, radius } = useTheme();
  const router  = useRouter();
  const userId  = useOnboardingStore((s) => s.userId);
  const why     = useOnboardingStore((s) => s.why);

  const { habits, todayLogs, streaks, isLoading, load, logProgress, undoLog, deleteHabit, updateHabit } = useHabitsStore();

  const loadData = useCallback(() => { if (userId) load(userId); }, [userId]);
  useEffect(() => { loadData(); }, [loadData]);

  const activeHabits = habits.filter((h) => h.isActive);

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
      <FlatList
        data={activeHabits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={colors.blue500} />}
        ListHeaderComponent={
          <View style={{ paddingTop: 24, paddingBottom: 8 }}>
            <Text style={[s.dateText, { color: colors.textTertiary, fontFamily: typography.fontBodyMedium }]}>
              {formatDatePT(todayString())}
            </Text>
            <Text style={[s.title, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
              Meus hábitos
            </Text>
            {why ? (
              <View style={[s.whyCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
                <Text style={[s.whyLabel, { color: colors.blue500, fontFamily: typography.fontBodyBold }]}>
                  Meu porquê
                </Text>
                <Text style={[s.whyText, { color: colors.textSecondary, fontFamily: typography.fontBody }]}>
                  "{why}"
                </Text>
              </View>
            ) : null}
            <View style={s.btnRow}>
              <TouchableOpacity
                style={[s.btnNew, { backgroundColor: colors.blue500, borderRadius: radius.md }]}
                onPress={() => router.push('/(tabs)/habits/new')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                <Text style={[s.btnNewTxt, { fontFamily: typography.fontBodyBold }]}>Novo hábito</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnSuggestions, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}
                onPress={() => router.push('/(tabs)/habits/templates')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="lightning-bolt" size={18} color={colors.blue500} />
                <Text style={[s.btnSuggestionsTxt, { color: colors.blue500, fontFamily: typography.fontBodyBold }]}>
                  Sugestões
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={s.center}><ActivityIndicator color={colors.blue500} /></View>
          ) : (
            <View style={s.empty}>
              <MaterialCommunityIcons name="sprout" size={48} color={colors.surface3} />
              <Text style={[s.emptyTxt, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                Nenhum hábito ainda.{'\n'}Comece adicionando o seu primeiro!
              </Text>
              <TouchableOpacity
                style={[s.btnNew, { marginTop: 20, backgroundColor: colors.blue500, borderRadius: radius.md }]}
                onPress={() => router.push('/(tabs)/habits/new')}
              >
                <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                <Text style={[s.btnNewTxt, { fontFamily: typography.fontBodyBold }]}>Adicionar hábito</Text>
              </TouchableOpacity>
            </View>
          )
        }
        renderItem={({ item }) => {
          const streak = streaks[item.id] ?? { current: 0, best: 0, completedToday: false };

          function handleRenewGoal() {
            if (item.goalType === 'days' && item.goalTargetDays) {
              updateHabit(item.id, { goalTargetDays: streak.current + item.goalTargetDays });
            } else if (item.goalType === 'date_range' && item.goalEndDate) {
              const duration = Math.max(1, diffInDays(item.startDate, item.goalEndDate));
              updateHabit(item.id, { goalEndDate: shiftDays(todayString(), duration) });
            }
          }

          return (
            <HabitCard
              habit={item}
              todayLog={todayLogs[item.id] ?? null}
              streak={streak}
              onLog={() => logProgress(item.id, userId)}
              onUndo={() => undoLog(item.id)}
              onDelete={() => deleteHabit(item.id)}
              onRenewGoal={handleRenewGoal}
              onCompleteGoal={() => deleteHabit(item.id)}
              onEdit={() => router.push({ pathname: '/(tabs)/habits/new', params: { habitId: item.id } })}
            />
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:           { flex: 1 },
  dateText:         { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  title:            { fontSize: 22, marginBottom: 16 },
  whyCard:          { padding: 16, marginBottom: 20, borderWidth: 0.5 },
  whyLabel:         { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  whyText:          { fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
  btnRow:           { flexDirection: 'row', gap: 8, marginBottom: 8 },
  btnNew:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  btnNewTxt:        { color: '#fff', fontSize: 14 },
  btnSuggestions:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 0.5 },
  btnSuggestionsTxt:{ fontSize: 14 },
  center:           { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  empty:            { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  emptyTxt:         { fontSize: 15, textAlign: 'center', marginTop: 16 },
});
