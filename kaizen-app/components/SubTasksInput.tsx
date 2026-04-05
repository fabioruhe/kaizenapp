import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface PendingSub { id: string; title: string }

interface Props {
  items: PendingSub[];
  onAdd(title: string): void;
  onRemove(id: string): void;
}

export default function SubTasksInput({ items, onAdd, onRemove }: Props) {
  const { colors, typography, radius } = useTheme();
  const [input, setInput] = useState('');

  function handleAdd() {
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput('');
  }

  return (
    <View style={s.container}>
      <Text style={[s.label, { color: colors.textPrimary, fontFamily: typography.fontBodyBold }]}>
        Subtarefas (opcional)
      </Text>

      <View style={s.inputRow}>
        <TextInput
          style={[s.input, {
            backgroundColor: colors.surface2,
            color: colors.textPrimary,
            borderColor: colors.border,
            borderRadius: radius.md,
            fontFamily: typography.fontBody,
          }]}
          placeholder="Adicionar subtarefa..."
          placeholderTextColor={colors.textTertiary}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          maxLength={120}
        />
        <TouchableOpacity
          style={[
            s.addBtn,
            { borderRadius: radius.md },
            input.trim()
              ? { backgroundColor: colors.blue500 }
              : { backgroundColor: colors.surface2, borderWidth: 0.5, borderColor: colors.border },
          ]}
          onPress={handleAdd}
          disabled={!input.trim()}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="plus"
            size={20}
            color={input.trim() ? '#fff' : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      {items.map((sub) => (
        <View key={sub.id} style={[s.item, { borderBottomColor: colors.border }]}>
          <MaterialCommunityIcons name="circle-outline" size={16} color={colors.textTertiary} style={{ marginTop: 1 }} />
          <Text style={[s.itemTitle, { color: colors.textPrimary, fontFamily: typography.fontBody }]} numberOfLines={2}>
            {sub.title}
          </Text>
          <TouchableOpacity onPress={() => onRemove(sub.id)} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginTop: 16 },
  label:     { fontSize: 15, marginBottom: 8 },
  inputRow:  { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input:     { flex: 1, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 0.5, fontSize: 15 },
  addBtn:    { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  item:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 0.5 },
  itemTitle: { flex: 1, fontSize: 14 },
});
