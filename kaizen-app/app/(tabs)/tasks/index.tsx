import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  ActivityIndicator, RefreshControl, SectionList, FlatList, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TaskCard from '@/components/TaskCard';
import { useTasksStore } from '@/store/useTasksStore';
import { useTaskCategoriesStore } from '@/store/useTaskCategoriesStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import type { Task, TaskCategory, Priority } from '@/types';
import { useTheme } from '@/hooks/useTheme';

type FilterKey = 'all' | 'pending' | 'completed';
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',       label: 'Todas'     },
  { key: 'pending',   label: 'Pendentes' },
  { key: 'completed', label: 'Concluídas'},
];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'high',   label: 'Alta'  },
  { value: 'medium', label: 'Média' },
  { value: 'low',    label: 'Baixa' },
];

interface TaskSection { id: string; title: string; color?: string; data: Task[] }

function buildSections(tasks: Task[], categories: TaskCategory[]): TaskSection[] {
  const sections: TaskSection[] = [];
  for (const cat of categories) {
    const data = tasks.filter((t) => t.categoryId === cat.id);
    if (data.length > 0) sections.push({ id: cat.id, title: cat.name, color: cat.color, data });
  }
  sections.sort((a, b) => {
    const aP = a.data.filter((t) => !t.isCompleted).length;
    const bP = b.data.filter((t) => !t.isCompleted).length;
    return bP - aP;
  });
  const uncategorized = tasks.filter((t) => !t.categoryId || !categories.find((c) => c.id === t.categoryId));
  if (uncategorized.length > 0) sections.push({ id: 'none', title: 'Sem categoria', data: uncategorized });
  return sections;
}

