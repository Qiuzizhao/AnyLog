import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { colorWithAlpha } from '@/src/shared/utils';
import { localDateKey } from '@/src/local/repositories/checkinsRepository';
import { checkinStyles } from './styles';
import type { CheckinProject, CheckinRecord } from './types';

export function CheckinHeatmapCard({ project, records, compact = false }: { project: CheckinProject; records: CheckinRecord[]; compact?: boolean }) {
  const color = project.color || '#22C55E';
  const weeks = useMemo(() => buildHeatmap(records), [records]);
  const recordDates = useMemo(() => new Set(records.map((item) => item.checkin_date)), [records]);

  return (
    <View style={[checkinStyles.heatmapCard, compact && checkinStyles.heatmapCardCompact]}>
      <View style={checkinStyles.heatmapTop}>
        <View style={checkinStyles.heatmapTitleRow}>
          {compact ? null : <Text style={checkinStyles.projectEmoji}>{project.emoji || '✓'}</Text>}
          <Text style={checkinStyles.heatmapTitle}>{compact ? '近 20 周打卡' : project.title}</Text>
        </View>
        <Text style={checkinStyles.heatmapCount}>{records.length} 条记录</Text>
      </View>
      <View style={checkinStyles.heatmapGrid}>
        {weeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={checkinStyles.heatmapWeek}>
            {week.map((date, dayIndex) => {
              const active = Boolean(date && recordDates.has(date));
              return (
                <View
                  key={date || `empty-${weekIndex}-${dayIndex}`}
                  style={[
                    checkinStyles.heatCell,
                    { backgroundColor: active ? colorWithAlpha(color, 0.82) : colorWithAlpha('#111827', 0.06) },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function buildHeatmap(records: CheckinRecord[]) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 7 * 20 + 1);
  start.setDate(start.getDate() - mondayBasedDayIndex(start));

  const dates: (string | null)[] = [];
  for (let i = 0; i < 21 * 7; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date > today ? null : localDateKey(date));
  }

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < dates.length; i += 7) weeks.push(dates.slice(i, i + 7));
  return weeks;
}

function mondayBasedDayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}
