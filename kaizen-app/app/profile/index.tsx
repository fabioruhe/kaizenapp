import {
  View, Text, TouchableOpacity, SafeAreaView,
  TextInput, ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import Avatar from '@/components/Avatar';
import { db } from '@/db/client';
import { habits, tasks, pomodoroSessions } from '@/db/schema';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useProStore } from '@/store/useProStore';
import { useTheme } from '@/hooks/useTheme';

interface Stats {
  activeHabits: number;
  bestStreak: number;
  tasksCompleted: number;
  focusMinutes: number;
}

async function fetchStats(userId: string): Promise<Stats> {
  const [h, t, ps] = await Promise.all([
    db.select().from(habits),
    db.select().from(tasks),
    db.select().from(pomodoroSessions),
  ]);
  return {
    activeHabits:   h.filter((r) => r.userId === userId && !r.deletedAt && r.isActive).length,
    tasksCompleted: t.filter((r) => r.userId === userId && r.isCompleted && !r.deletedAt).length,
    focusMinutes:   ps.filter((r) => r.userId === userId && !r.deletedAt)
                      .reduce((acc, r) => acc + (r.totalFocusMinutes ?? 0), 0),
    bestStreak: 0,
  };
}

const AVATAR_PATH = FileSystem.documentDirectory + 'avatar.jpg';

async function saveAvatarLocally(uri: string): Promise<string> {
  await FileSystem.copyAsync({ from: uri, to: AVATAR_PATH });
  // Append timestamp to bust the Image cache
  return AVATAR_PATH + '?t=' + Date.now();
}

async function deleteAvatarLocally(): Promise<void> {
  const info = await FileSystem.getInfoAsync(AVATAR_PATH);
  if (info.exists) await FileSystem.deleteAsync(AVATAR_PATH);
}