export default function TasksScreen() {
  const { colors, typography, radius } = useTheme();
  const router  = useRouter();
  const userId  = useOnboardingStore((s) => s.userId);
  const {
    isLoading, filter, searchQuery, filterPriority,
    load, setFilter, setSearchQuery, setFilterPriority,
    completeTask, uncompleteTask, deleteTask, getFiltered,
  } = useTasksStore();
  const { categories, load: loadCategories } = useTaskCategoriesStore();

  const loadData = useCallback(() => {
    if (!userId) return;
    load(userId);
    loadCategories(userId);
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const filtered      = getFiltered();
  const hasCategories = categories.length > 0;
  const sections      = hasCategories ? buildSections(filtered, categories) : [];

  const PRIORITY_COLOR: Record<Priority, string> = {
    high:   colors.red,
    medium: colors.amber,
    low:    colors.blue500,
  };

  const renderCard = ({ item }: { item: Task }) => (
    <TaskCard
      task={item}
      onComplete={() => completeTask(item.id)}
      onUncomplete={() => uncompleteTask(item.id)}
      onDelete={() => deleteTask(item.id)}
      onEdit={() => router.push({ pathname: '/(tabs)/tasks/new', params: { taskId: item.id } })}
    />
  );

  const ListHeader = (
    <View style={{ paddingTop: 24, paddingBottom: 8 }}>
      <View style={s.topRow}>
        <Text style={[s.title, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>Tarefas</Text>
        <View style={s.topActions}>
          <TouchableOpacity
            style={[s.iconAction, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}
            onPress={() => router.push('/(tabs)/tasks/categories')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="tag-multiple" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btnNew, { backgroundColor: colors.blue500, borderRadius: radius.md }]}
            onPress={() => router.push('/(tabs)/tasks/new')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={[s.btnNewTxt, { fontFamily: typography.fontBodyBold }]}>Nova</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <View style={[s.searchRow, { backgroundColor: colors.surface2, borderColor: colors.border, borderRadius: radius.md }]}>
        <MaterialCommunityIcons name="magnify" size={18} color={colors.textTertiary} />
        <TextInput
          style={[s.searchInput, { color: colors.textPrimary, fontFamily: typography.fontBody }]}
          placeholder="Buscar tarefas..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status filter */}
      <View style={s.filters}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                s.filterBtn,
                { borderRadius: radius.md },
                active
                  ? { backgroundColor: colors.blue100, borderColor: colors.blue500, borderWidth: 0.5 }
                  : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.5 },
              ]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.8}
            >
              <Text style={[
                s.filterTxt,
                active
                  ? { color: colors.blue500, fontFamily: typography.fontBodyBold }
                  : { color: colors.textTertiary, fontFamily: typography.fontBodyMedium },
              ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Priority filter */}
      <View style={[s.filters, { marginTop: -4 }]}>
        <TouchableOpacity
          style={[
            s.filterBtn,
            { borderRadius: radius.md },
            filterPriority === null
              ? { backgroundColor: colors.surface, borderColor: colors.blue500, borderWidth: 0.5 }
              : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.5 },
          ]}
          onPress={() => setFilterPriority(null)}
          activeOpacity={0.8}
        >
          <Text style={[s.filterTxt, { color: filterPriority === null ? colors.blue500 : colors.textTertiary, fontFamily: filterPriority === null ? typography.fontBodyBold : typography.fontBodyMedium }]}>
            Prioridade
          </Text>
        </TouchableOpacity>
        {PRIORITIES.map((p) => {
          const active = filterPriority === p.value;
          return (
            <TouchableOpacity
              key={p.value}
              style={[
                s.filterBtn,
                { borderRadius: radius.md },
                active
                  ? { backgroundColor: `${PRIORITY_COLOR[p.value]}18`, borderColor: PRIORITY_COLOR[p.value], borderWidth: 0.5 }
                  : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.5 },
              ]}
              onPress={() => setFilterPriority(active ? null : p.value)}
              activeOpacity={0.8}
            >
              <Text style={[
                s.filterTxt,
                active
                  ? { color: PRIORITY_COLOR[p.value], fontFamily: typography.fontBodyBold }
                  : { color: colors.textTertiary, fontFamily: typography.fontBodyMedium },
              ]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const EmptyComponent = isLoading ? (
    <View style={s.center}><ActivityIndicator color={colors.blue500} /></View>
  ) : (
    <View style={s.empty}>
      <MaterialCommunityIcons name="check-all" size={48} color={colors.surface3} />
      <Text style={[s.emptyTxt, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
        {searchQuery || filterPriority
          ? 'Nenhuma tarefa encontrada.'
          : filter === 'completed' ? 'Nenhuma tarefa concluída ainda.'
          : filter === 'pending' ? 'Nenhuma tarefa pendente. Tudo em dia!'
          : 'Nenhuma tarefa ainda.\nAdicione a primeira!'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
      {hasCategories ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={colors.blue500} />}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyComponent}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              {section.color && <View style={[s.sectionDot, { backgroundColor: section.color }]} />}
              <Text style={[s.sectionTitle, { color: colors.textTertiary, fontFamily: typography.fontBodyBold }]}>
                {section.title}
              </Text>
              <Text style={[s.sectionCount, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                {section.data.length}
              </Text>
            </View>
          )}
          renderItem={renderCard}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={colors.blue500} />}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyComponent}
          renderItem={renderCard}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:       { flex: 1 },
  topRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title:        { fontSize: 22 },
  topActions:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconAction:   { padding: 8, borderWidth: 0.5 },
  btnNew:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8 },
  btnNewTxt:    { color: '#fff', fontSize: 14 },
  searchRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 0.5, marginBottom: 12 },
  searchInput:  { flex: 1, fontSize: 14, padding: 0 },
  filters:      { flexDirection: 'row', gap: 8, marginBottom: 8 },
  filterBtn:    { flex: 1, paddingVertical: 8, alignItems: 'center' },
  filterTxt:    { fontSize: 13 },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, marginTop: 4 },
  sectionDot:   { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, flex: 1 },
  sectionCount: { fontSize: 12 },
  center:       { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  empty:        { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  emptyTxt:     { fontSize: 15, textAlign: 'center', marginTop: 16 },
});
