import { router } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';

import { Header, IconButton, Screen } from '@/src/shared/components';
import { ThemeColorEditor } from './components/ThemeColorEditor';
import { styles } from './styles';

export function ThemeSettingsScreen() {
  return (
    <Screen>
      <Header
        title="主题色设置"
        action={<IconButton name="chevron-back" label="返回设置" transparent onPress={() => router.back()} />}
      />
      <View style={styles.background}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.settingsSection}>
            <ThemeColorEditor />
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </Screen>
  );
}
