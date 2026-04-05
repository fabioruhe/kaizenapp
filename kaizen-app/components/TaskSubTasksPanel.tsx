import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { SubTask } from '@/types';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  subTasks: SubTask[];
  onComplete(subTaskId: string): void;
  onUncomplete(subTaskId: string): void;
}

export default function TaskSubTasksPanel({ subTasks, onComplete, onUncomplete }: Props) {
  const { colors, typography } = useTheme();

  if (subTasks.length === 0) {
    return (
      <View style={[s.empty, { borderTopColor: colors.border }]}>
        <Text style={[s.emptyTxt, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
          Nenhuma subtarefa.
        </Text>
      </View>
    );
  }

  return (
    <View style={[s.container, { borderTopColor: colors.border }]}>
      {subTasks.map((sub) => (
        <TouchableOpacity
          key={sub.id}
          style={s.row}
          onPress={() => sub.isCompleted ? onUncomplete(sub.id) : onComplete(sub.id)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={sub.isCompleted ? 'check-circle' : 'circle-outline'}
            size={18}
            color={sub.isCompleted ? colors.green500 : colors.textTertiary}
          />
          <Text style={[
            s.title,
            { fontFamily: typography.fontBody },
            sub.isCompleted
              ? { color: colors.textTertiary, textDecorationLine: 'line-through' }
              : { color: colors.textPrimary },
          ]} numberOfLines={2}>
            {sub.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingTop: 8, paddingBottom: 4, borderTopWidth: 0.5, marginTop: 8 },
  row:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 7 },
  title:     { flex: 1, fontSize: 14 },
  empty:     { paddingVertical: 8, borderTopWidth: 0.5, marginTop: 8 },
  emptyTxt:  { fontSize: 13, textAlign: 'center' },
});
