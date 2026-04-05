import {
  View, Text, SectionList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StaticHabitTemplatesRepository } from '@/db/repositories/habitTemplatesRepository';
import HabitTemplateCard from '@/components/HabitTemplateCard';
import type { HabitTemplate } from '@/types';
import { useTheme } from '@/hooks/useTheme';

const repo = new StaticHabitTemplatesRepository();

interface Section { title: string; data: HabitTemplate[] }

export default function TemplatesScreen() {
  const { colors, typography, radius } = useTheme();
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      const [templates, categories] = await Promise.all([repo.getAll(), repo.getCategories()]);
      setSections(categories.map((cat) => ({
        title: cat,
        data: templates.filter((t) => t.category === cat),
      })));
      setLoading(false);
    }
    load();
  }, []);

  function handleTemplatePress(template: HabitTemplate) {
    router.push({ pathname: '/(tabs)/habits/new', params: { templateId: template.id } });
  }

  if (loading) {
    return (
      <SafeAreaView style={[s.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.blue500} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <View style={s.listHeader}>
            <Text style={[s.title, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
              Sugestões
            </Text>
            <Text style={[s.subtitle, { color: colors.textSecondary, fontFamily: typography.fontBody }]}>
              Escolha um modelo ou crie do zero.
            </Text>
            <TouchableOpacity
              style={[s.btnScratch, { backgroundColor: colors.blue500, borderRadius: radius.md }]}
              onPress={() => router.push('/(tabs)/habits/new')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={[s.btnScratchTxt, { fontFamily: typography.fontBodyBold }]}>Criar do zero</Text>
            </TouchableOpacity>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.textTertiary, fontFamily: typography.fontBodyBold }]}>
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <HabitTemplateCard template={item} onPress={handleTemplatePress} />
        )}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:        { flex: 1 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listHeader:    { paddingTop: 24, paddingBottom: 16 },
  title:         { fontSize: 22, marginBottom: 4 },
  subtitle:      { fontSize: 14, marginBottom: 20 },
  btnScratch:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  btnScratchTxt: { color: '#fff', fontSize: 15 },
  sectionHeader: { paddingTop: 20, paddingBottom: 8 },
  sectionTitle:  { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 },
});
