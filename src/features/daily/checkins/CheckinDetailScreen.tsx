import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';

import { DateField, FormSheet, PrimaryButton } from '@/src/shared/components';
import { colors, spacing } from '@/src/shared/theme';
import { colorWithAlpha } from '@/src/shared/utils';
import { getPreloadedData, homePreloadKeys, setPreloadedData } from '@/src/local/homePreload';
import {
  createCheckinRecordLocal,
  deleteCheckinRecordLocal,
  listCheckinsLocal,
  subscribeCheckinsLocal,
  todayDate,
} from '@/src/local/repositories/checkinsRepository';
import { ScreenShell } from '../_shared/ReplicatedScreens';
import { CheckinHeatmapCard } from './CheckinHeatmapCard';
import { checkinStyles } from './styles';
import type { CheckinRecord, CheckinScreenSnapshot } from './types';

const emptySnapshot: CheckinScreenSnapshot = { projects: [], records: [] };

export function CheckinDetailScreen({ projectId, onBack }: { projectId: number; onBack: () => void }) {
  const [snapshot, setSnapshot] = useState<CheckinScreenSnapshot>(() => getPreloadedData<CheckinScreenSnapshot>(homePreloadKeys.checkins) ?? emptySnapshot);
  const [date, setDate] = useState(() => todayDate());
  const sheetRef = useRef<BottomSheetModal>(null);

  const project = useMemo(() => snapshot.projects.find((item) => item.id === projectId) || null, [snapshot.projects, projectId]);
  const records = useMemo(() => snapshot.records.filter((item) => item.project_id === projectId), [snapshot.records, projectId]);
  const color = project?.color || '#22C55E';
  const dates = useMemo(() => new Set(records.map((item) => item.checkin_date)), [records]);
  const added = dates.has(date);

  const load = useCallback(async () => {
    const next = await listCheckinsLocal();
    setPreloadedData(homePreloadKeys.checkins, next);
    setSnapshot(next);
  }, []);

  useEffect(() => {
    void load();
    return subscribeCheckinsLocal((next) => {
      setPreloadedData(homePreloadKeys.checkins, next);
      setSnapshot(next);
    });
  }, [load]);

  const openAdd = () => {
    setDate(todayDate());
    sheetRef.current?.present();
  };

  const saveRecord = async () => {
    if (!project || !date) return;
    await createCheckinRecordLocal(project, date);
    sheetRef.current?.dismiss();
  };

  const removeRecord = (record: CheckinRecord) => {
    Alert.alert('删除打卡记录', `确定删除 ${record.checkin_date} 的打卡记录吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => void deleteCheckinRecordLocal(record.id) },
    ]);
  };

  if (!project) {
    return (
      <ScreenShell title="打卡详情" onBack={onBack}>
        <View style={checkinStyles.detailMissing}>
          <Text style={checkinStyles.emptyTitle}>没有找到这个打卡项目</Text>
          <PrimaryButton label="返回" onPress={onBack} />
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title={project.title} onBack={onBack}>
      <FlatList
        contentContainerStyle={checkinStyles.detailContent}
        data={records}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={(
          <>
            <View style={[checkinStyles.detailHero, { borderColor: colorWithAlpha(color, 0.28) }]}>
              <View style={checkinStyles.detailHeroTop}>
                <View style={[checkinStyles.detailIcon, { backgroundColor: colorWithAlpha(color, 0.16) }]}>
                  <Text style={checkinStyles.detailEmoji}>{project.emoji || '✓'}</Text>
                </View>
                <View style={checkinStyles.detailTitleBlock}>
                  <Text style={checkinStyles.detailTitle}>{project.title}</Text>
                  <Text style={checkinStyles.heroMeta}>{project.note || '所有打卡记录都在这里管理。'}</Text>
                </View>
                <Pressable style={[checkinStyles.detailQuickAction, { backgroundColor: color }]} onPress={openAdd}>
                  <Ionicons name="add" size={20} color="#fff" />
                </Pressable>
              </View>
              <View style={checkinStyles.detailStats}>
                <DetailStat value={`${records.length}`} label="总记录" />
                <DetailStat value={records[0]?.checkin_date || '-'} label="最近一次" />
              </View>
            </View>

            <View style={checkinStyles.detailHeatmapBlock}>
              <CheckinHeatmapCard project={project} records={records} compact />
            </View>
            {records.length === 0 ? (
              <View style={checkinStyles.empty}>
                <Text style={checkinStyles.emptyTitle}>还没有记录</Text>
                <Text style={checkinStyles.emptyText}>可以点“补打卡”添加某一天，也可以回到打卡页点项目卡片右下角完成今日打卡。</Text>
              </View>
            ) : null}
          </>
        )}
        renderItem={({ item }) => <RecordRow record={item} color={color} onDelete={() => removeRecord(item)} />}
        showsVerticalScrollIndicator={false}
      />

      <FormSheet bottomSheetRef={sheetRef} snapPoints={['44%']} contentStyle={{ padding: spacing.lg }}>
        <Text style={checkinStyles.sectionTitle}>添加某一天的打卡</Text>
        <View style={{ height: spacing.lg }} />
        <DateField label="打卡日期" value={date} onChangeText={setDate} />
        <View style={checkinStyles.formActions}>
          <View style={{ flex: 1 }}>
            <PrimaryButton label={added ? '该日期已打卡' : '添加记录'} icon="checkmark" disabled={added || !date} onPress={() => void saveRecord()} />
          </View>
        </View>
      </FormSheet>
    </ScreenShell>
  );
}

function DetailStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={checkinStyles.detailStatCard}>
      <Text style={checkinStyles.detailStatValue}>{value}</Text>
      <Text style={checkinStyles.detailStatLabel}>{label}</Text>
    </View>
  );
}

function RecordRow({ record, color, onDelete }: { record: CheckinRecord; color: string; onDelete: () => void }) {
  return (
    <View style={checkinStyles.recordRow}>
      <View style={[checkinStyles.recordDot, { backgroundColor: color }]} />
      <View style={checkinStyles.recordMain}>
        <Text style={checkinStyles.recordDate}>{record.checkin_date}</Text>
        <Text style={checkinStyles.recordMeta}>{formatWeekday(record.checkin_date)}</Text>
      </View>
      <View style={checkinStyles.recordStatusPill}>
        <Text style={checkinStyles.recordStatusText}>{record.sync_status === 'pending' ? '待同步' : '已同步'}</Text>
      </View>
      <Pressable style={checkinStyles.recordDelete} onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </Pressable>
    </View>
  );
}

function formatWeekday(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '日期';
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
}
