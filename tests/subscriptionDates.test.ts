import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addBillingCycleToDate,
  formatDisplayDate,
  formatRelativeDayLabel,
  getUpcomingBillingDate,
  isCalendarDate,
} from '../utils/subscriptionDates';

test('isCalendarDate validates real calendar dates', () => {
  assert.equal(isCalendarDate('2024-02-29'), true);
  assert.equal(isCalendarDate('2025-02-29'), false);
  assert.equal(isCalendarDate('2024-13-01'), false);
});

test('addBillingCycleToDate preserves end-of-month behavior', () => {
  assert.equal(addBillingCycleToDate('2024-01-31', 'monthly'), '2024-02-29');
  assert.equal(addBillingCycleToDate('2024-02-29', 'yearly'), '2025-02-28');
  assert.equal(addBillingCycleToDate('2024-05-01', 'weekly'), '2024-05-08');
});

test('getUpcomingBillingDate advances cycles until it reaches the reference date', () => {
  assert.equal(
    getUpcomingBillingDate('2024-01-15', 'monthly', new Date('2024-04-20T12:00:00Z')),
    '2024-05-15',
  );
});

test('formatRelativeDayLabel returns localized relative copy', () => {
  const referenceNow = new Date('2026-04-30T12:00:00Z');

  assert.equal(formatRelativeDayLabel('2026-04-30', 'en', referenceNow), 'Today');
  assert.equal(formatRelativeDayLabel('2026-05-02', 'en', referenceNow), 'In 2 days');
  assert.equal(formatRelativeDayLabel('2026-04-29', 'tr', referenceNow), 'Dün');
});

test('formatDisplayDate uses localized Turkish month abbreviations', () => {
  assert.equal(formatDisplayDate('2026-02-01', 'tr'), '1 Şub 2026');
  assert.equal(formatDisplayDate('2026-08-03', 'tr'), '3 Ağu 2026');
});
