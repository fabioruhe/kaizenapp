import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { useTheme } from '@/hooks/useTheme';

interface MenuItem {
  icon: string;
  label: string;
  onPress(): void;
}

interface Props {
  visible: boolean;
  userName: string;
  onClose(): void;
  onNavigate(route: string): void;
  onSignOut?(): void;
}

export default function ProfileMenu({ visible, userName, onClose, onNavigate, onSignOut }: Props) {
  const { colors, typography, radius } = useTheme();

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Relatórios',
      items: [
        { icon: 'chart-bar', label: 'Ver relatórios', onPress: () => onNavigate('/analytics') },
      ],
    },
    {
      title: 'Configurações',
      items: [
        { icon: 'volume-high',     label: 'Sons',      onPress: () => onNavigate('/settings/sounds') },
        { icon: 'palette-outline', label: 'Aparência', onPress: () => onNavigate('/settings/appearance') },
        { icon: 'delete-outline',  label: 'Reset',     onPress: () => onNavigate('/settings/reset') },
      ],
    },
    {
      title: 'Conta',
      items: [
        { icon: 'account-outline', label: 'Perfil',  onPress: () => onNavigate('/profile') },
        ...(onSignOut ? [{ icon: 'logout', label: 'Sair', onPress: onSignOut }] : []),
      ],
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose} />
      <View style={[s.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <Avatar name={userName} size={48} />
          <View style={s.headerInfo}>
            <Text style={[s.name, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
              {userName || 'Usuário'}
            </Text>
            <Text style={[s.plan, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
              Plano Free
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={22} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {sections.map((sec) => (
          <View key={sec.title} style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.textTertiary, fontFamily: typography.fontBodyBold }]}>
              {sec.title}
            </Text>
            {sec.items.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[s.item, { borderBottomColor: colors.border }]}
                onPress={() => { onClose(); item.onPress(); }}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name={item.icon as any} size={20} color={colors.textSecondary} />
                <Text style={[s.itemLabel, { color: colors.textPrimary, fontFamily: typography.fontBodyMedium }]}>
                  {item.label}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 0.5, paddingBottom: 40 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderBottomWidth: 0.5 },
  headerInfo:   { flex: 1 },
  name:         { fontSize: 16 },
  plan:         { fontSize: 13, marginTop: 2 },
  section:      { paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  item:         { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 0.5 },
  itemLabel:    { flex: 1, fontSize: 15 },
});
