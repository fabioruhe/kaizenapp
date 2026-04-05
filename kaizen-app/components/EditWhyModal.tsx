import {
  Modal, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  visible: boolean;
  currentWhy: string;
  onSave(why: string): void;
  onCancel(): void;
}

export default function EditWhyModal({ visible, currentWhy, onSave, onCancel }: Props) {
  const { colors, typography, radius } = useTheme();
  const [text, setText] = useState(currentWhy);
  const [error, setError] = useState('');

  useEffect(() => { if (visible) setText(currentWhy); }, [visible, currentWhy]);

  const isValid = text.trim().length >= 10;

  function handleSave() {
    if (!isValid) { setError('Mínimo de 10 caracteres.'); return; }
    setError('');
    onSave(text.trim());
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[s.sheet, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Text style={[s.title, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
            Editar seu porquê
          </Text>
          <Text style={[s.subtitle, { color: colors.textSecondary, fontFamily: typography.fontBody }]}>
            Seu porquê é a força que te mantém em movimento.
          </Text>

          <TextInput
            style={[s.input, {
              backgroundColor: colors.surface2,
              color: colors.textPrimary,
              borderColor: colors.border,
              borderRadius: radius.md,
              fontFamily: typography.fontBody,
            }]}
            value={text}
            onChangeText={(v) => { setText(v); if (error) setError(''); }}
            multiline
            autoFocus
            maxLength={300}
            placeholderTextColor={colors.textTertiary}
            placeholder="Por que você quer mudar?"
          />

          <Text style={[s.counter, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
            {text.trim().length}/300
          </Text>

          {error ? (
            <Text style={[s.error, { color: colors.red, fontFamily: typography.fontBody }]}>{error}</Text>
          ) : null}

          <View style={s.actions}>
            <TouchableOpacity
              style={[s.cancelBtn, { backgroundColor: colors.surface2, borderRadius: radius.md }]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={[s.cancelTxt, { color: colors.textSecondary, fontFamily: typography.fontBodyMedium }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.saveBtn,
                { borderRadius: radius.md },
                isValid ? { backgroundColor: colors.blue500 } : { backgroundColor: colors.surface2 },
              ]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={[
                s.saveTxt,
                { fontFamily: typography.fontBodyBold },
                !isValid && { color: colors.textTertiary },
              ]}>
                Salvar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:     { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 0.5, padding: 24, paddingBottom: 40 },
  title:     { fontSize: 18, marginBottom: 6 },
  subtitle:  { fontSize: 14, marginBottom: 20 },
  input:     { padding: 14, minHeight: 100, textAlignVertical: 'top', fontSize: 15, borderWidth: 0.5 },
  counter:   { fontSize: 12, textAlign: 'right', marginTop: 6 },
  error:     { fontSize: 13, marginTop: 8 },
  actions:   { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  cancelTxt: { fontSize: 15 },
  saveBtn:   { flex: 1, paddingVertical: 14, alignItems: 'center' },
  saveTxt:   { color: '#fff', fontSize: 15 },
});
