import {
  View, Text, FlatList, TouchableOpacity, SafeAreaView,
  Alert, TextInput, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTaskCategoriesStore } from '@/store/useTaskCategoriesStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useProStore } from '@/store/useProStore';
import type { TaskCategory } from '@/types';
import { useTheme } from '@/hooks/useTheme';

const FREE_CATEGORY_LIMIT = 3;

const PRESET_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#6b7280','#14b8a6'];

export default function CategoriesScreen() {
  const { colors, typography, radius } = useTheme();
  const router  = useRouter();
  const userId  = useOnboardingStore((s) => s.userId);
  const isPro   = useProStore((s) => s.isPro);
  const { categories, isLoading, load, createCategory, updateCategory, deleteCategory, moveCategory } = useTaskCategoriesStore();

  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editName, setEditName]     = useState('');
  const [editColor, setEditColor]   = useState(PRESET_COLORS[0]);
  const [creating, setCreating]     = useState(false);
  const [newName, setNewName]       = useState('');
  const [newColor, setNewColor]     = useState(PRESET_COLORS[0]);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => { if (userId) load(userId); }, [userId]);

  async function handleCreate() {
    if (!newName.trim()) return;
    if (!isPro && categories.length >= FREE_CATEGORY_LIMIT) {
      router.push('/paywall');
      return;
    }
    setCreateLoading(true);
    try {
      await createCategory(userId, { name: newName.trim(), color: newColor, icon: null, order: categories.length });
      setNewName('');
      setNewColor(PRESET_COLORS[0]);
      setCreating(false);
    } finally { setCreateLoading(false); }
  }

  function startEdit(cat: TaskCategory) {
    setEditingId(cat.id); setEditName(cat.name); setEditColor(cat.color);
  }

  async function saveEdit() {
    if (!editingId || !editName.trim()) return;
    await updateCategory(editingId, { name: editName.trim(), color: editColor });
    setEditingId(null);
  }

  function confirmDelete(cat: TaskCategory) {
    Alert.alert(
      'Excluir categoria',
      `Excluir "${cat.name}"? As tarefas vinculadas ficam sem categoria.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteCategory(cat.id) },
      ],
    );
  }

  const inputStyle = [s.editInput, {
    backgroundColor: colors.surface2,
    color: colors.textPrimary,
    borderColor: colors.border,
    borderRadius: radius.sm,
    fontFamily: typography.fontBody,
  }];

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ marginRight: 12 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
          Categorias
        </Text>
        <TouchableOpacity onPress={() => { setCreating(true); setEditingId(null); }} hitSlop={8} style={s.addBtn}>
          <MaterialCommunityIcons name="plus" size={20} color={colors.blue500} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshing={isLoading}
        onRefresh={useCallback(() => load(userId), [userId])}
        ListFooterComponent={
          creating ? (
            <View style={[s.row, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 8 }]}>
              <View style={s.editBox}>
                <TextInput
                  style={inputStyle}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Nome da categoria"
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                  maxLength={40}
                />
                <View style={s.colorRow}>
                  {PRESET_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[s.colorDot, { backgroundColor: c }, newColor === c && { borderWidth: 2.5, borderColor: colors.textPrimary }]}
                      onPress={() => setNewColor(c)}
                    />
                  ))}
                </View>
                <View style={s.editActions}>
                  <TouchableOpacity
                    style={[s.cancelBtn, { backgroundColor: colors.surface2, borderRadius: radius.sm }]}
                    onPress={() => { setCreating(false); setNewName(''); setNewColor(PRESET_COLORS[0]); }}
                  >
                    <Text style={[s.cancelTxt, { color: colors.textSecondary, fontFamily: typography.fontBodyMedium }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.saveBtn, { backgroundColor: colors.blue500, borderRadius: radius.sm }, !newName.trim() && { opacity: 0.5 }]}
                    onPress={handleCreate}
                    disabled={createLoading || !newName.trim()}
                  >
                    {createLoading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={[s.saveTxt, { fontFamily: typography.fontBodyBold }]}>Criar</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={s.createRow}
              onPress={() => { setCreating(true); setEditingId(null); }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={18} color={colors.blue500} />
              <Text style={[s.createTxt, { color: colors.blue500, fontFamily: typography.fontBodyBold }]}>
                Nova categoria
              </Text>
            </TouchableOpacity>
          )
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={s.center}><ActivityIndicator color={colors.blue500} /></View>
          ) : (
            <View style={s.empty}>
              <MaterialCommunityIcons name="tag-off" size={48} color={colors.surface3} />
              <Text style={[s.emptyTxt, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                Nenhuma categoria ainda.{'\n'}Crie uma ao adicionar uma tarefa.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isEditing = editingId === item.id;
          return (
            <View style={[s.row, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
              {isEditing ? (
                <View style={s.editBox}>
                  <TextInput
                    style={inputStyle}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Nome da categoria"
                    placeholderTextColor={colors.textTertiary}
                    autoFocus
                    maxLength={40}
                  />
                  <View style={s.colorRow}>
                    {PRESET_COLORS.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[s.colorDot, { backgroundColor: c }, editColor === c && { borderWidth: 2.5, borderColor: colors.textPrimary }]}
                        onPress={() => setEditColor(c)}
                      />
                    ))}
                  </View>
                  <View style={s.editActions}>
                    <TouchableOpacity
                      style={[s.cancelBtn, { backgroundColor: colors.surface2, borderRadius: radius.sm }]}
                      onPress={() => setEditingId(null)}
                    >
                      <Text style={[s.cancelTxt, { color: colors.textSecondary, fontFamily: typography.fontBodyMedium }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.saveBtn, { backgroundColor: colors.blue500, borderRadius: radius.sm }]}
                      onPress={saveEdit}
                    >
                      <Text style={[s.saveTxt, { fontFamily: typography.fontBodyBold }]}>Salvar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={s.rowContent}>
                  <View style={s.reorderBtns}>
                    <TouchableOpacity
                      onPress={() => moveCategory(item.id, 'up')}
                      hitSlop={6}
                      disabled={categories.indexOf(item) === 0}
                    >
                      <MaterialCommunityIcons
                        name="chevron-up"
                        size={18}
                        color={categories.indexOf(item) === 0 ? colors.surface3 : colors.textTertiary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveCategory(item.id, 'down')}
                      hitSlop={6}
                      disabled={categories.indexOf(item) === categories.length - 1}
                    >
                      <MaterialCommunityIcons
                        name="chevron-down"
                        size={18}
                        color={categories.indexOf(item) === categories.length - 1 ? colors.surface3 : colors.textTertiary}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={[s.dot, { backgroundColor: item.color }]} />
                  <Text style={[s.rowName, { color: colors.textPrimary, fontFamily: typography.fontBodyMedium }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <TouchableOpacity onPress={() => startEdit(item)} hitSlop={8} style={s.iconBtn}>
                    <MaterialCommunityIcons name="pencil" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(item)} hitSlop={8} style={s.iconBtn}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.red} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 17, flex: 1 },
  addBtn:      { padding: 4 },
  createRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 4, marginTop: 4 },
  createTxt:   { fontSize: 15 },
  center:      { alignItems: 'center', paddingVertical: 80 },
  empty:       { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  emptyTxt:    { fontSize: 15, textAlign: 'center', marginTop: 16 },
  row:         { marginBottom: 8, borderWidth: 0.5, overflow: 'hidden' },
  rowContent:  { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  reorderBtns: { flexDirection: 'column', alignItems: 'center', gap: 0 },
  dot:         { width: 12, height: 12, borderRadius: 6 },
  rowName:     { flex: 1, fontSize: 15 },
  iconBtn:     { padding: 4 },
  editBox:     { padding: 12, gap: 10 },
  editInput:   { paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, borderWidth: 0.5 },
  colorRow:    { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  colorDot:    { width: 28, height: 28, borderRadius: 14 },
  editActions: { flexDirection: 'row', gap: 8 },
  cancelBtn:   { flex: 1, paddingVertical: 8, alignItems: 'center' },
  cancelTxt:   { fontSize: 14 },
  saveBtn:     { flex: 1, paddingVertical: 8, alignItems: 'center' },
  saveTxt:     { color: '#fff', fontSize: 14 },
});
