import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/hooks/useTheme';

type Mode = 'signin' | 'signup' | 'reset';

export default function LoginScreen() {
  const { colors, typography, radius } = useTheme();
  const router   = useRouter();
  const { signIn, signUp, resetPassword } = useAuthStore();

  const [mode, setMode]         = useState<Mode>('signin');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [showPw, setShowPw]     = useState(false);

  function validate(): string | null {
    if (!email.trim() || !email.includes('@')) return 'Informe um e-mail válido.';
    if (mode === 'reset') return null;
    if (password.length < 6) return 'A senha precisa ter ao menos 6 caracteres.';
    if (mode === 'signup' && password !== confirm) return 'As senhas não conferem.';
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'reset') {
        const { error } = await resetPassword(email.trim().toLowerCase());
        if (error) { setError(error.message); return; }
        setSuccess('Enviamos um link de redefinição para o seu e-mail.');
        setMode('signin');
        return;
      }

      if (mode === 'signup') {
        const { error } = await signUp(email.trim().toLowerCase(), password);
        if (error) { setError(error.message); return; }
        setSuccess('Conta criada! Verifique seu e-mail para confirmar.');
        setMode('signin');
        return;
      }

      // signin
      const { error } = await signIn(email.trim().toLowerCase(), password);
      if (error) { setError(error.message); return; }
      // Navegação tratada pelo _layout que observa a sessão
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = [
    s.input,
    {
      backgroundColor: colors.surface2,
      color: colors.textPrimary,
      borderColor: colors.border,
      borderRadius: radius.md,
      fontFamily: typography.fontBody,
    },
  ];

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / título */}
          <View style={s.logoArea}>
            <View style={[s.logoCircle, { backgroundColor: colors.blue100, borderRadius: radius.xl }]}>
              <MaterialCommunityIcons name="leaf" size={40} color={colors.blue500} />
            </View>
            <Text style={[s.appName, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
              Kaizen
            </Text>
            <Text style={[s.tagline, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
              Melhoria contínua, um dia de cada vez.
            </Text>
          </View>

          {/* Tabs de modo */}
          {mode !== 'reset' && (
            <View style={[s.tabs, { backgroundColor: colors.surface2, borderRadius: radius.md }]}>
              {(['signin', 'signup'] as Mode[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    s.tab,
                    { borderRadius: radius.md },
                    mode === m && { backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
                  ]}
                  onPress={() => { setMode(m); setError(''); setSuccess(''); }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    s.tabTxt,
                    { fontFamily: mode === m ? typography.fontBodyBold : typography.fontBodyMedium },
                    { color: mode === m ? colors.textPrimary : colors.textTertiary },
                  ]}>
                    {m === 'signin' ? 'Entrar' : 'Criar conta'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {mode === 'reset' && (
            <TouchableOpacity onPress={() => { setMode('signin'); setError(''); }} style={s.backRow}>
              <MaterialCommunityIcons name="arrow-left" size={18} color={colors.textSecondary} />
              <Text style={[s.backTxt, { color: colors.textSecondary, fontFamily: typography.fontBodyMedium }]}>
                Voltar ao login
              </Text>
            </TouchableOpacity>
          )}

          {/* Formulário */}
          <View style={s.form}>
            {mode === 'reset' && (
              <Text style={[s.resetHint, { color: colors.textSecondary, fontFamily: typography.fontBody }]}>
                Digite seu e-mail e enviaremos um link para redefinir sua senha.
              </Text>
            )}

            <Text style={[s.label, { color: colors.textPrimary, fontFamily: typography.fontBodyBold }]}>E-mail</Text>
            <TextInput
              style={inputStyle}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
              placeholder="seu@email.com"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType={mode === 'reset' ? 'done' : 'next'}
              onSubmitEditing={mode === 'reset' ? handleSubmit : undefined}
            />

            {mode !== 'reset' && (
              <>
                <Text style={[s.label, { color: colors.textPrimary, fontFamily: typography.fontBodyBold, marginTop: 16 }]}>
                  Senha
                </Text>
                <View style={s.pwRow}>
                  <TextInput
                    style={[inputStyle, { flex: 1 }]}
                    value={password}
                    onChangeText={(v) => { setPassword(v); setError(''); }}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showPw}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    returnKeyType={mode === 'signup' ? 'next' : 'done'}
                    onSubmitEditing={mode === 'signin' ? handleSubmit : undefined}
                  />
                  <TouchableOpacity onPress={() => setShowPw((v) => !v)} hitSlop={8} style={s.eyeBtn}>
                    <MaterialCommunityIcons
                      name={showPw ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {mode === 'signup' && (
              <>
                <Text style={[s.label, { color: colors.textPrimary, fontFamily: typography.fontBodyBold, marginTop: 16 }]}>
                  Confirmar senha
                </Text>
                <TextInput
                  style={inputStyle}
                  value={confirm}
                  onChangeText={(v) => { setConfirm(v); setError(''); }}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPw}
                  autoComplete="new-password"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              </>
            )}

            {error ? (
              <View style={[s.errorBox, { backgroundColor: `${colors.red}12`, borderColor: `${colors.red}30`, borderRadius: radius.sm }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.red} />
                <Text style={[s.errorTxt, { color: colors.red, fontFamily: typography.fontBody }]}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={[s.successBox, { backgroundColor: `${colors.green500}12`, borderColor: `${colors.green500}30`, borderRadius: radius.sm }]}>
                <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.green500} />
                <Text style={[s.successTxt, { color: colors.green500, fontFamily: typography.fontBody }]}>{success}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[s.submitBtn, { backgroundColor: colors.blue500, borderRadius: radius.md }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={[s.submitTxt, { fontFamily: typography.fontBodyBold }]}>
                    {mode === 'signin' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link'}
                  </Text>
              }
            </TouchableOpacity>

            {mode === 'signin' && (
              <TouchableOpacity
                style={s.forgotBtn}
                onPress={() => { setMode('reset'); setError(''); setSuccess(''); }}
              >
                <Text style={[s.forgotTxt, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                  Esqueceu a senha?
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:     { flex: 1 },
  content:    { padding: 24, paddingTop: 48, flexGrow: 1 },
  logoArea:   { alignItems: 'center', marginBottom: 32, gap: 8 },
  logoCircle: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  appName:    { fontSize: 28 },
  tagline:    { fontSize: 14, textAlign: 'center' },
  tabs:       { flexDirection: 'row', padding: 4, marginBottom: 24 },
  tab:        { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabTxt:     { fontSize: 14 },
  backRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backTxt:    { fontSize: 14 },
  form:       { gap: 4 },
  resetHint:  { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  label:      { fontSize: 14, marginBottom: 6, marginTop: 4 },
  input:      { paddingHorizontal: 16, paddingVertical: 13, borderWidth: 0.5, fontSize: 15 },
  pwRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn:     { padding: 4 },
  errorBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderWidth: 0.5, marginTop: 12 },
  errorTxt:   { flex: 1, fontSize: 13, lineHeight: 18 },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderWidth: 0.5, marginTop: 12 },
  successTxt: { flex: 1, fontSize: 13, lineHeight: 18 },
  submitBtn:  { paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  submitTxt:  { color: '#fff', fontSize: 15 },
  forgotBtn:  { alignItems: 'center', paddingVertical: 12 },
  forgotTxt:  { fontSize: 13 },
});
