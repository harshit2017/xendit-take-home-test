// src/utils/scheduling.utils.ts

const MIN_SCHEDULE_AHEAD_MS = 15 * 60 * 1000;
const MAX_SCHEDULE_AHEAD_MS = 30 * 24 * 60 * 60 * 1000;
export const UPCOMING_NOTIFICATION_WINDOW_MS = 30 * 60 * 1000;
export const PROCESSING_STALE_LOCK_MS = 5 * 60 * 1000;

export const validateScheduledTime = (
  scheduledFor: Date,
  now: Date = new Date()
): { valid: boolean; reason?: string } => {
  const scheduledTime = scheduledFor.getTime();
  const currentTime = now.getTime();

  if (scheduledTime <= currentTime + MIN_SCHEDULE_AHEAD_MS) {
    return {
      valid: false,
      reason: 'Scheduled time must be at least 15 minutes in the future',
    };
  }

  if (scheduledTime > currentTime + MAX_SCHEDULE_AHEAD_MS) {
    return {
      valid: false,
      reason: 'Scheduled time cannot be more than 30 days in the future',
    };
  }

  return { valid: true };
};
