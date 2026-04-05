import {
  View, Text, ScrollView, SafeAreaView,
  ActivityIndicator, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SimpleBarChart from '@/components/SimpleBarChart';
import { loadAnalytics, type AnalyticsSummary } from '@/utils/analyticsQueries';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useProStore } from '@/store/useProStore';
import { useTheme } from '@/hooks/useTheme';

function ProLock({ onUnlock }: { onUnlock(): void }) {
  const { colors, typography, radius } = useTheme();
  return (
    <View style={[lock.overlay, { backgroundColor: `${colors.bg}E0`, borderRadius: radius.lg }]}>
      <MaterialCommunityIcons name="lock" size={28} color={colors.amber} />
      <Text style={[lock.title, { color: colors.textPrimary, fontFamily: typography.fontBodyBold }]}>
        Disponível no Pro
      </Text>
      <Text style={[lock.sub, { color: colors.textSecondary, fontFamily: typography.fontBody }]}>
        Veja o histórico completo de 30 dias
      </Text>
      <TouchableOpacity
        style={[lock.btn, { backgroundColor: colors.amber, borderRadius: radius.md }]}
        onPress={onUnlock}
        activeOpacity={0.85}
      >
        <Text style={[lock.btnTxt, { fontFamily: typography.fontBodyBold }]}>Assinar Pro</Text>
      </TouchableOpacity>
    </View>
  );
}

