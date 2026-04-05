import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useTaskCategoriesStore } from '@/store/useTaskCategoriesStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useProStore } from '@/store/useProStore';
import { useRouter } from 'expo-router';
import type { TaskCategory } from '@/types';

const FREE_CATEGORY_LIMIT = 3;

const PRESET_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#6b7280','#14b8a6'];

interface Props {
  value: string | null;
  onChange(categoryId: string | null): void;
}

export default function CategoryPicker({ value, onChange }: Props) {
  const { colors } = useTheme();
  const router    = useRouter();
  const userId    = useOnboardingStore((s) => s.userId);
  const isPro     = useProStore((s) => s.isPro);
  const { categories, load, createCategory } = useTaskCategoriesStore();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[3]);
  const [saving, setSaving]     = useState(false);

  useEffect(() => { if (userId) load(userId); }, [userId]);

  async function handleCreate() {
    if (!newName.trim() || saving) return;
    setSaving(true);
    try {
      const cat = await createCategory(userId, { name: newName.trim(), color: newColor, icon: null, order: categories.length });
      onChange(cat.id);
      setNewName('');
      setCreating(false);
    } finally { setSaving(false); }
  }

  function handleSelect(cat: TaskCategory) {
    onChange(value === cat.id ? null : cat.id);
  }

  const selected = categories.find((c) => c.id === value);

  return (
    <View style={s.container}>
      <Text style={[s.label, { color: colors.textPrimary }]}>Categoria (opcional)</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {/* Chip "Nenhuma" */}
        <TouchableOpacity
          style={[s.chip, { backgroundColor: colors.surface, borderColor: colors.border }, !value && s.chipActive]}
          onPress={() => onChange(null)}
          activeOpacity={0.8}
        >
          <Text style={[s.chipTxt, { color: colors.textSecondary }, !value && s.chipTxtActive]}>Nenhuma</Text>
        </TouchableOpacity>

        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[s.chip, { backgroundColor: colors.surface, borderColor: colors.border }, value === cat.id && { backgroundColor: `${cat.color}22`, borderColor: cat.color }]}
            onPress={() => handleSelect(cat)}
            activeOpacity={0.8}
          >
            <View style={[s.dot, { backgroundColor: cat.color }]} />
            <Text style={[s.chipTxt, { color: colors.textSecondary }, value === cat.id && { color: cat.color }]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}

        {/* Chip "+ Nova" */}
        <TouchableOpacity
          style={[s.chip, s.chipNew, { backgroundColor: colors.surface }]}
          onPress={() => {
            if (!isPro && categories.length >= FREE_CATEGORY_LIMIT) {
              router.push('/paywall');
            } else {
              setCreating(true);
            }
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={14} color="#facc15" />
          <Text style={s.chipNewTxt}>Nova</Text>
        </TouchableOpacity>
      </ScrollView>

      {creating && (
        <View style={[s.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[s.input, { backgroundColor: colors.surface2, color: colors.textPrimary }]}
            placeholder="Nome da categoria"
            placeholderTextColor="#6b7280"
            value={newName}
            onChangeText={setNewName}
            maxLength={40}
            autoFocus
          />
          <View style={s.colorRow}>
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[s.colorDot, { backgroundColor: c }, newColor === c && s.colorDotSelected]}
                onPress={() => setNewColor(c)}
              />
            ))}
          </View>
          <View style={s.formActions}>
            <TouchableOpacity style={[s.cancelBtn, { backgroundColor: colors.surface2 }]} onPress={() => { setCreating(false); setNewName(''); }} activeOpacity={0.7}>
              <Text style={[s.cancelTxt, { color: colors.textTertiary }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.saveBtn, !newName.trim() && { backgroundColor: colors.surface3 }]} onPress={handleCreate} disabled={saving || !newName.trim()} activeOpacity={0.85}>
              <Text style={s.saveTxt}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:       { marginBottom: 16 },
  label:           { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  chips:           { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip:            { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  chipActive:      { backgroundColor: 'rgba(250,204,21,0.1)', borderColor: '#facc15' },
  chipTxt:         { fontSize: 13, fontWeight: '500' },
  chipTxtActive:   { color: '#facc15' },
  chipNew:         { borderColor: 'rgba(250,204,21,0.4)' },
  chipNewTxt:      { color: '#facc15', fontSize: 13, fontWeight: '600' },
  dot:             { width: 8, height: 8, borderRadius: 4 },
  form:            { borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1, gap: 10 },
  input:           { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  colorRow:        { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  colorDot:        { width: 28, height: 28, borderRadius: 14 },
  colorDotSelected:{ borderWidth: 3, borderColor: '#ffffff' },
  formActions:     { flexDirection: 'row', gap: 8 },
  cancelBtn:       { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  cancelTxt:       { fontSize: 14 },
  saveBtn:         { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#facc15' },
  saveTxt:         { color: '#000', fontSize: 14, fontWeight: '600' },
});
