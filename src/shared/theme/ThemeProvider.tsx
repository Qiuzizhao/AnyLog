import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { defaultThemePrimaryColor, getSettingsLocal, saveSettingsLocal } from '@/src/local/settingsRepository';
import { buildThemeColors, type RuntimeThemeColors } from './themeUtils';

type ThemeContextValue = {
  colors: RuntimeThemeColors;
  themePrimaryColor: string;
  setThemePrimaryColor: (color: string) => Promise<void>;
  refreshThemeFromSettings: () => Promise<void>;
};

const defaultPrimary = defaultThemePrimaryColor;

const ThemeContext = createContext<ThemeContextValue>({
  colors: buildThemeColors(defaultPrimary),
  themePrimaryColor: defaultPrimary,
  setThemePrimaryColor: async () => undefined,
  refreshThemeFromSettings: async () => undefined,
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themePrimaryColor, setThemePrimaryColorState] = useState(defaultPrimary);

  const refreshThemeFromSettings = useCallback(async () => {
    const settings = await getSettingsLocal();
    setThemePrimaryColorState(settings.theme_primary_color || defaultPrimary);
  }, []);

  useEffect(() => {
    void refreshThemeFromSettings();
  }, [refreshThemeFromSettings]);

  const setThemePrimaryColor = useCallback(async (color: string) => {
    const normalizedColor = buildThemeColors(color).primary;
    await saveSettingsLocal({ theme_primary_color: normalizedColor });
    setThemePrimaryColorState(normalizedColor);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    colors: buildThemeColors(themePrimaryColor),
    refreshThemeFromSettings,
    setThemePrimaryColor,
    themePrimaryColor,
  }), [refreshThemeFromSettings, setThemePrimaryColor, themePrimaryColor]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeColors() {
  return useContext(ThemeContext).colors;
}

export function useThemeSettings() {
  return useContext(ThemeContext);
}
