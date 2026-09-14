import * as Haptics from 'expo-haptics';
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { motionDurations, motionEasings, motionOpacity, motionScales } from './tokens';

type PressableStyle = PressableProps['style'];

export function MotionPressable({
  children,
  disabled,
  enableHaptics = false,
  opacity = motionOpacity.press,
  scale = motionScales.press,
  style,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: Omit<PressableProps, 'style'> & {
  enableHaptics?: boolean;
  opacity?: number;
  scale?: number;
  style?: PressableStyle;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const [pressed, setPressed] = useState(false);

  const animatedStyle = useMemo(() => ({
    opacity: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, opacity],
    }),
    transform: [
      {
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, scale],
        }),
      },
    ],
  }), [opacity, progress, scale]);

  const animateTo = (toValue: number) => {
    Animated.timing(progress, {
      duration: motionDurations.press,
      easing: motionEasings.standard,
      toValue,
      useNativeDriver: true,
    }).start();
  };

  const resolveStyle = (pressed: boolean): StyleProp<ViewStyle> => (
    typeof style === 'function' ? style({ pressed } as any) : style
  );

  return (
    <Animated.View style={[resolveStyle(pressed), animatedStyle]}>
      <Pressable
        {...props}
        disabled={disabled}
        onPress={(event) => {
          if (!disabled && enableHaptics && Platform.OS !== 'web') {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPress?.(event);
        }}
        onPressIn={(event) => {
          if (!disabled) {
            setPressed(true);
            animateTo(1);
          }
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          setPressed(false);
          animateTo(0);
          onPressOut?.(event);
        }}
        style={styles.pressableContent}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressableContent: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
  },
});