const lock = StyleSheet.create({
  overlay: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  title:   { fontSize: 15 },
  sub:     { fontSize: 13, textAlign: 'center' },
  btn:     { paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  btnTxt:  { color: '#000', fontSize: 14 },
});

export default function AnalyticsScreen() {
  const { colors, typography, radius } = useTheme();
  const router  = useRouter();
  const userId  = useOnboardingStore((s) => s.userId);
  const isPro   = useProStore((s) => s.isPro);

  const [data, setData]         = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    loadAnalytics(userId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [userId]);

  const cardStyle = [s.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }];

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ marginRight: 12 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
          Relatórios
        </Text>
      </View>

      {loading || !data ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.blue500} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content}>

          {/* ── Hábitos ─────────────────────────────────────────────────────── */}
          <Text style={[s.sectionTitle, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
            Hábitos
          </Text>

          {/* KPIs */}
          <View style={s.kpiRow}>
            <View style={[{ flex: 1, position: 'relative' }, { borderRadius: radius.lg, overflow: 'hidden' }]}>
              <View style={[s.kpi, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
                <Text style={[s.kpiValue, { color: colors.green500, fontFamily: typography.fontDisplayBold }]}>
                  {Math.round(data.habitConsistency30d * 100)}%
                </Text>
                <Text style={[s.kpiLabel, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                  Consistência{'\n'}30 dias
                </Text>
              </View>
              {!isPro && <ProLock onUnlock={() => router.push('/paywall')} />}
            </View>
            <View style={[s.kpi, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
              <Text style={[s.kpiValue, { color: colors.green500, fontFamily: typography.fontDisplayBold }]}>
                {data.habitCheckinsPerDay.reduce((a, b) => a + b.value, 0)}
              </Text>
              <Text style={[s.kpiLabel, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                Check-ins{'\n'}últimos 7d
              </Text>
            </View>
          </View>

          {/* Check-ins por dia */}
          <View style={cardStyle}>
            <Text style={[s.cardTitle, { color: colors.textPrimary, fontFamily: typography.fontBodyBold }]}>
              Check-ins por dia
            </Text>
            <Text style={[s.cardSub, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
              Últimos 7 dias
            </Text>
            <View style={{ marginTop: 12 }}>
              <SimpleBarChart
                data={data.habitCheckinsPerDay}
                color={colors.green500}
                height={80}
              />
            </View>
          </View>

          {/* Consistência por hábito */}
          {data.habitConsistencyList.length > 0 && (
            <View style={[cardStyle, { position: 'relative', overflow: 'hidden' }]}>
              <Text style={[s.cardTitle, { color: colors.textPrimary, fontFamily: typography.fontBodyBold }]}>
                Por hábito — últimos 30 dias
              </Text>
              {data.habitConsistencyList.map((h) => (
                <View key={h.habitId} style={s.habitRow}>
                  <MaterialCommunityIcons name={h.icon as any} size={16} color={colors.green500} />
                  <Text style={[s.habitName, { color: colors.textPrimary, fontFamily: typography.fontBodyMedium }]} numberOfLines={1}>
                    {h.name}
                  </Text>
                  <View style={[s.pctTrack, { backgroundColor: colors.surface3, borderRadius: radius.full }]}>
                    <View style={[s.pctFill, {
                      width: `${Math.round(h.pct * 100)}%`,
                      backgroundColor: h.pct >= 0.8 ? colors.green500 : h.pct >= 0.5 ? colors.amber : colors.red,
                      borderRadius: radius.full,
                    }]} />
                  </View>
                  <Text style={[s.pctLabel, { color: colors.textTertiary, fontFamily: typography.fontBodyMedium }]}>
                    {Math.round(h.pct * 100)}%
                  </Text>
                </View>
              ))}
              {!isPro && <ProLock onUnlock={() => router.push('/paywall')} />}
            </View>
          )}

          {/* ── Tarefas ─────────────────────────────────────────────────────── */}
          <Text style={[s.sectionTitle, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold, marginTop: 8 }]}>
            Tarefas
          </Text>

          <View style={{ position: 'relative', borderRadius: radius.lg, overflow: 'hidden', marginBottom: 10 }}>
            <View style={s.kpiRow}>
              <View style={[s.kpi, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
                <Text style={[s.kpiValue, { color: colors.blue500, fontFamily: typography.fontDisplayBold }]}>
                  {data.tasksTotal30d}
                </Text>
                <Text style={[s.kpiLabel, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                  Concluídas{'\n'}30 dias
                </Text>
              </View>
              <View style={[s.kpi, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
                <Text style={[s.kpiValue, { color: colors.blue500, fontFamily: typography.fontDisplayBold }]}>
                  {data.tasksCompletedPerWeek[data.tasksCompletedPerWeek.length - 1]?.value ?? 0}
                </Text>
                <Text style={[s.kpiLabel, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                  Concluídas{'\n'}esta semana
                </Text>
              </View>
            </View>
            <View style={[cardStyle, { marginBottom: 0 }]}>
              <Text style={[s.cardTitle, { color: colors.textPrimary, fontFamily: typography.fontBodyBold }]}>
                Concluídas por semana
              </Text>
              <Text style={[s.cardSub, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                Últimas 4 semanas
              </Text>
              <View style={{ marginTop: 12 }}>
                <SimpleBarChart
                  data={data.tasksCompletedPerWeek}
                  color={colors.blue500}
                  height={80}
                />
              </View>
            </View>
            {!isPro && <ProLock onUnlock={() => router.push('/paywall')} />}
          </View>

          {/* ── Pomodoro ────────────────────────────────────────────────────── */}
          <Text style={[s.sectionTitle, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold, marginTop: 8 }]}>
            Foco
          </Text>

          <View style={{ position: 'relative', borderRadius: radius.lg, overflow: 'hidden', marginBottom: 10 }}>
            <View style={s.kpiRow}>
              <View style={[s.kpi, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
                <Text style={[s.kpiValue, { color: colors.purple500, fontFamily: typography.fontDisplayBold }]}>
                  {data.focusTotal30d}
                </Text>
                <Text style={[s.kpiLabel, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                  Min de foco{'\n'}30 dias
                </Text>
              </View>
              <View style={[s.kpi, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
                <Text style={[s.kpiValue, { color: colors.purple500, fontFamily: typography.fontDisplayBold }]}>
                  {data.pomodoroSessions30d}
                </Text>
                <Text style={[s.kpiLabel, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                  Sessões{'\n'}30 dias
                </Text>
              </View>
            </View>
            {!isPro && <ProLock onUnlock={() => router.push('/paywall')} />}
          </View>

          <View style={[cardStyle, { marginBottom: 40 }]}>
            <Text style={[s.cardTitle, { color: colors.textPrimary, fontFamily: typography.fontBodyBold }]}>
              Minutos de foco por dia
            </Text>
            <Text style={[s.cardSub, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
              Últimos 7 dias
            </Text>
            <View style={{ marginTop: 12 }}>
              <SimpleBarChart
                data={data.focusMinutesPerDay}
                color={colors.purple500}
                height={80}
                unit="m"
              />
            </View>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:       { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle:  { fontSize: 17, flex: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content:      { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 18, marginBottom: 12 },
  kpiRow:       { flexDirection: 'row', gap: 10, marginBottom: 10 },
  kpi:          { flex: 1, padding: 16, alignItems: 'center', gap: 4, borderWidth: 0.5 },
  kpiValue:     { fontSize: 28 },
  kpiLabel:     { fontSize: 11, textAlign: 'center', lineHeight: 16 },
  card:         { padding: 16, marginBottom: 10, borderWidth: 0.5 },
  cardTitle:    { fontSize: 14 },
  cardSub:      { fontSize: 12, marginTop: 2 },
  habitRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  habitName:    { flex: 1, fontSize: 13 },
  pctTrack:     { width: 80, height: 6, overflow: 'hidden' },
  pctFill:      { height: 6 },
  pctLabel:     { fontSize: 12, width: 36, textAlign: 'right' },
});
