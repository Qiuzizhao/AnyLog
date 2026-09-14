import React from 'react';
import { Alert } from 'react-native';

import { Header, IconButton, Screen } from '@/src/shared/components';

export function ScreenShell({
  title,
  subtitle,
  onBack,
  action,
  rightAction,
  children,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Screen>
      <Header
        title={title}
        subtitle={subtitle}
        action={onBack ? <IconButton name="chevron-back" label="返回" transparent onPress={onBack} /> : action}
        rightAction={rightAction}
      />
      {children}
    </Screen>
  );
}

export function confirmRemove(label: string, onConfirm: () => void) {
  Alert.alert('删除确认', `确定删除「${label}」吗？`, [
    { text: '取消', style: 'cancel' },
    { text: '删除', style: 'destructive', onPress: onConfirm },
  ]);
}
