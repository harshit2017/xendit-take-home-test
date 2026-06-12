import { validateScheduledTime } from '../../../src/utils/scheduling.utils';

describe('scheduling.utils', () => {
  describe('validateScheduledTime', () => {
    const now = new Date('2024-06-10T12:00:00');

    it('rejects scheduled times less than 15 minutes ahead', () => {
      const result = validateScheduledTime(new Date('2024-06-10T12:10:00'), now);
      expect(result.valid).toBe(false);
    });

    it('accepts scheduled times at least 15 minutes ahead', () => {
      const result = validateScheduledTime(new Date('2024-06-10T12:20:00'), now);
      expect(result.valid).toBe(true);
    });

    it('rejects scheduled times more than 30 days ahead', () => {
      const result = validateScheduledTime(new Date('2024-08-10T12:00:00'), now);
      expect(result.valid).toBe(false);
    });
  });
});
