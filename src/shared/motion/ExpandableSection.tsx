import { Ionicons } from '@expo/vector-icons';
import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, LayoutAnimation, Platform, StyleProp, View, ViewStyle } from 'react-native';

import { motionDurations, motionEasings } from './tokens';

export function configureMotionLayoutAnimation() {
  LayoutAnimation.configureNext({
    duration: motionDurations.normal,
    create: {
      duration: motionDurations.fast,
      property: LayoutAnimation.Properties.opacity,
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      duration: motionDurations.fast,
      property: LayoutAnimation.Properties.opacity,
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    update: {
      duration: motionDurations.normal,
      type: LayoutAnimation.Types.easeInEaseOut,
    },
  });
}

export function ExpandableChevron({
  collapsed,
  color,
  size = 16,
}: {
  collapsed: boolean;
  color: string;
  size?: number;
}) {
  const progress = useRef(new Animated.Value(collapsed ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      duration: motionDurations.normal,
      easing: motionEasings.standard,
      toValue: collapsed ? 0 : 1,
      useNativeDriver: true,
    }).start();
  }, [collapsed, progress]);

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Ionicons name="chevron-down" size={size} color={color} />
    </Animated.View>
  );
}

export function ExpandableSection({
  children,
  collapsed,
  style,
}: PropsWithChildren<{
  collapsed: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  const opacity = useRef(new Animated.Value(collapsed ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(collapsed ? -6 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        duration: collapsed ? motionDurations.fast : motionDurations.normal,
        easing: collapsed ? motionEasings.exit : motionEasings.standard,
        toValue: collapsed ? 0 : 1,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        duration: collapsed ? motionDurations.fast : motionDurations.normal,
        easing: motionEasings.standard,
        toValue: collapsed ? -6 : 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [collapsed, opacity, translateY]);

  if (collapsed) return null;

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      <View collapsable={Platform.OS === 'web'}>
        {children}
      </View>
    </Animated.View>
  );
}
