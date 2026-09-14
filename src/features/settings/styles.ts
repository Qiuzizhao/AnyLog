import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/src/shared/theme';

export const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  settingsSection: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  settingRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.md,
  },
  cardPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  settingIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  settingRowText: {
    flex: 1,
  },
  helperTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  bottomSpacer: {
    height: 16,
  },
  themeColorPanel: {
    gap: spacing.lg,
  },
  themePreview: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  themePreviewIcon: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  themePreviewText: {
    flex: 1,
  },
  themePreviewTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  themePreviewValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  themeColorGrid: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: 278,
  },
  themeColorSwatch: {
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 2,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
});
