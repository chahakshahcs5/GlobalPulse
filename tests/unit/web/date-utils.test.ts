import { describe, it, expect } from 'vitest';
import {
  formatLocalDate,
  formatLocalDateTime,
  formatLocalTime,
  formatDeterministicDate,
  formatDeterministicDateTime,
} from '../../../apps/web/src/lib/date-utils';

describe('Web Date Utilities (Unit Tests)', () => {
  describe('formatLocalDate', () => {
    it('formats ISO date strings correctly', () => {
      const formatted = formatLocalDate('2026-10-02T10:00:00Z');
      expect(formatted).toMatch(/Oct 2, 2026/);
    });

    it('formats numeric timestamps and Date objects', () => {
      const d = new Date('2026-05-15T08:30:00Z');
      expect(formatLocalDate(d.getTime())).toMatch(/May 15, 2026/);
      expect(formatLocalDate(d)).toMatch(/May 15, 2026/);
    });

    it('returns "Recent" for null, undefined, or invalid date values', () => {
      expect(formatLocalDate(null)).toBe('Recent');
      expect(formatLocalDate(undefined)).toBe('Recent');
      expect(formatLocalDate('not-a-valid-date')).toBe('Recent');
      expect(formatLocalDate('')).toBe('Recent');
    });
  });

  describe('formatLocalDateTime', () => {
    it('formats date and time with hour, minute, and year', () => {
      const formatted = formatLocalDateTime('2026-10-02T14:30:00Z');
      expect(formatted).toContain('2026');
      expect(formatted).toMatch(/AM|PM/i);
    });

    it('returns "Recent" for invalid or missing datetime inputs', () => {
      expect(formatLocalDateTime(null)).toBe('Recent');
      expect(formatLocalDateTime(undefined)).toBe('Recent');
      expect(formatLocalDateTime('invalid')).toBe('Recent');
    });
  });

  describe('formatLocalTime', () => {
    it('formats time in 12-hour format with AM/PM', () => {
      const formatted = formatLocalTime('2026-10-02T16:45:00Z');
      expect(formatted).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
    });

    it('returns empty string for null, undefined, or invalid time input', () => {
      expect(formatLocalTime(null)).toBe('');
      expect(formatLocalTime(undefined)).toBe('');
      expect(formatLocalTime('not-a-date')).toBe('');
    });
  });

  describe('deterministic aliases for backward compatibility', () => {
    it('formatDeterministicDate delegates to formatLocalDate', () => {
      const date = '2026-10-02T10:00:00Z';
      expect(formatDeterministicDate(date)).toBe(formatLocalDate(date));
    });

    it('formatDeterministicDateTime delegates to formatLocalDateTime', () => {
      const date = '2026-10-02T10:00:00Z';
      expect(formatDeterministicDateTime(date)).toBe(formatLocalDateTime(date));
    });
  });
});
