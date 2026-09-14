import { CheckinDetailScreen } from '@/src/features/daily/checkins';
import { router, useLocalSearchParams } from 'expo-router';

export default function CheckinDetailRoute() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = Number(params.projectId);

  return (
    <CheckinDetailScreen
      projectId={Number.isFinite(projectId) ? projectId : 0}
      onBack={() => router.back()}
    />
  );
}
