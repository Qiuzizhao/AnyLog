import React, { useCallback, useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleProp, View, ViewStyle, type GestureResponderEvent } from 'react-native';

import {
  SWIPE_ACTION_WIDTH,
  SWIPE_RIGHT_ACTION_THRESHOLD,
  SWIPE_RIGHT_ACTION_WIDTH,
  getSwipeActionReleaseTarget,
  shouldCaptureSwipeStart,
  shouldClaimSwipeAction,
  shouldPrelockSwipeAction,
  shouldReleaseSwipePrelock,
} from './SwipeActionCard.logic';

export {
  SWIPE_ACTION_WIDTH,
  SWIPE_KEEP_OPEN_THRESHOLD,
  SWIPE_OPEN_THRESHOLD,
  getSwipeActionReleaseTarget,
  shouldCaptureSwipeStart,
  shouldClaimSwipeAction,
  shouldPrelockSwipeAction,
  shouldReleaseSwipePrelock,
} from './SwipeActionCard.logic';

export function SwipeActionCard({
  action,
  actionWidth = SWIPE_ACTION_WIDTH,
  children,
  containerStyle,
  contentStyle,
  railStyle,
  onSwipeActiveChange,
  onSwipeRight,
}: {
  action: React.ReactNode | ((controls: { close: () => void }) => React.ReactNode);
  actionWidth?: number;
  children: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  railStyle?: StyleProp<ViewStyle>;
  onSwipeActiveChange?: (active: boolean) => void;
  onSwipeRight?: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const opened = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const prelocked = useRef(false);
  const responderActive = useRef(false);

  const canSwipeInDirection = useCallback((dx: number) => {
    if (dx > 0 && !opened.current && !onSwipeRight) return false;
    return dx !== 0;
  }, [onSwipeRight]);

  const clearPrelock = useCallback(() => {
    if (prelocked.current && !responderActive.current) onSwipeActiveChange?.(false);
    prelocked.current = false;
    touchStart.current = null;
  }, [onSwipeActiveChange]);

  const animateTo = useCallback((value: number) => {
    Animated.spring(translateX, {
      toValue: value,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start(() => {
      opened.current = value !== 0;
    });
  }, [translateX]);

  const finishSwipe = useCallback((value: number) => {
    responderActive.current = false;
    prelocked.current = false;
    touchStart.current = null;
    onSwipeActiveChange?.(false);
    animateTo(value);
  }, [animateTo, onSwipeActiveChange]);

  const close = useCallback(() => {
    finishSwipe(0);
  }, [finishSwipe]);

  const panResponder = useMemo(
    () => {
      const claimSwipe = (gestureState: { dx: number; dy: number }) => {
        if (gestureState.dx > 0 && !opened.current && !onSwipeRight) return false;
        const shouldClaim = shouldClaimSwipeAction(gestureState);
        if (shouldClaim) {
          responderActive.current = true;
          prelocked.current = false;
          onSwipeActiveChange?.(true);
        }
        return shouldClaim;
      };

      return PanResponder.create({
        onStartShouldSetPanResponderCapture: () => shouldCaptureSwipeStart({ opened: opened.current, targetIsAction: false }),
        onMoveShouldSetPanResponderCapture: (_, gestureState) => claimSwipe(gestureState),
        onMoveShouldSetPanResponder: (_, gestureState) => claimSwipe(gestureState),
        onPanResponderGrant: () => {
          responderActive.current = true;
          prelocked.current = false;
          onSwipeActiveChange?.(true);
        },
        onPanResponderMove: (_, gestureState) => {
          const base = opened.current ? -actionWidth : 0;
          const rightLimit = opened.current ? 0 : (onSwipeRight ? SWIPE_RIGHT_ACTION_WIDTH : 0);
          const next = Math.max(-actionWidth, Math.min(rightLimit, base + gestureState.dx));
          translateX.setValue(next);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (!opened.current && onSwipeRight && gestureState.dx > SWIPE_RIGHT_ACTION_THRESHOLD) {
            onSwipeRight();
            finishSwipe(0);
            return;
          }
          finishSwipe(getSwipeActionReleaseTarget({ dx: gestureState.dx, opened: opened.current, actionWidth }));
        },
        onPanResponderTerminate: () => finishSwipe(opened.current ? -actionWidth : 0),
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
      });
    },
    [actionWidth, finishSwipe, onSwipeActiveChange, onSwipeRight, translateX],
  );

  const handleTouchStart = useCallback((event: GestureResponderEvent) => {
    touchStart.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
    prelocked.current = false;
  }, []);

  const handleTouchMove = useCallback((event: GestureResponderEvent) => {
    if (responderActive.current || !touchStart.current) return;
    const dx = event.nativeEvent.pageX - touchStart.current.x;
    const dy = event.nativeEvent.pageY - touchStart.current.y;
    if (prelocked.current && shouldReleaseSwipePrelock({ dx, dy }) && !shouldClaimSwipeAction({ dx, dy })) {
      prelocked.current = false;
      onSwipeActiveChange?.(false);
      return;
    }
    if (!prelocked.current && canSwipeInDirection(dx) && shouldPrelockSwipeAction({ dx, dy })) {
      prelocked.current = true;
      onSwipeActiveChange?.(true);
    }
  }, [canSwipeInDirection, onSwipeActiveChange]);

  const renderedAction = typeof action === 'function' ? action({ close }) : action;

  return (
    <View style={containerStyle}>
      <Animated.View style={[railStyle, { transform: [{ translateX }] }]}>
        <View
          style={contentStyle}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={clearPrelock}
          onTouchCancel={clearPrelock}
          {...panResponder.panHandlers}
        >
          {children}
        </View>
        {renderedAction}
      </Animated.View>
    </View>
  );
}
