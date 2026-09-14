import { SETTINGS_PRESET_COLORS } from '@/src/features/settings/components/colorPalette';

export const checkinColorOptions = Array.from(new Set([
  '#22C55E',
  '#0EA5E9',
  '#F97316',
  '#A855F7',
  '#EF4444',
  '#64748B',
  ...SETTINGS_PRESET_COLORS,
]));

export const checkinEmojiOptions = [
  '✓', '📚', '📝', '✍️', '🎧', '🧠', '🎯', '📖',
  '🏃', '🚶', '🏋️', '🚴', '🏀', '⚽️', '🧘', '💪',
  '💧', '🥗', '🍎', '☕️', '🍵', '🌙', '⏰', '🛏️',
  '💻', '📅', '📌', '📦', '📊', '💰', '💳', '📈',
  '🧹', '🧺', '🍳', '🛒', '🪴', '🏠', '🧴', '💊',
  '🎨', '🎹', '🎬', '🎮', '📷', '🧩', '🧵', '🎤',
  '❤️', '😊', '🙏', '💬', '📞', '🎁', '⭐️', '🔥',
];
