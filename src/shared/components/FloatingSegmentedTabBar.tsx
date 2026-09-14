import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/shared/theme';

const segmentedTabHorizontalPadding = 8;
const segmentedTabSlotWidth = 70;

export type FloatingSegmentedTabOption<TValue extends string> = {
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: TValue;
};

export function FloatingSegmentedTabBar<TValue extends string>({
  bottom,
  onChange,
  options,
  value,
  width,
}: {
  bottom: number;
  onChange: (value: TValue) => void;
  options: FloatingSegmentedTabOption<TValue>[];
  value: TValue;
  width?: number;
}) {
  const barWidth = width ?? segmentedTabSlotWidth * options.length + segmentedTabHorizontalPadding * 2;
  const itemWidth = Math.max(62, Math.floor((barWidth - segmentedTabHorizontalPadding * 2) / Math.max(options.length, 1)) - 4);

  return (
    <View pointerEvents="box-none" style={[styles.dock, { bottom }]}>
      <BlurView
        intensity={92}
        tint="systemUltraThinMaterialLight"
        experimentalBlurMethod="dimezisBlurView"
        blurReductionFactor={2}
        style={[styles.glass, styles.webBackdrop, { width: barWidth }]}
      >
        <View pointerEvents="none" style={styles.tint} />
        <View style={styles.items}>
          {options.map((option) => {
            const selected = option.value === value;
            const color = selected ? colors.text : colors.faint;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="tab"
                accessibilityState={selected ? { selected: true } : {}}
                onPress={() => onChange(option.value)}
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              >
                <View style={[styles.buttonContent, { width: itemWidth }]}>
                  <View style={styles.foreground}>
                    <Ionicons name={selected ? option.activeIcon : option.inactiveIcon} size={24} color={color} style={styles.icon} />
                    <Text style={[styles.label, { color, width: itemWidth - 8 }]} numberOfLines={1}>{option.label}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 90,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.84)',
    borderRadius: 38,
    borderWidth: 1,
    height: 76,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 34,
  },
  webBackdrop: {
    backdropFilter: 'blur(26px) saturate(190%)',
    WebkitBackdropFilter: 'blur(26px) saturate(190%)',
  } as any,
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  items: {
    alignItems: 'center',
    flexDirection: 'row',
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: segmentedTabHorizontalPadding,
    width: '100%',
  },
  button: {
    alignItems: 'center',
    flex: 1,
    height: 76,
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.86,
  },
  buttonContent: {
    alignItems: 'center',
    borderRadius: 31,
    height: 62,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  foreground: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  icon: {
    textAlign: 'center',
    width: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 2,
    textAlign: 'center',
    width: 70,
  },
});
