export const Colors = {
  light: {
    bg:       '#F8F9FA',
    surface:  '#EDF2FB',
    surface2: '#F1F5F9',
    surface3: '#E8EEF6',
    border:   '#E2E8F0',
    border2:  '#CBD5E1',

    textPrimary:   '#1E293B',
    textSecondary: '#64748B',
    textTertiary:  '#94A3B8',

    blue100: '#DBEAFE',
    blue500: '#3B72D9',
    blue700: '#1E4BAA',

    green100: '#D1FAE5',
    green500: '#2A9D60',
    green700: '#166534',

    purple100: '#EDE9FE',
    purple500: '#8B5CF6',
    purple700: '#5B21B6',

    amber: '#F59E0B',
    red:   '#EF4444',

    gradientTop: ['#3B72D9', '#8B5CF6', '#2A9D60'] as string[],
  },

  dark: {
    bg:       '#0F172A',
    surface:  '#1E293B',
    surface2: '#263347',
    surface3: '#334155',
    border:   '#334155',
    border2:  '#475569',

    textPrimary:   '#F1F5F9',
    textSecondary: '#94A3B8',
    textTertiary:  '#475569',

    blue100: '#1E3A5F',
    blue500: '#60A5FA',
    blue700: '#93C5FD',

    green100: '#064E3B',
    green500: '#34D399',
    green700: '#6EE7B7',

    purple100: '#2E1065',
    purple500: '#A78BFA',
    purple700: '#C4B5FD',

    amber: '#FBBF24',
    red:   '#F87171',

    gradientTop: ['#60A5FA', '#A78BFA', '#34D399'] as string[],
  },
} as const;

export const Typography = {
  fontDisplay:        'PlusJakartaSans_800ExtraBold',
  fontDisplayBold:    'PlusJakartaSans_700Bold',
  fontDisplaySemiBold:'PlusJakartaSans_600SemiBold',
  fontBody:           'DMSans_400Regular',
  fontBodyMedium:     'DMSans_500Medium',
  fontBodyBold:       'DMSans_700Bold',

  size: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   18,
    xl:   22,
    xxl:  28,
    hero: 36,
  },

  lineHeight: {
    tight:   1.1,
    normal:  1.5,
    relaxed: 1.65,
  },
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
} as const;

export const Radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  full: 999,
} as const;

export const BorderWidth = {
  thin: 0.5,
  base: 1,
} as const;
