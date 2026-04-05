import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
} from '@/utils/notificationScheduler';
import { useTheme } from '@/hooks/useTheme';

const NIETZSCHE_QUOTE  = '"Aquele que tem um porquê para viver\npode suportar quase qualquer como."';
const NIETZSCHE_AUTHOR = '— Friedrich Nietzsche';
const MOTIVATIONAL_TEXT = 'Toda grande transformação começa com uma decisão.\nEsta é a sua.';

type Step = 'why' | 'notifications';

export default function OnboardingScreen() {
  const { colors, typography, radius } = useTheme();
  const router   = useRouter();
  const complete                   = useOnboardingStore((s) => s.complete);
  const saveNotificationPermission = useOnboardingStore((s) => s.saveNotificationPermission);

  const [step, setStep]       = useState<Step>('why');
  const [why, setWhy]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const isValid = why.trim().length >= 10;

  async function handleWhySubmit() {
    if (!isValid) { setError('Escreva pelo menos 10 caracteres.'); return; }
    setError('');
    setLoading(true);
    try {
      await complete(why.trim());
      const current = await getNotificationPermissionStatus();
      if (current === 'granted') {
        await saveNotificationPermission('granted');
        router.replace('/(tabs)/habits');
      } else {
        setStep('notifications');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAllow() {
    setLoading(true);
    try {
      const result = await requestNotificationPermission();
      await saveNotificationPermission(result);
    } finally {
      setLoading(false);
      router.replace('/(tabs)/habits');
    }
  }

  async function handleSkipNotifications() {
    await saveNotificationPermission('denied');
    router.replace('/(tabs)/habits');
  }

  if (step === 'notifications') {
    return (
      <NotificationPermissionStep
        loading={loading}
        onAllow={handleAllow}
        onSkip={handleSkipNotifications}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={[s.kav, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <View style={s.top}>
          <Text style={[s.appName, { color: colors.blue500, fontFamily: typography.fontDisplay }]}>
            Kaizen
          </Text>
          <Text style={[s.appSub, { color: colors.textTertiary, fontFamily: typography.fontBodyMedium }]}>
            melhoria contínua
          </Text>
          <Text style={[s.quote, { color: colors.textPrimary, fontFamily: typography.fontDisplaySemiBold }]}>
            {NIETZSCHE_QUOTE}
          </Text>
          <Text style={[s.author, { color: colors.textSecondary, fontFamily: typography.fontBody }]}>
            {NIETZSCHE_AUTHOR}
          </Text>
        </View>

        <View style={s.mid}>
          <Text style={[s.motivational, { color: colors.textSecondary, fontFamily: typography.fontBodyMedium }]}>
            {MOTIVATIONAL_TEXT}
          </Text>

          <Text style={[s.inputLabel, { color: colors.textPrimary, fontFamily: typography.fontBodyBold }]}>
            Qual é o seu porquê?
          </Text>
          <TextInput
            style={[s.input, {
              backgroundColor: colors.surface2,
              color: colors.textPrimary,
              borderColor: colors.border,
              borderRadius: radius.md,
              fontFamily: typography.fontBody,
            }]}
            placeholder="Escreva aqui a sua motivação..."
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
            value={why}
            onChangeText={(v) => { setWhy(v); if (error) setError(''); }}
            maxLength={500}
          />

          {error ? (
            <Text style={[s.errorTxt, { color: colors.red, fontFamily: typography.fontBody }]}>{error}</Text>
          ) : (
            <Text style={[s.counter, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
              {why.trim().length}/500
            </Text>
          )}
        </View>

        <View style={s.bottom}>
          <TouchableOpacity
            style={[
              s.submitBtn,
              { borderRadius: radius.md },
              isValid ? { backgroundColor: colors.blue500 } : { backgroundColor: colors.surface2 },
            ]}
            onPress={handleWhySubmit}
            disabled={loading || !isValid}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={[
                  s.submitTxt,
                  { fontFamily: typography.fontBodyBold },
                  !isValid && { color: colors.textTertiary },
                ]}>
                  Começar minha jornada
                </Text>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function NotificationPermissionStep({ loading, onAllow, onSkip }: { loading: boolean; onAllow(): void; onSkip(): void }) {
  const { colors, typography, radius } = useTheme();

  return (
    <View style={[s.kav, { backgroundColor: colors.bg }]}>
      <View style={sn.container}>
        <View style={[sn.iconBox, { backgroundColor: colors.blue100, borderRadius: radius.xl }]}>
          <MaterialCommunityIcons name="bell-ring" size={48} color={colors.blue500} />
        </View>

        <Text style={[sn.title, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
          Posso te lembrar{'\n'}dos seus hábitos?
        </Text>
        <Text style={[sn.body, { color: colors.textSecondary, fontFamily: typography.fontBody }]}>
          Ative os lembretes para receber notificações no horário certo e manter
          sua consistência. Você pode configurar ou desativar a qualquer momento.
        </Text>

        <TouchableOpacity
          style={[sn.btnAllow, { backgroundColor: colors.blue500, borderRadius: radius.md }]}
          onPress={onAllow}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={[sn.btnAllowTxt, { fontFamily: typography.fontBodyBold }]}>Permitir notificações</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={sn.btnSkip} onPress={onSkip} disabled={loading} activeOpacity={0.7}>
          <Text style={[sn.btnSkipTxt, { color: colors.textTertiary, fontFamily: typography.fontBodyMedium }]}>
            Agora não
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  kav:        { flex: 1 },
  scroll:     { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 64 },
  top:        { alignItems: 'center' },
  appName:    { fontSize: 36, textAlign: 'center', marginBottom: 8 },
  appSub:     { fontSize: 13, textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 48 },
  quote:      { fontSize: 18, fontStyle: 'italic', textAlign: 'center', lineHeight: 30, marginBottom: 8 },
  author:     { fontSize: 13, textAlign: 'center' },
  mid:        { marginTop: 56 },
  motivational:{ fontSize: 16, textAlign: 'center', lineHeight: 26, marginBottom: 40 },
  inputLabel: { fontSize: 16, marginBottom: 12 },
  input:      { fontSize: 16, paddingHorizontal: 16, paddingVertical: 12, minHeight: 100, borderWidth: 0.5 },
  errorTxt:   { fontSize: 13, marginTop: 8 },
  counter:    { fontSize: 12, marginTop: 8, textAlign: 'right' },
  bottom:     { marginTop: 40 },
  submitBtn:  { paddingVertical: 16, alignItems: 'center' },
  submitTxt:  { color: '#fff', fontSize: 16 },
});

const sn = StyleSheet.create({
  container:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconBox:     { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  title:       { fontSize: 26, textAlign: 'center', lineHeight: 34, marginBottom: 16 },
  body:        { fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  btnAllow:    { width: '100%', paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  btnAllowTxt: { color: '#fff', fontSize: 16 },
  btnSkip:     { paddingVertical: 12 },
  btnSkipTxt:  { fontSize: 15 },
});
