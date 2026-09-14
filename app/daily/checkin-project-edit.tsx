import { CheckinProjectEditorScreen } from '@/src/features/daily/checkins';
import { router, useLocalSearchParams } from 'expo-router';

export default function CheckinProjectEditorRoute() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = params.projectId ? Number(params.projectId) : null;

  return (
    <CheckinProjectEditorScreen
      projectId={typeof projectId === 'number' && Number.isFinite(projectId) ? projectId : null}
      onBack={() => router.back()}
    />
  );
}
