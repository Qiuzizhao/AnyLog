import { shouldCaptureSwipeStart, shouldPrelockSwipeAction, shouldReleaseSwipePrelock } from './SwipeActionCard.logic';

function expectEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

expectEqual(
  shouldCaptureSwipeStart({ opened: true, targetIsAction: true }),
  false,
  'opened swipe cards should let action buttons receive taps',
);

expectEqual(
  shouldCaptureSwipeStart({ opened: true, targetIsAction: false }),
  true,
  'opened swipe cards should still capture content taps',
);

expectEqual(
  shouldPrelockSwipeAction({ dx: -4, dy: -5 }),
  true,
  'slightly diagonal horizontal swipes should prelock vertical scrolling before the full swipe threshold',
);

expectEqual(
  shouldPrelockSwipeAction({ dx: 2, dy: 9 }),
  false,
  'mostly vertical movement should not prelock swipe cards',
);

expectEqual(
  shouldReleaseSwipePrelock({ dx: 4, dy: 12 }),
  true,
  'clear vertical intent should release an early swipe prelock',
);

expectEqual(
  shouldReleaseSwipePrelock({ dx: 10, dy: 8 }),
  false,
  'horizontal movement should keep the swipe prelock',
);
