import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { HabitTemplate } from '@/types';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  template: HabitTemplate;
  onPress(template: HabitTemplate): void;
}

const TYPE_LABEL: Record<string, string> = {
  build: 'Construir',
  quit:  'Eliminar',
};

const FREQ_LABEL: Record<string, string> = {
  once_daily:     '1x por dia',
  multiple_daily: 'Várias vezes',
};

export default function HabitTemplateCard({ template, onPress }: Props) {
  const { colors, typography, radius } = useTheme();
  const isBuild   = template.type === 'build';
  const iconColor = isBuild ? colors.green500 : colors.red;
  const iconBg    = isBuild ? colors.green100  : `${colors.red}22`;
  const badgeBg   = isBuild ? colors.green100  : `${colors.red}22`;
  const badgeTxt  = isBuild ? colors.green700  : colors.red;

  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}
      onPress={() => onPress(template)}
      activeOpacity={0.8}
    >
      <View style={s.row}>
        <View style={[s.iconBox, { backgroundColor: iconBg, borderRadius: radius.md }]}>
          <MaterialCommunityIcons name={template.icon as never} size={26} color={iconColor} />
        </View>

        <View style={s.info}>
          <Text style={[s.name, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
            {template.name}
          </Text>
          <View style={s.badges}>
            <View style={[s.badge, { backgroundColor: badgeBg, borderRadius: radius.full }]}>
              <Text style={[s.badgeTxt, { color: badgeTxt, fontFamily: typography.fontBodyBold }]}>
                {TYPE_LABEL[template.type]}
              </Text>
            </View>
            <Text style={[s.freqTxt, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
              {FREQ_LABEL[template.frequencyType]}
            </Text>
          </View>
          {template.defaultDailyTarget != null && (
            <Text style={[s.metaTxt, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
              Meta: {template.defaultDailyTarget} {template.defaultUnitLabel}
            </Text>
          )}
        </View>

        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:    { padding: 16, marginBottom: 10, borderWidth: 0.5 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  info:    { flex: 1 },
  name:    { fontSize: 15, marginBottom: 4 },
  badges:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge:   { paddingHorizontal: 8, paddingVertical: 2 },
  badgeTxt:{ fontSize: 11 },
  freqTxt: { fontSize: 13 },
  metaTxt: { fontSize: 13, marginTop: 4 },
});
