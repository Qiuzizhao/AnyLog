export const SWIPE_ACTION_WIDTH = 56;
export const SWIPE_OPEN_THRESHOLD = 18;
export const SWIPE_KEEP_OPEN_THRESHOLD = 10;
export const SWIPE_RIGHT_ACTION_WIDTH = 44;
export const SWIPE_RIGHT_ACTION_THRESHOLD = 34;
export const SWIPE_PRELOCK_DISTANCE = 3;
export const SWIPE_VERTICAL_RELEASE_DISTANCE = 7;

export function shouldClaimSwipeAction({ dx, dy }: { dx: number; dy: number }) {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  return absX > 8 && absX > absY * 1.1;
}

export function shouldPrelockSwipeAction({ dx, dy }: { dx: number; dy: number }) {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  return absX >= SWIPE_PRELOCK_DISTANCE && absX >= absY * 0.55;
}

export function shouldReleaseSwipePrelock({ dx, dy }: { dx: number; dy: number }) {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  return absY >= SWIPE_VERTICAL_RELEASE_DISTANCE && absY > absX * 1.25;
}

export function getSwipeActionReleaseTarget({
  dx,
  opened,
  actionWidth = SWIPE_ACTION_WIDTH,
}: {
  dx: number;
  opened: boolean;
  actionWidth?: number;
}) {
  if (dx < -SWIPE_OPEN_THRESHOLD || (opened && dx < SWIPE_KEEP_OPEN_THRESHOLD)) {
    return -actionWidth;
  }

  return 0;
}

export function shouldCaptureSwipeStart({ opened, targetIsAction }: { opened: boolean; targetIsAction: boolean }) {
  return opened && !targetIsAction;
}
