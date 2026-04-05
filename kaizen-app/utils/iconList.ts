/**
 * Ícones disponíveis no IconPicker, organizados por categoria.
 * Todos são nomes válidos de MaterialCommunityIcons.
 */
export interface IconCategory {
  label: string;
  icons: string[];
}

export const ICON_CATEGORIES: IconCategory[] = [
  {
    label: 'Saúde',
    icons: [
      'run', 'bicycle', 'swim', 'weight-lifter', 'yoga',
      'heart-pulse', 'sleep', 'food-apple', 'cup-water', 'pill',
      'smoking-off', 'glass-cocktail-off', 'candy-off', 'walk', 'meditation',
    ],
  },
  {
    label: 'Mente',
    icons: [
      'book-open-page-variant', 'notebook-edit', 'pencil', 'lightbulb',
      'brain', 'translate', 'music-note', 'palette', 'camera',
      'chess-knight', 'head-cog', 'thought-bubble', 'school', 'telescope',
    ],
  },
  {
    label: 'Finanças',
    icons: [
      'piggy-bank', 'currency-usd', 'credit-card-off', 'chart-line',
      'bank', 'cash', 'wallet', 'receipt', 'trending-up', 'calculator',
    ],
  },
  {
    label: 'Bem-estar',
    icons: [
      'heart', 'home-heart', 'handshake', 'account-group', 'flower',
      'leaf', 'weather-sunny', 'star', 'emoticon-happy', 'spa',
      'nature', 'dog', 'cat', 'baby-carriage',
    ],
  },
  {
    label: 'Produtividade',
    icons: [
      'check-circle', 'alarm', 'calendar-check', 'briefcase', 'laptop',
      'code-tags', 'email', 'phone', 'clock-outline', 'target',
      'trophy', 'flag', 'rocket', 'fire',
    ],
  },
];

/** Lista plana de todos os ícones (para busca). */
export const ALL_ICONS: string[] = ICON_CATEGORIES.flatMap((c) => c.icons);
