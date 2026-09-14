import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { clearAccountLocalData } from '@/src/local/localDataRepository';
import { Header, IconButton, PrimaryButton, Screen, SheetTextInput } from '@/src/shared/components';
import { colors, radius, spacing } from '@/src/shared/theme';
import {
  getCurrentSession,
  isSupabaseConfigured,
  signInWithEmailPassword,
  signOut,
  signUpWithEmailPassword,
} from '@/src/sync/supabaseClient';

type Mode = 'signIn' | 'signUp';
const headerVisualOffset = 22;

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    void getCurrentSession()
      .then((session) => setUserEmail(session?.user.email ?? null))
      .catch(() => setUserEmail(null));
  }, []);

  const submit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password || loading) return;
    setLoading(true);
    try {
      const result = mode === 'signIn'
        ? await signInWithEmailPassword(trimmedEmail, password)
        : await signUpWithEmailPassword(trimmedEmail, password);
      setUserEmail(result.user?.email ?? trimmedEmail);
      Alert.alert(mode === 'signIn' ? '登录成功' : '注册成功', '现在可以回到 AnyLog 页手动同步。', [
        { text: '好的', onPress: () => router.replace('/') },
      ]);
    } catch (err) {
      Alert.alert(mode === 'signIn' ? '登录失败' : '注册失败', err instanceof Error ? err.message : '请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut();
      await clearAccountLocalData();
      setUserEmail(null);
      Alert.alert('已退出登录', '本机上的账号 AnyLog 和同步状态已清空。', [
        { text: '好的', onPress: () => router.replace('/') },
      ]);
    } catch (err) {
      Alert.alert('退出失败', err instanceof Error ? err.message : '请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header
        title="账号"
        action={<IconButton name="chevron-back" label="返回" transparent onPress={() => router.back()} />}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.content}>
          {!isSupabaseConfigured() ? (
            <View style={styles.card}>
              <Text style={styles.title}>还没有配置同步服务</Text>
              <Text selectable style={styles.body}>
                请先设置 EXPO_PUBLIC_SUPABASE_URL 和 EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY，然后重启 Expo。
              </Text>
            </View>
          ) : userEmail ? (
            <View style={styles.card}>
              <Text style={styles.title}>已登录</Text>
              <Text selectable style={styles.body}>{userEmail}</Text>
              <PrimaryButton label="退出登录" icon="log-out-outline" tone="plain" disabled={loading} onPress={logout} />
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.modeRow}>
                <PrimaryButton
                  label="登录"
                  tone={mode === 'signIn' ? 'primary' : 'plain'}
                  style={styles.modeButton}
                  textStyle={mode === 'signIn' ? undefined : styles.modeText}
                  onPress={() => setMode('signIn')}
                />
                <PrimaryButton
                  label="注册"
                  tone={mode === 'signUp' ? 'primary' : 'plain'}
                  style={styles.modeButton}
                  textStyle={mode === 'signUp' ? undefined : styles.modeText}
                  onPress={() => setMode('signUp')}
                />
              </View>
              <SheetTextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="邮箱"
                sheet={false}
                style={styles.input}
                value={email}
              />
              <SheetTextInput
                onChangeText={setPassword}
                placeholder="密码"
                secureTextEntry
                sheet={false}
                style={styles.input}
                value={password}
              />
              <PrimaryButton
                label={mode === 'signIn' ? '登录' : '注册'}
                icon={mode === 'signIn' ? 'log-in-outline' : 'person-add-outline'}
                disabled={loading || !email.trim() || password.length < 6}
                onPress={submit}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'center',
    maxWidth: 430,
    padding: spacing.lg,
    transform: [{ translateY: -headerVisualOffset }],
    width: '100%',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  modeRow: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: 6,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    minHeight: 40,
  },
  modeText: {
    fontSize: 15,
  },
  input: {
    minHeight: 52,
  },
});
