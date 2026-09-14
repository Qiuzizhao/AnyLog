import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Field, PrimaryButton, StateView } from '@/src/shared/components';
import { colors } from '@/src/shared/theme';
import { colorWithAlpha } from '@/src/shared/utils';
import { homePreloadKeys, setPreloadedData } from '@/src/local/homePreload';
import {
  createCheckinProjectLocal,
  deleteCheckinProjectLocal,
  listCheckinProjectsLocal,
  listCheckinsLocal,
  updateCheckinProjectLocal,
} from '@/src/local/repositories/checkinsRepository';
import { ScreenShell, confirmRemove } from '../_shared/ReplicatedScreens';
import { styles } from '../_shared/styles';
import { checkinColorOptions, checkinEmojiOptions } from './projectOptions';
import { checkinStyles } from './styles';
import type { CheckinProject } from './types';

type CheckinProjectForm = {
  title: string;
  emoji: string;
  color: string;
  note: string;
};

function createProjectForm(): CheckinProjectForm {
  return { title: '', emoji: '✓', color: '#22C55E', note: '' };
}

function formFromProject(project: CheckinProject): CheckinProjectForm {
  return {
    title: project.title || '',
    emoji: project.emoji || '✓',
    color: project.color || '#22C55E',
    note: project.note || '',
  };
}

async function findProjectById(id: number) {
  const projects = await listCheckinProjectsLocal();
  return projects.find((item) => item.id === id) || null;
}

async function refreshCheckinPreload() {
  const next = await listCheckinsLocal();
  setPreloadedData(homePreloadKeys.checkins, next);
}

export function CheckinProjectEditorScreen({
  projectId,
  onBack,
}: {
  projectId?: number | null;
  onBack: () => void;
}) {
  const isEditing = typeof projectId === 'number' && Number.isFinite(projectId);
  const [project, setProject] = useState<CheckinProject | null>(null);
  const [form, setForm] = useState<CheckinProjectForm>(() => createProjectForm());
  const [loading, setLoading] = useState(Boolean(isEditing));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const title = isEditing ? '编辑打卡项目' : '新增打卡项目';
  const canSave = useMemo(() => Boolean(form.title.trim()) && !saving, [form.title, saving]);

  useEffect(() => {
    if (!isEditing || typeof projectId !== 'number') return;
    let mounted = true;
    setLoading(true);
    setError(null);
    void findProjectById(projectId)
      .then((item) => {
        if (!mounted) return;
        if (!item) {
          setError('没有找到这个打卡项目');
          return;
        }
        setProject(item);
        setForm(formFromProject(item));
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : '加载打卡项目失败');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isEditing, projectId]);

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        emoji: form.emoji || '✓',
        color: form.color || '#22C55E',
        note: form.note.trim() || null,
      };
      if (isEditing && typeof projectId === 'number') await updateCheckinProjectLocal(projectId, payload);
      else await createCheckinProjectLocal(payload);
      await refreshCheckinPreload();
      onBack();
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!isEditing || typeof projectId !== 'number') return;
    confirmRemove(project?.title || form.title || '打卡项目', async () => {
      await deleteCheckinProjectLocal(projectId);
      await refreshCheckinPreload();
      onBack();
    });
  };

  return (
    <ScreenShell title={title} onBack={onBack}>
      <ScrollView
        alwaysBounceVertical={false}
        bounces={false}
        contentContainerStyle={checkinStyles.editorContent}
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        style={styles.noScrollBounce}
      >
        <StateView loading={loading} error={error} onRetry={() => undefined} />
        {!loading && !error ? (
          <>
            <View style={checkinStyles.editorPreviewCard}>
              <View style={[checkinStyles.detailIcon, { backgroundColor: colorWithAlpha(form.color, 0.18) }]}>
                <Text style={checkinStyles.detailEmoji}>{form.emoji || '✓'}</Text>
              </View>
              <View style={checkinStyles.detailTitleBlock}>
                <Text style={checkinStyles.detailTitle}>{form.title.trim() || '新的打卡项目'}</Text>
                <Text style={checkinStyles.heroMeta}>长按项目卡片可再次进入编辑</Text>
              </View>
            </View>

            <Field
              sheet={false}
              label="项目名称"
              value={form.title}
              placeholder="例如：读书记录、Coding、运动"
              onChangeText={(value) => setForm((current) => ({ ...current, title: value }))}
            />

            <View style={checkinStyles.editorSection}>
              <Text style={styles.formLabel}>图标</Text>
              <View style={checkinStyles.editorOptionGrid}>
                {checkinEmojiOptions.map((emoji) => {
                  const active = form.emoji === emoji;
                  return (
                    <Pressable
                      key={emoji}
                      onPress={() => setForm((current) => ({ ...current, emoji }))}
                      style={[
                        checkinStyles.editorIconOption,
                        { backgroundColor: active ? colorWithAlpha(form.color, 0.18) : colors.surface },
                        active && { borderColor: form.color },
                      ]}
                    >
                      <Text style={checkinStyles.projectEmoji}>{emoji}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={checkinStyles.editorSection}>
              <Text style={styles.formLabel}>颜色</Text>
              <View style={checkinStyles.editorColorGrid}>
                {checkinColorOptions.map((color) => {
                  const active = form.color === color;
                  return (
                    <Pressable
                      key={color}
                      accessibilityLabel={`选择颜色 ${color}`}
                      onPress={() => setForm((current) => ({ ...current, color }))}
                      style={[
                        checkinStyles.editorColorOption,
                        { backgroundColor: color },
                        active && checkinStyles.editorColorOptionActive,
                      ]}
                    >
                      {active ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Field
              sheet={false}
              label="备注"
              value={form.note}
              placeholder="选填"
              onChangeText={(value) => setForm((current) => ({ ...current, note: value }))}
            />

            <View style={checkinStyles.formActions}>
              {isEditing ? <PrimaryButton label="删除" tone="danger" onPress={remove} /> : null}
              <View style={styles.flex}>
                <PrimaryButton
                  label={isEditing ? '保存' : '添加项目'}
                  icon="checkmark"
                  disabled={!canSave}
                  onPress={() => void save()}
                />
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}
