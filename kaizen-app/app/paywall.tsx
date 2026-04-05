import {
  View, Text, TouchableOpacity, SafeAreaView, ScrollView,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useProStore } from '@/store/useProStore';

const FREE_FEATURES = [
  { icon: 'check-circle-outline', text: 'Até 3 hábitos ativos' },
  { icon: 'check-circle-outline', text: 'Até 10 tarefas ativas' },
  { icon: 'check-circle-outline', text: 'Até 3 categorias' },
  { icon: 'check-circle-outline', text: 'Pomodoro + lembretes' },
  { icon: 'check-circle-outline', text: 'Analytics últimos 7 dias' },
];

const PRO_FEATURES = [
  { icon: 'infinity',         text: 'Hábitos ilimitados' },
  { icon: 'infinity',         text: 'Tarefas ilimitadas' },
  { icon: 'infinity',         text: 'Categorias ilimitadas' },
  { icon: 'chart-bar',        text: 'Analytics 30 dias' },
  { icon: 'cellphone-widget', text: 'Widget nativo (em breve)' },
  { icon: 'cloud-sync',       text: 'Sync em nuvem prioritário' },
];

export default function PaywallScreen() {
  const { colors, typography, radius } = useTheme();
  const router = useRouter();
  const { isPro, purchasePro, restorePurchases } = useProStore();
  const [loading, setLoading]   = useState(false);
  const [restoring, setRestoring] = useState(false);

  async function handlePurchase() {
    setLoading(true);
    try {
      await purchasePro();
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      await restorePurchases();
      if (useProStore.getState().isPro) router.back();
    } finally {
      setRestoring(false);
    }
  }

  if (isPro) {
    return (
      <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
        <View style={s.center}>
          <MaterialCommunityIcons name="crown" size={48} color={colors.amber} />
          <Text style={[s.alreadyPro, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
            Você já é Pro!
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={[s.backBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
            <Text style={[s.backBtnTxt, { color: colors.textPrimary, fontFamily: typography.fontBodyMedium }]}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ marginRight: 12 }}>
          <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
          Kaizen Pro
        </Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={[s.crownBadge, { backgroundColor: `${colors.amber}20`, borderRadius: radius.xl }]}>
            <MaterialCommunityIcons name="crown" size={40} color={colors.amber} />
          </View>
          <Text style={[s.heroTitle, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
            Desbloqueie todo o{'\n'}potencial do Kaizen
          </Text>
          <Text style={[s.heroSub, { color: colors.textSecondary, fontFamily: typography.fontBody }]}>
            Sem limites. Sem distrações. Evolução contínua.
          </Text>
        </View>

        {/* Pricing card */}
        <View style={[s.pricingCard, { backgroundColor: colors.surface, borderColor: colors.amber, borderRadius: radius.xl }]}>
          <View style={[s.popularBadge, { backgroundColor: colors.amber, borderRadius: radius.full }]}>
            <Text style={[s.popularTxt, { fontFamily: typography.fontBodyBold }]}>MAIS POPULAR</Text>
          </View>
          <Text style={[s.price, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
            R$ 14,90
          </Text>
          <Text style={[s.pricePeriod, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
            por mês · cancele quando quiser
          </Text>
        </View>

        {/* Comparison */}
        <View style={s.comparisonRow}>
          {/* Free */}
          <View style={[s.compCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
            <Text style={[s.compTitle, { color: colors.textSecondary, fontFamily: typography.fontBodyBold }]}>Free</Text>
            {FREE_FEATURES.map((f) => (
              <View key={f.text} style={s.featureRow}>
                <MaterialCommunityIcons name={f.icon as any} size={14} color={colors.textTertiary} />
                <Text style={[s.featureTxt, { color: colors.textSecondary, fontFamily: typography.fontBody }]} numberOfLines={2}>
                  {f.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Pro */}
          <View style={[s.compCard, { backgroundColor: `${colors.amber}0D`, borderColor: colors.amber, borderRadius: radius.lg }]}>
            <Text style={[s.compTitle, { color: colors.amber, fontFamily: typography.fontBodyBold }]}>Pro ✦</Text>
            {PRO_FEATURES.map((f) => (
              <View key={f.text} style={s.featureRow}>
                <MaterialCommunityIcons name={f.icon as any} size={14} color={colors.amber} />
                <Text style={[s.featureTxt, { color: colors.textPrimary, fontFamily: typography.fontBody }]} numberOfLines={2}>
                  {f.text}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[s.footer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[s.ctaBtn, { backgroundColor: colors.amber, borderRadius: radius.md }]}
          onPress={handlePurchase}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={[s.ctaTxt, { fontFamily: typography.fontBodyBold }]}>Assinar Pro — R$ 14,90/mês</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRestore} disabled={restoring} style={s.restoreBtn}>
          {restoring
            ? <ActivityIndicator size="small" color={colors.textTertiary} />
            : <Text style={[s.restoreTxt, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                Restaurar compras
              </Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:        { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle:   { fontSize: 17, flex: 1 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  alreadyPro:    { fontSize: 22 },
  backBtn:       { paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, marginTop: 8 },
  backBtnTxt:    { fontSize: 15 },
  content:       { padding: 20, paddingBottom: 8 },
  hero:          { alignItems: 'center', gap: 10, marginBottom: 24 },
  crownBadge:    { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroTitle:     { fontSize: 24, textAlign: 'center', lineHeight: 32 },
  heroSub:       { fontSize: 15, textAlign: 'center' },
  pricingCard:   { borderWidth: 1.5, padding: 20, alignItems: 'center', marginBottom: 20, gap: 4 },
  popularBadge:  { paddingHorizontal: 12, paddingVertical: 4, marginBottom: 8 },
  popularTxt:    { color: '#000', fontSize: 11, letterSpacing: 1 },
  price:         { fontSize: 36 },
  pricePeriod:   { fontSize: 13 },
  comparisonRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  compCard:      { flex: 1, borderWidth: 1, padding: 12, gap: 10 },
  compTitle:     { fontSize: 14, marginBottom: 2 },
  featureRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  featureTxt:    { fontSize: 12, flex: 1, lineHeight: 16 },
  footer:        { padding: 16, paddingBottom: 8, borderTopWidth: 0.5, gap: 8 },
  ctaBtn:        { paddingVertical: 16, alignItems: 'center' },
  ctaTxt:        { color: '#000', fontSize: 15 },
  restoreBtn:    { alignItems: 'center', paddingVertical: 8 },
  restoreTxt:    { fontSize: 13 },
});
