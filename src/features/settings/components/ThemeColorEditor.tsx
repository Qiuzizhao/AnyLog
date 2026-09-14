import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { colors, useThemeSettings } from '@/src/shared/theme';
import { styles } from '../styles';
import { SETTINGS_PRESET_COLORS } from './colorPalette';

export function ThemeColorEditor() {
  const { colors: themeColors, setThemePrimaryColor, themePrimaryColor } = useThemeSettings();

  return (
    <View style={styles.themeColorPanel}>
      <View style={[styles.themePreview, { borderColor: themeColors.primarySoft }]}>
        <View style={[styles.themePreviewIcon, { backgroundColor: themeColors.primarySoft }]}>
          <Ionicons name="color-palette-outline" size={22} color={themeColors.primary} />
        </View>
        <View style={styles.themePreviewText}>
          <Text style={styles.themePreviewTitle}>当前主题色</Text>
          <Text style={[styles.themePreviewValue, { color: themeColors.primary }]}>{themePrimaryColor}</Text>
        </View>
      </View>

      <View style={styles.themeColorGrid}>
        {SETTINGS_PRESET_COLORS.map((color) => {
          const selected = themeColors.primary === color;
          return (
            <Pressable
              accessibilityRole="button"
              key={color}
              onPress={() => void setThemePrimaryColor(color)}
              style={({ pressed }) => [
                styles.themeColorSwatch,
                {
                  backgroundColor: color,
                  borderColor: selected ? colors.text : 'transparent',
                },
                pressed && { opacity: 0.72 },
              ]}
            >
              {selected ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
