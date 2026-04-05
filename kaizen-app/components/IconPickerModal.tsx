import {
  Modal, View, Text, FlatList, TouchableOpacity,
  TextInput, SafeAreaView, StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { ICON_CATEGORIES, ALL_ICONS } from '@/utils/iconList';

interface Props {
  visible: boolean;
  selected: string;
  onSelect(icon: string): void;
  onClose(): void;
}

const NUM_COLUMNS = 6;

export default function IconPickerModal({ visible, selected, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const icons = useMemo(() => {
    if (query.trim()) {
      return ALL_ICONS.filter((i) => i.includes(query.trim().toLowerCase()));
    }
    if (activeCategory) {
      return ICON_CATEGORIES.find((c) => c.label === activeCategory)?.icons ?? [];
    }
    return ALL_ICONS;
  }, [query, activeCategory]);

  function handleSelect(icon: string) {
    onSelect(icon);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[s.screen, { backgroundColor: colors.surface }]}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.surface2 }]}>
          <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Escolher ícone</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Busca */}
        <View style={s.searchBox}>
          <TextInput
            style={[s.searchInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Buscar ícone..."
            placeholderTextColor="#6b7280"
            value={query}
            onChangeText={(v) => { setQuery(v); setActiveCategory(null); }}
          />
        </View>

        {/* Categorias */}
        {!query.trim() && (
          <View style={s.categories}>
            <TouchableOpacity
              style={[s.catBtn, { backgroundColor: colors.surface2 }, !activeCategory && s.catBtnActive]}
              onPress={() => setActiveCategory(null)}
            >
              <Text style={[s.catTxt, { color: colors.textSecondary }, !activeCategory && s.catTxtActive]}>Todos</Text>
            </TouchableOpacity>
            {ICON_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.label}
                style={[s.catBtn, { backgroundColor: colors.surface2 }, activeCategory === cat.label && s.catBtnActive]}
                onPress={() => setActiveCategory(cat.label)}
              >
                <Text style={[s.catTxt, { color: colors.textSecondary }, activeCategory === cat.label && s.catTxtActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Grid */}
        <FlatList
          data={icons}
          keyExtractor={(item) => item}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.iconBtn, { backgroundColor: colors.surface2 }, selected === item && s.iconBtnSelected]}
              onPress={() => handleSelect(item)}
            >
              <MaterialCommunityIcons
                name={item as never}
                size={26}
                color={selected === item ? '#000' : colors.textPrimary}
              />
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={[s.emptyTxt, { color: colors.textSecondary }]}>Nenhum ícone encontrado.</Text>}
        />
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen:        { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle:   { fontSize: 18, fontWeight: '600' },
  searchBox:     { paddingHorizontal: 16, paddingVertical: 12 },
  searchInput:   { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1 },
  categories:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  catBtn:        { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  catBtnActive:  { backgroundColor: '#facc15' },
  catTxt:        { fontSize: 12, fontWeight: '500' },
  catTxtActive:  { color: '#000000' },
  iconBtn:       { flex: 1, margin: 4, aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconBtnSelected:{ backgroundColor: '#facc15' },
  emptyTxt:      { textAlign: 'center', marginTop: 32 },
});
