import { StyleSheet } from 'react-native';

import { colors, radius, shadow, spacing } from '@/src/shared/theme';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 44,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.brandSoft, // 企业微信风格浅蓝色背景
    zIndex: 10,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCentered: {
    // 移除 gap，由 side 元素控制平衡
  },
  headerSide: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 88,
  },
  headerSideLeft: {
    alignItems: 'flex-start',
  },
  headerSideRight: {
    alignItems: 'flex-end',
  },
  headerTextCentered: {
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  title: {
    color: colors.text, // 标题栏字体改为黑色
    fontSize: 17, // 17px 是 iOS 标准标题大小，更显精致
    fontWeight: '700',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.text, // 副标题改为黑色
    opacity: 0.6,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
    textTransform: 'uppercase', // 教务感
    letterSpacing: 0.5,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.xl, // 使用小圆角
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.xl,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonPlain: {
    backgroundColor: colors.primarySoft,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPlainText: {
    color: colors.primary,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: radius.xl, // 使用小圆角
    backgroundColor: colors.surfaceMuted,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconButtonSoft: {
    backgroundColor: colors.primarySoft,
  },
  iconButtonTransparent: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl, // 使用小圆角
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  bottomSheetBg: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
  },
  bottomSheetIndicator: {
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 4,
    width: 40,
    marginTop: 8,
  },
  sheetContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  field: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  fieldTight: {
    marginBottom: spacing.sm,
  },
  fieldCompact: {
    flex: 1,
  },
  fieldInline: {
    gap: 0,
    justifyContent: 'center',
    marginBottom: 0,
  },
  fieldLabel: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    color: colors.text,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
  },
  inputCompact: {
    minHeight: 50,
    borderRadius: radius.md,
  },
  inputMultiline: {
    minHeight: 120,
    paddingTop: spacing.lg,
    textAlignVertical: 'top',
  },
  dateInput: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dateInputInline: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 0,
    justifyContent: 'flex-end',
    minHeight: 26,
    paddingHorizontal: 0,
  },
  dateInputInlinePill: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.md,
    paddingVertical: 0,
  },
  dateInputText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  dateInputTextCompact: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateInputTextInline: {
    color: colors.primary,
  },
  dateInputTextInlinePill: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  dateInputPlaceholder: {
    color: colors.faint,
  },
  pickerOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.24)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  pickerBottomOverlay: {
    justifyContent: 'flex-end',
    paddingBottom: spacing.xxl,
  },
  pickerPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxWidth: 360,
    padding: spacing.lg,
    width: '100%',
  },
  datePickerPanel: {
    alignSelf: 'center',
    borderRadius: radius.xxl,
    overflow: 'hidden',
    ...shadow,
    elevation: 8,
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  pickerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  pickerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekText: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 0,
  },
  dayCell: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 36,
    justifyContent: 'center',
    width: '14.285%',
  },
  dayCellText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  dayCellMuted: {
    color: colors.faint,
  },
  todayCell: {
    backgroundColor: colors.primarySoft,
  },
  pickerCellSelected: {
    backgroundColor: colors.primary,
  },
  pickerCellTextSelected: {
    color: '#fff',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  monthCell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    width: '30%',
  },
  monthCellText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  pickerFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
  },
  optionList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  optionRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  optionRowSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  optionRowText: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  pickerContainer: {
    flexDirection: 'row',
    height: 150,
    marginVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerItem: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemText: {
    fontSize: 18,
    color: colors.muted,
    fontWeight: '600',
  },
  pickerItemTextSelected: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  pickerIndicator: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: colors.primarySoft,
    zIndex: -1,
  },
  pickerColumnOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: colors.surface,
    zIndex: 10,
    opacity: 0.95,
  },
  pickerOverlayTop: {
    top: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerOverlayBottom: {
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pickerSeparator: {
    width: 1,
    backgroundColor: colors.border,
    height: 30,
    alignSelf: 'center',
    zIndex: 11,
    opacity: 0.3,
  },
  timeSectionTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  segmented: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  segmentedLarge: {
    paddingHorizontal: 0,
    width: '100%',
  },
  segment: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  segmentLarge: {
    flex: 1,
    minHeight: 48,
  },
  segmentSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  segmentText: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextLarge: {
    fontWeight: '700',
  },
  segmentTextSelected: {
    color: colors.primary,
  },
  state: {
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  stateTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  stateText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
