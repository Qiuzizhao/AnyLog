import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import React, { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import {
  ActivityIndicator,
  AppState,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';

import { colors, spacing, useThemeColors } from '@/src/shared/theme';
import { colorWithAlpha } from '@/src/shared/utils';

export { FloatingSegmentedTabBar } from './FloatingSegmentedTabBar';
export type { FloatingSegmentedTabOption } from './FloatingSegmentedTabBar';

export function Screen({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" backgroundColor={colors.brandSoft} translucent />
      <View style={{ height: insets.top, backgroundColor: colors.brandSoft }} />
      {children}
    </View>
  );
}

export function Header({
  title,
  subtitle: _subtitle,
  action,
  rightAction,
  centered: _centered,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  rightAction?: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <View style={styles.header}>
      <View style={[styles.headerSide, styles.headerSideLeft]}>{action}</View>
      <View style={styles.headerText}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      <View style={[styles.headerSide, styles.headerSideRight]}>{rightAction}</View>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  tone = 'primary',
  style,
  textStyle,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  tone?: 'primary' | 'danger' | 'plain';
  style?: object | object[];
  textStyle?: object | object[];
}) {
  const plain = tone === 'plain';
  const themeColors = useThemeColors();

  // Resolve colors for style overrides
  const resolvedTextStyle = Array.isArray(textStyle) ? Object.assign({}, ...textStyle) : (textStyle || {});

  const iconColor = plain
    ? (resolvedTextStyle.color || themeColors.primary)
    : (resolvedTextStyle.color || '#fff');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: themeColors.primary },
        tone === 'danger' && styles.buttonDanger,
        plain && [styles.buttonPlain, { backgroundColor: themeColors.primarySoft }],
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <View style={styles.buttonContent}>
        {icon ? <Ionicons name={icon} size={18} color={iconColor} /> : null}
        <Text style={[styles.buttonText, plain && [styles.buttonPlainText, { color: themeColors.primary }], textStyle]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function IconButton({
  name,
  onPress,
  color,
  label,
  soft,
  transparent,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  label?: string;
  soft?: boolean;
  transparent?: boolean;
}) {
  const themeColors = useThemeColors();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        soft && [styles.iconButtonSoft, { backgroundColor: themeColors.primarySoft }],
        transparent && styles.iconButtonTransparent,
        pressed && styles.pressed,
      ]}>
      <Ionicons name={name} size={21} color={color || colors.text} />
    </Pressable>
  );
}

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