export default function ProfileScreen() {
  const { colors, typography, radius } = useTheme();
  const router      = useRouter();
  const userId      = useOnboardingStore((s) => s.userId);
  const userName    = useOnboardingStore((s) => s.userName);
  const setUserName = useOnboardingStore((s) => s.setUserName);
  const avatarUri   = useOnboardingStore((s) => s.avatarUri);
  const setAvatarUri = useOnboardingStore((s) => s.setAvatarUri);
  const streaks     = useHabitsStore((s) => s.streaks);
  const isPro       = useProStore((s) => s.isPro);

  const [stats, setStats]             = useState<Stats | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState(userName);

  const bestStreak = Math.max(0, ...Object.values(streaks).map((s) => s.best));

  useEffect(() => { fetchStats(userId).then(setStats); }, [userId]);

  async function saveName() {
    await setUserName(nameInput.trim());
    setEditingName(false);
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Permita o acesso à galeria nas configurações do dispositivo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const saved = await saveAvatarLocally(result.assets[0].uri);
      await setAvatarUri(saved);
    }
  }

  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Permita o acesso à câmera nas configurações do dispositivo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const saved = await saveAvatarLocally(result.assets[0].uri);
      await setAvatarUri(saved);
    }
  }

  async function removePhoto() {
    await deleteAvatarLocally();
    await setAvatarUri(null);
  }

  function openAvatarMenu() {
    const options: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
      { text: 'Câmera', onPress: pickFromCamera },
      { text: 'Galeria', onPress: pickFromGallery },
      { text: 'Cancelar', style: 'cancel' },
    ];
    if (avatarUri) {
      options.splice(2, 0, { text: 'Remover foto', style: 'destructive', onPress: removePhoto });
    }
    Alert.alert('Foto de perfil', undefined, options);
  }

  const STAT_ITEMS = [
    { icon: 'lightning-bolt', label: 'Hábitos ativos',   value: stats?.activeHabits,   color: colors.green500  },
    { icon: 'fire',           label: 'Melhor sequência', value: `${bestStreak}d`,       color: colors.amber     },
    { icon: 'check-circle',   label: 'Tarefas feitas',   value: stats?.tasksCompleted,  color: colors.blue500   },
    { icon: 'timer',          label: 'Min de foco',       value: stats?.focusMinutes,    color: colors.purple500 },
  ];

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.bg }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ marginRight: 12 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
          Perfil
        </Text>
      </View>

      <View style={s.avatarSection}>
        {/* Avatar tappable com badge de câmera */}
        <TouchableOpacity onPress={openAvatarMenu} activeOpacity={0.8} style={s.avatarWrap}>
          <Avatar name={userName} size={84} />
          <View style={[s.cameraBadge, { backgroundColor: colors.blue500, borderColor: colors.bg }]}>
            <MaterialCommunityIcons name="camera" size={12} color="#fff" />
          </View>
        </TouchableOpacity>

        {editingName ? (
          <View style={s.nameEdit}>
            <TextInput
              style={[s.nameInput, { backgroundColor: colors.surface2, color: colors.textPrimary, borderColor: colors.border, borderRadius: radius.md, fontFamily: typography.fontBody }]}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              maxLength={40}
              placeholderTextColor={colors.textTertiary}
              placeholder="Seu nome"
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            <TouchableOpacity
              style={[s.saveNameBtn, { backgroundColor: colors.blue500, borderRadius: radius.md }]}
              onPress={saveName}
            >
              <Text style={[s.saveNameTxt, { fontFamily: typography.fontBodyBold }]}>Salvar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={s.nameRow}
            onPress={() => { setNameInput(userName); setEditingName(true); }}
            activeOpacity={0.8}
          >
            <Text style={[s.name, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
              {userName || 'Toque para definir seu nome'}
            </Text>
            <MaterialCommunityIcons name="pencil" size={14} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[s.sectionLabel, { color: colors.textTertiary, fontFamily: typography.fontBodyBold }]}>
        Estatísticas
      </Text>

      {stats ? (
        <View style={s.statsGrid}>
          {STAT_ITEMS.map((item) => (
            <View key={item.label} style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
              <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
              <Text style={[s.statValue, { color: colors.textPrimary, fontFamily: typography.fontDisplayBold }]}>
                {item.value}
              </Text>
              <Text style={[s.statLabel, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <ActivityIndicator color={colors.blue500} style={{ marginTop: 24 }} />
      )}

      <View style={[s.planCard, { backgroundColor: isPro ? `${colors.amber}12` : colors.surface, borderColor: isPro ? colors.amber : colors.border, borderRadius: radius.lg, marginHorizontal: 16 }]}>
        <View style={s.planLeft}>
          <Text style={[s.planTitle, { color: colors.textPrimary, fontFamily: typography.fontBodyBold }]}>
            {isPro ? 'Plano Pro ✦' : 'Plano Free'}
          </Text>
          <Text style={[s.planDesc, { color: colors.textTertiary, fontFamily: typography.fontBody }]}>
            {isPro ? 'Todos os recursos desbloqueados' : 'Acesse todos os recursos essenciais'}
          </Text>
        </View>
        {!isPro && (
          <TouchableOpacity
            style={[s.proBtn, { backgroundColor: colors.amber, borderRadius: radius.md }]}
            onPress={() => router.push('/paywall')}
            activeOpacity={0.85}
          >
            <Text style={[s.proBtnTxt, { fontFamily: typography.fontBodyBold, color: '#000' }]}>Conhecer Pro</Text>
          </TouchableOpacity>
        )}
        {isPro && (
          <MaterialCommunityIcons name="crown" size={24} color={colors.amber} />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  title:       { fontSize: 17, flex: 1 },
  avatarSection:{ alignItems: 'center', paddingVertical: 24, gap: 12 },
  avatarWrap:  { position: 'relative' },
  cameraBadge: { position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name:        { fontSize: 18 },
  nameEdit:    { flexDirection: 'row', gap: 8, paddingHorizontal: 32, width: '100%' },
  nameInput:   { flex: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, borderWidth: 0.5 },
  saveNameBtn: { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  saveNameTxt: { color: '#fff', fontSize: 14 },
  sectionLabel:{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, paddingHorizontal: 16, marginBottom: 10 },
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 24 },
  statCard:    { flex: 1, minWidth: '44%', borderWidth: 0.5, padding: 16, alignItems: 'center', gap: 6 },
  statValue:   { fontSize: 22 },
  statLabel:   { fontSize: 12, textAlign: 'center' },
  planCard:    { padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 0.5 },
  planLeft:    { flex: 1 },
  planTitle:   { fontSize: 15 },
  planDesc:    { fontSize: 13, marginTop: 2 },
  proBtn:      { paddingHorizontal: 14, paddingVertical: 8 },
  proBtnTxt:   { color: '#fff', fontSize: 13 },
});
