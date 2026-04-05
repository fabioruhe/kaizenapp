/**
 * Alias de compatibilidade — mantido durante a migração para o design system.
 * Novos componentes devem usar useTheme() de @/hooks/useTheme.
 * @deprecated Use `useTheme()` de @/hooks/useTheme
 */
import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

// Exporta as cores do modo dark (comportamento original do app)
export const colors = {
  bg:          Colors.dark.bg,
  bgCard:      Colors.dark.surface,
  bgInput:     Colors.dark.surface2,
  border:      Colors.dark.border2,
  borderLight: Colors.dark.border,
  text:        Colors.dark.textPrimary,
  textMuted:   Colors.dark.textSecondary,
  textFaint:   Colors.dark.textTertiary,
  yellow:      Colors.dark.amber,
  yellowBg:    Colors.dark.purple100,   // usado como bg de destaque
  green:       Colors.dark.green500,
  greenBg:     Colors.dark.green100,
  red:         Colors.dark.red,
  redBg:       Colors.dark.purple100,
  priorityHigh:   Colors.dark.red,
  priorityMedium: Colors.dark.amber,
  priorityLow:    Colors.dark.textTertiary,
};

export const t = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: colors.bg },
  card:        { backgroundColor: colors.bgCard, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 0.5, borderColor: colors.borderLight },
  input:       { backgroundColor: colors.bgInput, color: colors.text, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 0.5, borderColor: colors.border, fontSize: 15 },
  label:       { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 8 },
  title:       { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  muted:       { color: colors.textMuted, fontSize: 15 },
  faint:       { color: colors.textFaint, fontSize: 13 },
  row:         { flexDirection: 'row', alignItems: 'center' },
  btnYellow:   { backgroundColor: colors.yellow, borderRadius: 10, paddingVertical: 12, alignItems: 'center' as const },
  btnYellowTxt:{ color: '#fff', fontWeight: 'bold', fontSize: 15 },
  btnGray:     { backgroundColor: colors.bgCard, borderRadius: 10, paddingVertical: 12, alignItems: 'center' as const, borderWidth: 0.5, borderColor: colors.border },
  btnGrayTxt:  { color: colors.textFaint, fontSize: 15 },
  section:     { paddingTop: 20, paddingBottom: 8 },
  sectionTxt:  { color: colors.textFaint, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1.5, fontWeight: '600' },
});