export function FormSheet({
  bottomSheetRef,
  children,
  snapPoints = ['85%'],
  contentStyle,
  lockHeight = false,
}: PropsWithChildren<{
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  snapPoints?: string[];
  contentStyle?: object;
  lockHeight?: boolean;
}>) {
  const appStateRef = useRef(AppState.currentState);
  const sheetOpenRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;

    const subscription = AppState.addEventListener('change', (nextState) => {
      const returningActive = nextState === 'active' && appStateRef.current !== 'active';
      const leavingActive = appStateRef.current === 'active' && nextState !== 'active';

      if (leavingActive) {
        Keyboard.dismiss();
      }

      if (returningActive && sheetOpenRef.current) {
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = setTimeout(() => {
          Keyboard.dismiss();
          bottomSheetRef.current?.snapToIndex(0);
        }, 120);
      }

      appStateRef.current = nextState;
    });

    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      subscription.remove();
    };
  }, [bottomSheetRef]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={0}
      enableDynamicSizing={!lockHeight}
      enableOverDrag={!lockHeight}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backdropComponent={(props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />}
      backgroundStyle={styles.bottomSheetBg}
      handleIndicatorStyle={styles.bottomSheetIndicator}
      onChange={(index) => {
        sheetOpenRef.current = index >= 0;
      }}
    >
      <BottomSheetScrollView contentContainerStyle={[styles.sheetContent, contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

export function SheetTextInput({ value, onChangeText, onBlur, sheet = true, ...props }: TextInputProps & { sheet?: boolean }) {
  const [localValue, setLocalValue] = useState(value == null ? '' : String(value));
  const localValueRef = useRef(localValue);
  const composingRef = useRef(false);
  const InputComponent = sheet && Platform.OS !== 'web' ? BottomSheetTextInput : TextInput;

  useEffect(() => {
    const nextValue = value == null ? '' : String(value);
    if (composingRef.current && nextValue !== '') return;
    if (nextValue === '') composingRef.current = false;
    localValueRef.current = nextValue;
    setLocalValue(nextValue);
  }, [value]);

  const syncText = (text: string) => {
    localValueRef.current = text;
    setLocalValue(text);
  };

  const commitText = (text: string) => {
    syncText(text);
    onChangeText?.(text);
  };

  const inputProps: TextInputProps & Record<string, unknown> = {
    ...props,
    value: localValue,
    onChangeText: (text: string) => {
      if (Platform.OS === 'web' && composingRef.current) {
        syncText(text);
        return;
      }
      syncText(text);
      onChangeText?.(text);
    },
    onBlur: (event) => {
      composingRef.current = false;
      const propValue = value == null ? '' : String(value);
      if (localValueRef.current !== propValue) {
        onChangeText?.(localValueRef.current);
      }
      onBlur?.(event);
    },
  };

  if (Platform.OS === 'web') {
    inputProps.onCompositionStart = () => {
      composingRef.current = true;
    };
    inputProps.onCompositionEnd = (event: any) => {
      composingRef.current = false;
      const text = String(event?.currentTarget?.value ?? event?.target?.value ?? localValueRef.current);
      commitText(text);
    };
  }

  return <InputComponent {...inputProps} />;
}

export function Field({ label, sheet = true, ...props }: TextInputProps & { label: string; sheet?: boolean }) {
  const multilineScrollEnabled = props.multiline ? false : props.scrollEnabled;

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <SheetTextInput
        placeholderTextColor={colors.faint}
        style={[styles.input, props.multiline && styles.inputMultiline]}
        sheet={sheet}
        scrollEnabled={multilineScrollEnabled}
        {...props}
      />
    </View>
  );
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function dateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function yearString(date: Date) {
  return String(date.getFullYear());
}

function weekString(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${pad(week)}`;
}

function parsePickerDate(value?: string, mode: 'date' | 'month' | 'year' | 'week' = 'date') {
  const now = new Date();
  if (!value) return now;
  if (mode === 'year') {
    const y = Number(value);
    if (!isNaN(y)) return new Date(y, 0, 1);
    return now;
  }
  if (mode === 'week' && value.includes('-W')) {
    const [y, w] = value.split('-W').map(Number);
    if (y && w) return new Date(y, 0, 1 + (w - 1) * 7);
    return now;
  }
  const parts = value.split('-').map(Number);
  if (mode === 'month' && parts.length >= 2 && parts[0] && parts[1]) return new Date(parts[0], parts[1] - 1, 1);
  if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) return new Date(parts[0], parts[1] - 1, parts[2]);
  return now;
}

function buildCalendarDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells: { date: Date; currentMonth: boolean }[] = [];

  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    cells.push({ date: new Date(year, month - 1, prevDays - i), currentMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), currentMonth: true });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, cells.length - firstWeekday - daysInMonth + 1), currentMonth: false });
  }
  return cells;
}

export function DateField({
  label,
  value,
  onChangeText,
  mode = 'date',
  placeholder,
  optional,
  compact,
  tight,
  inline,
  inlinePill,
  hideIcon,
  hideCurrentPeriodAction,
}: {
  label?: string;
  value?: string;
  onChangeText: (value: string) => void;
  mode?: 'date' | 'month' | 'year' | 'week';
  placeholder?: string;
  optional?: boolean;
  compact?: boolean;
  tight?: boolean;
  inline?: boolean;
  inlinePill?: boolean;
  hideIcon?: boolean;
  hideCurrentPeriodAction?: boolean;
}) {
  const themeColors = useThemeColors();
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parsePickerDate(value, mode));
  const selectedValue = value || '';
  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate]);
  const today = new Date();

  const openPicker = () => {
    setViewDate(parsePickerDate(value, mode));
    setOpen(true);
  };

  const chooseDate = (date: Date) => {
    if (mode === 'year') onChangeText(yearString(date));
    else if (mode === 'week') onChangeText(weekString(date));
    else if (mode === 'month') onChangeText(monthString(date));
    else onChangeText(dateString(date));
    setOpen(false);
  };

  return (
    <View style={[compact ? styles.fieldCompact : styles.field, tight && styles.fieldTight, inline && styles.fieldInline]}>
      {!compact && label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <Pressable
        onPress={openPicker}
        style={({ pressed }) => [
          styles.input,
          compact && styles.inputCompact,
          styles.dateInput,
          inline && styles.dateInputInline,
          inlinePill && styles.dateInputInlinePill,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.dateInputText,
            compact && styles.dateInputTextCompact,
            inline && [styles.dateInputTextInline, { color: themeColors.primary }],
            inlinePill && styles.dateInputTextInlinePill,
            !selectedValue && styles.dateInputPlaceholder,
          ]}
        >
          {selectedValue || placeholder || (mode === 'year' ? '选择年份' : mode === 'month' ? '选择月份' : mode === 'week' ? '选择周' : '选择日期')}
        </Text>
        {!hideIcon ? <Ionicons name="calendar-outline" size={compact ? 16 : 20} color={themeColors.primary} /> : null}
      </Pressable>
      <Modal visible={open} transparent animationType="fade" presentationStyle="overFullScreen" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.pickerOverlay, styles.pickerBottomOverlay]} onPress={() => setOpen(false)}>
          <Pressable style={[styles.pickerPanel, styles.datePickerPanel]} onPress={(event) => event.stopPropagation()}>
            <View style={styles.pickerHeader}>
              <IconButton name="chevron-back" label="上一个" soft onPress={() => setViewDate((date) => new Date(date.getFullYear() - (mode === 'year' ? 12 : (mode === 'month' ? 1 : 0)), date.getMonth() - (mode === 'date' || mode === 'week' ? 1 : 0), 1))} />
              <Text style={styles.pickerTitle}>
                {mode === 'year' ? `${viewDate.getFullYear() - 4} - ${viewDate.getFullYear() + 7}` : (mode === 'month' ? `${viewDate.getFullYear()}年` : `${viewDate.getFullYear()}年 ${viewDate.getMonth() + 1}月`)}
              </Text>
              <IconButton name="chevron-forward" label="下一个" soft onPress={() => setViewDate((date) => new Date(date.getFullYear() + (mode === 'year' ? 12 : (mode === 'month' ? 1 : 0)), date.getMonth() + (mode === 'date' || mode === 'week' ? 1 : 0), 1))} />
            </View>
            {mode === 'year' ? (
              <View style={styles.monthGrid}>
                {Array.from({ length: 12 }, (_, index) => {
                  const y = viewDate.getFullYear() - 4 + index;
                  const date = new Date(y, 0, 1);
                  const yValue = yearString(date);
                  const selected = selectedValue === yValue;
                  return (
                    <Pressable key={yValue} onPress={() => chooseDate(date)} style={[styles.monthCell, selected && [styles.pickerCellSelected, { backgroundColor: themeColors.primary }]]}>
                      <Text style={[styles.monthCellText, selected && styles.pickerCellTextSelected]}>{y}年</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : mode === 'month' ? (
              <View style={styles.monthGrid}>
                {Array.from({ length: 12 }, (_, index) => {
                  const date = new Date(viewDate.getFullYear(), index, 1);
                  const monthValue = monthString(date);
                  const selected = selectedValue === monthValue;
                  return (
                    <Pressable key={monthValue} onPress={() => chooseDate(date)} style={[styles.monthCell, selected && [styles.pickerCellSelected, { backgroundColor: themeColors.primary }]]}>
                      <Text style={[styles.monthCellText, selected && styles.pickerCellTextSelected]}>{index + 1}月</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <>
                <View style={styles.weekRow}>
                  {['日', '一', '二', '三', '四', '五', '六'].map((item) => <Text key={item} style={styles.weekText}>{item}</Text>)}
                </View>
                <View style={styles.dayGrid}>
                  {days.map(({ date, currentMonth }) => {
                    const dayValue = mode === 'week' ? weekString(date) : dateString(date);
                    const selected = selectedValue === dayValue;
                    const isToday = dayValue === (mode === 'week' ? weekString(today) : dateString(today));
                    return (
                      <Pressable key={dateString(date)} onPress={() => chooseDate(date)} style={[styles.dayCell, selected && [styles.pickerCellSelected, { backgroundColor: themeColors.primary }], isToday && !selected && styles.todayCell]}>
                        <Text style={[styles.dayCellText, !currentMonth && styles.dayCellMuted, selected && styles.pickerCellTextSelected]}>{date.getDate()}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
            {optional || !hideCurrentPeriodAction ? (
              <View style={styles.pickerFooter}>
                {optional ? <PrimaryButton label="清空" tone="plain" onPress={() => { onChangeText(''); setOpen(false); }} /> : null}
                {!hideCurrentPeriodAction ? <PrimaryButton label={mode === 'year' ? '今年' : mode === 'month' ? '本月' : mode === 'week' ? '本周' : '今天'} tone="plain" onPress={() => chooseDate(new Date())} /> : null}
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function TimeField({
  label,
  value,
  onChangeText,
  placeholder,
  optional,
}: {
  label: string;
  value?: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
}) {
  const themeColors = useThemeColors();
  const [open, setOpen] = useState(false);
  const selectedValue = value || '';
  const currentHour = selectedValue.split(':')[0] || '08';
  const currentMinute = selectedValue.split(':')[1] || '00';
  const [focusedHour, setFocusedHour] = useState(currentHour);
  const [focusedMinute, setFocusedMinute] = useState(currentMinute);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => pad(i)), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => pad(i)), []);

  const ITEM_HEIGHT = 50;
  const VISIBLE_ITEMS = 3;
  const OFFSET = (VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT;

  const hourScrollRef = useRef<React.ComponentRef<typeof GestureScrollView>>(null);
  const minuteScrollRef = useRef<React.ComponentRef<typeof GestureScrollView>>(null);

  const valueAtOffset = (items: string[], offset: number) => {
    const index = Math.max(0, Math.min(items.length - 1, Math.round(offset / ITEM_HEIGHT)));
    return items[index] || items[0];
  };

  const updateFocusedValue = (type: 'hour' | 'minute', offset: number) => {
    const nextValue = type === 'hour' ? valueAtOffset(hours, offset) : valueAtOffset(minutes, offset);
    if (type === 'hour') {
      setFocusedHour((current) => (current === nextValue ? current : nextValue));
    } else {
      setFocusedMinute((current) => (current === nextValue ? current : nextValue));
    }
  };

  const onScrollEnd = (type: 'hour' | 'minute', offset: number) => {
    if (type === 'hour') {
      const h = valueAtOffset(hours, offset);
      setFocusedHour(h);
      if (h !== currentHour) {
        onChangeText(`${h}:${focusedMinute}`);
        if (Platform.OS !== 'web') Haptics.selectionAsync();
      }
    } else {
      const m = valueAtOffset(minutes, offset);
      setFocusedMinute(m);
      if (m !== currentMinute) {
        onChangeText(`${focusedHour}:${m}`);
        if (Platform.OS !== 'web') Haptics.selectionAsync();
      }
    }
  };

  useEffect(() => {
    if (open) {
      setFocusedHour(currentHour);
      setFocusedMinute(currentMinute);
      setTimeout(() => {
        const hIdx = hours.indexOf(currentHour);
        const mIdx = minutes.indexOf(currentMinute);
        hourScrollRef.current?.scrollTo({ y: hIdx * ITEM_HEIGHT, animated: false });
        minuteScrollRef.current?.scrollTo({ y: mIdx * ITEM_HEIGHT, animated: false });
      }, 50);
    }
  }, [currentHour, currentMinute, hours, minutes, open]);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={({ pressed }) => [styles.input, styles.dateInput, pressed && styles.pressed]}>
        <Text style={[styles.dateInputText, !selectedValue && styles.dateInputPlaceholder]}>{selectedValue || placeholder || '选择时间'}</Text>
        <Ionicons name="time-outline" size={20} color={themeColors.primary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" presentationStyle="overFullScreen" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.pickerOverlay, styles.pickerBottomOverlay]} onPress={() => setOpen(false)}>
          <Pressable style={[styles.pickerPanel, { maxWidth: 280, padding: 0, overflow: 'hidden' }]} onPress={(event) => event.stopPropagation()}>
            <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
              <Text style={styles.pickerTitle}>{label}</Text>
            </View>
            
            <View style={[styles.pickerContainer, { height: ITEM_HEIGHT * VISIBLE_ITEMS }]}>
              {/* Middle Highlight Indicator */}
              <View style={styles.pickerIndicator} />
              
              {/* Top and Bottom Opaque Overlays to hide other items */}
              <View style={[styles.pickerColumnOverlay, styles.pickerOverlayTop]} pointerEvents="none" />
              <View style={[styles.pickerColumnOverlay, styles.pickerOverlayBottom]} pointerEvents="none" />

              <GestureScrollView
                ref={hourScrollRef}
                style={styles.pickerColumn} 
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                disallowInterruption
                onScroll={(e) => updateFocusedValue('hour', e.nativeEvent.contentOffset.y)}
                onMomentumScrollEnd={(e) => onScrollEnd('hour', e.nativeEvent.contentOffset.y)}
                scrollEventThrottle={16}
              >
                <View style={{ height: OFFSET }} />
                {hours.map((h) => (
                  <View key={h} style={styles.pickerItem}>
                    <Text style={[styles.pickerItemText, focusedHour === h && styles.pickerItemTextSelected]}>{h}</Text>
                  </View>
                ))}
                <View style={{ height: OFFSET }} />
              </GestureScrollView>

              <View style={styles.pickerSeparator} />

              <GestureScrollView
                ref={minuteScrollRef}
                style={styles.pickerColumn} 
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                disallowInterruption
                onScroll={(e) => updateFocusedValue('minute', e.nativeEvent.contentOffset.y)}
                onMomentumScrollEnd={(e) => onScrollEnd('minute', e.nativeEvent.contentOffset.y)}
                scrollEventThrottle={16}
              >
                <View style={{ height: OFFSET }} />
                {minutes.map((m) => (
                  <View key={m} style={styles.pickerItem}>
                    <Text style={[styles.pickerItemText, focusedMinute === m && styles.pickerItemTextSelected]}>{m}</Text>
                  </View>
                ))}
                <View style={{ height: OFFSET }} />
              </GestureScrollView>
            </View>

            <View style={[styles.pickerFooter, { padding: spacing.lg, marginTop: 0 }]}>
              {optional ? <PrimaryButton label="清除" tone="plain" onPress={() => { onChangeText(''); setOpen(false); }} /> : null}
              <PrimaryButton 
                label="确定" 
                onPress={() => {
                  if (!value) {
                    onChangeText(`${focusedHour}:${focusedMinute}`);
                  }
                  setOpen(false);
                }} 
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function SegmentedControl({
  value,
  options,
  onChange,
  size = 'default',
  activeColor,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  size?: 'default' | 'large';
  activeColor?: string;
}) {
  const large = size === 'large';
  const themeColors = useThemeColors();
  const selectedColor = activeColor || themeColors.primary;
  return (
    <View style={[styles.segmented, large && styles.segmentedLarge, { flexWrap: 'wrap' }]}>
      {options.map((option) => {
        const selected = option.value === value;
        const handlePress = () => {
          if (!selected && Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onChange(option.value);
        };
        return (
          <Pressable
            key={option.value}
            onPress={handlePress}
            style={[styles.segment, large && styles.segmentLarge, selected && styles.segmentSelected, selected && { backgroundColor: colorWithAlpha(selectedColor), borderColor: selectedColor }]}>
            <Text style={[styles.segmentText, large && styles.segmentTextLarge, selected && styles.segmentTextSelected, selected && { color: selectedColor }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  value?: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const themeColors = useThemeColors();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={({ pressed }) => [styles.input, styles.dateInput, pressed && styles.pressed]}>
        <Text style={[styles.dateInputText, !selected && styles.dateInputPlaceholder]}>{selected?.label || placeholder || '请选择'}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={themeColors.primary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.pickerOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.pickerPanel} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.pickerTitle}>{label}</Text>
            <View style={styles.optionList}>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [styles.optionRow, isSelected && styles.optionRowSelected, pressed && styles.pressed]}>
                    <Text style={styles.optionRowText}>{option.label}</Text>
                    {isSelected ? <Ionicons name="checkmark" size={18} color={themeColors.primary} /> : null}
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.pickerFooter}>
              <PrimaryButton label="关闭" tone="plain" onPress={() => setOpen(false)} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function StateView({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading?: boolean;
  error?: string | null;
  empty?: string;
  onRetry?: () => void;
}) {
  const themeColors = useThemeColors();
  if (loading) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={themeColors.primary} />
        <Text style={styles.stateText}>正在加载</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.state}>
        <Ionicons name="alert-circle-outline" size={34} color={colors.warning} />
        <Text style={styles.stateTitle}>加载失败</Text>
        <Text style={styles.stateText}>{error}</Text>
        {onRetry ? <PrimaryButton label="重试" onPress={onRetry} tone="plain" /> : null}
      </View>
    );
  }
  if (empty) {
    return (
      <View style={styles.state}>
        <Ionicons name="file-tray-outline" size={34} color={colors.faint} />
        <Text style={styles.stateTitle}>暂无记录</Text>
        <Text style={styles.stateText}>{empty}</Text>
      </View>
    );
  }
  return null;
}
