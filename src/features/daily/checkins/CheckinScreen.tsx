import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import type { GestureResponderEvent } from 'react-native';

import { IconButton } from '@/src/shared/components';
import { colors } from '@/src/shared/theme';
import { colorWithAlpha } from '@/src/shared/utils';
import { getPreloadedData, homePreloadKeys, setPreloadedData } from '@/src/local/homePreload';
import {
  listCheckinsLocal,
  subscribeCheckinsLocal,
  todayDate,
  toggleCheckinRecordLocal,
} from '@/src/local/repositories/checkinsRepository';
import { runManualSync } from '@/src/sync/manualSync';
import { ScreenShell } from '../_shared/ReplicatedScreens';
import { CheckinHeatmapCard } from './CheckinHeatmapCard';
import { preserveProjectOrder, sortProjectsByUsage } from './projectOrdering';
import { checkinStyles } from './styles';
import type { CheckinProject, CheckinRecord, CheckinScreenSnapshot } from './types';

const emptySnapshot: CheckinScreenSnapshot = { projects: [], records: [] };

export function CheckinScreen({ onBack }: { onBack?: () => void } = {}) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<CheckinScreenSnapshot>(() => getPreloadedData<CheckinScreenSnapshot>(homePreloadKeys.checkins) ?? emptySnapshot);
  const [visibleProjectIds, setVisibleProjectIds] = useState<number[]>(() => {
    const preloaded = getPreloadedData<CheckinScreenSnapshot>(homePreloadKeys.checkins);
    if (!preloaded) return [];
    return sortProjectsByUsage(
      preloaded.projects.filter((item) => !item.is_archived),
      preloaded.records,
    ).map((project) => project.id);
  });
  const [syncing, setSyncing] = useState(false);
  const today = todayDate();

  const activeProjects = useMemo(() => snapshot.projects.filter((item) => !item.is_archived), [snapshot.projects]);
  const sortedActiveProjects = useMemo(
    () => preserveProjectOrder(activeProjects, snapshot.records, visibleProjectIds),
    [activeProjects, snapshot.records, visibleProjectIds],
  );
  const totalRecords = snapshot.records.length;

  const load = useCallback(async () => {
    const next = await listCheckinsLocal();
    setPreloadedData(homePreloadKeys.checkins, next);
    setSnapshot(next);
    setVisibleProjectIds(sortProjectsByUsage(
      next.projects.filter((item) => !item.is_archived),
      next.records,
    ).map((project) => project.id));
  }, []);

  useEffect(() => {
    void load();
    return subscribeCheckinsLocal((next) => {
      setPreloadedData(homePreloadKeys.checkins, next);
      setSnapshot(next);
      setVisibleProjectIds((current) => preserveProjectOrder(
        next.projects.filter((item) => !item.is_archived),
        next.records,
        current,
      ).map((project) => project.id));
    });
  }, [load]);

  const openCreate = () => {
    router.push('/daily/checkin-project-edit');
  };

  const openEdit = (project: CheckinProject) => {
    router.push({ pathname: '/daily/checkin-project-edit', params: { projectId: String(project.id) } });
  };

  const sync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const result = await runManualSync();
      if (result.status === 'signedOut') {
        Alert.alert('需要登录', '请先在设置里的账号页面登录后再同步。', [
          { text: '去登录', onPress: () => router.push('/auth' as never) },
          { text: '取消', style: 'cancel' },
        ]);
        return;
      }
      await load();
      Alert.alert('同步完成', `上传 ${result.uploadedProjects + result.uploadedRecords} 项，下载 ${result.downloadedProjects + result.downloadedRecords} 项。`);
    } catch (err) {
      Alert.alert('同步失败', err instanceof Error ? err.message : '请稍后再试');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ScreenShell
      title="打卡"
      onBack={onBack}
      action={<IconButton name="settings-outline" label="设置" transparent onPress={() => router.push('/settings' as never)} />}
      rightAction={(
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton name="sync-outline" label="同步" soft onPress={() => void sync()} />
          <IconButton name="add" label="新增打卡项目" soft onPress={openCreate} />
        </View>
      )}
    >
      <FlatList
        contentContainerStyle={checkinStyles.content}
        data={sortedActiveProjects}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={(
          <>
            <View style={[checkinStyles.sectionBlock, checkinStyles.projectSectionBlock]}>
              <View style={checkinStyles.sectionHeader}>
                <Text style={checkinStyles.sectionTitle}>项目卡片</Text>
              </View>
              {sortedActiveProjects.length === 0 ? (
                <View style={checkinStyles.empty}>
                  <Text style={checkinStyles.emptyTitle}>还没有打卡项目</Text>
                  <Text style={checkinStyles.emptyText}>先添加一个项目，比如读书、运动、Coding，然后每天点一下完成打卡。</Text>
                </View>
              ) : null}
              <View style={checkinStyles.projectGrid}>
                {sortedActiveProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    records={snapshot.records}
                    today={today}
                    onPress={() => router.push({ pathname: '/daily/checkin-detail', params: { projectId: String(project.id) } })}
                    onQuickPress={() => void toggleCheckinRecordLocal(project, today)}
                    onLongPress={() => openEdit(project)}
                  />
                ))}
              </View>
            </View>

            {sortedActiveProjects.length ? (
              <View style={checkinStyles.heatmapSectionBlock}>
                <View style={[checkinStyles.sectionHeader, checkinStyles.heatmapHeader]}>
                  <Text style={checkinStyles.sectionTitle}>热力图</Text>
                  <Text style={checkinStyles.heroMeta}>共 {totalRecords} 条</Text>
                </View>
              </View>
            ) : null}
          </>
        )}
        renderItem={({ item }) => (
          <CheckinHeatmapCard project={item} records={snapshot.records.filter((record) => record.project_id === item.id)} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </ScreenShell>
  );
}

function ProjectCard({
  project,
  records,
  today,
  onPress,
  onQuickPress,
  onLongPress,
}: {
  project: CheckinProject;
  records: CheckinRecord[];
  today: string;
  onPress: () => void;
  onQuickPress: () => void;
  onLongPress: () => void;
}) {
  const color = project.color || '#22C55E';
  const projectRecords = records.filter((record) => record.project_id === project.id);
  const doneToday = projectRecords.some((record) => record.checkin_date === today);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={[checkinStyles.projectCard, doneToday && [checkinStyles.projectCardDone, { borderColor: color, backgroundColor: colorWithAlpha(color, 0.08) }]]}
    >
      <View style={checkinStyles.heatmapTitleRow}>
        <View style={[checkinStyles.projectIcon, { backgroundColor: colorWithAlpha(color, 0.16) }]}>
          <Text style={checkinStyles.projectEmoji}>{project.emoji || '✓'}</Text>
        </View>
        <Text style={checkinStyles.projectTitle} numberOfLines={2}>{project.title}</Text>
      </View>
      <Text style={checkinStyles.projectCount}>{projectRecords.length}<Text style={{ fontSize: 14 }}> 条</Text></Text>
      <Text style={checkinStyles.projectSub}>总计 · 全部</Text>
      <Pressable
        onPress={(event: GestureResponderEvent) => {
          event.stopPropagation();
          onQuickPress();
        }}
        style={[checkinStyles.quickButton, { backgroundColor: doneToday ? color : colors.surfaceMuted }]}
      >
        <Ionicons name={doneToday ? 'checkmark' : 'add'} size={24} color={doneToday ? '#fff' : color} />
      </Pressable>
    </Pressable>
  );
}
