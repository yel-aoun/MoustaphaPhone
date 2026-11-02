// Shared motion vocabulary for touch-driven UI (springs, momentum, gesture thresholds).

// Critically damped: settles without overshoot. The default for anything that wasn't flung.
export const SPRING_SETTLE = { type: 'spring', bounce: 0, duration: 0.4 };
// A touch of overshoot, only after a gesture that carried momentum (a flick or a throw).
export const SPRING_FLICK = { type: 'spring', bounce: 0.15, duration: 0.4 };

// Where a release at `velocity` (px/s) would coast to, using scroll-style exponential decay.
export function projectMomentum(velocity, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

// Releases faster than this count as a flick and earn the bouncier spring.
export const FLICK_VELOCITY = 500;
