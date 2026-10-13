import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSubscription } from '../src/core/store/useSubscriptionStore';

const NOW = '2026-10-13T09:00:00.000Z';
const base = { id: '1', name: 'Netflix', color: '#E50914', icon: '🎬', price: 229.99, billingCycle: 'monthly' as const, startDate: '2026-01-05' };

test('hydration keeps a stored currencyCode', () => {
  assert.equal(normalizeSubscription({ ...base, currencyCode: 'USD' }, NOW, 'TRY').currencyCode, 'USD');
});

test('legacy entries without currencyCode inherit the stored display currency', () => {
  assert.equal(normalizeSubscription(base, NOW, 'EUR').currencyCode, 'EUR');
});
