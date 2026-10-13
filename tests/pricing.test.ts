import assert from 'node:assert/strict';
import test from 'node:test';
import { createPlanLookup, bundledPlanLookup } from '../src/core/store/pricing';
import { getPriceChangeInfo, type Subscription } from '../src/core/store/logic';
import { pricingCountryFor, type CountryPricing } from '../src/core/utils/remotePricing';
// @ts-expect-error — plain .mjs build script
import { parseInAppPurchases } from '../scripts/pricing/fetch-appstore.mjs';
// @ts-expect-error — plain .mjs build script
import { validate } from '../scripts/pricing/fetch-web.mjs';

const US: CountryPricing = {
  country: 'US', currency: 'USD', updatedAt: '2026-10-13T00:00:00Z',
  services: {
    'YouTube Premium': {
      web: [{ id: 'individual', name: 'Individual', price: 13.99, billingCycle: 'monthly' }],
      appStore: [{ id: 'youtube-premium', name: 'YouTube Premium', price: 18.99, billingCycle: 'monthly' }],
    },
    'Netflix': { appStore: [{ id: 'standard', name: 'Netflix Standard', price: 19.99, billingCycle: 'monthly' }] },
  },
};

test('plan lookup: App Store billing gets App Store prices, otherwise web', () => {
  const lookup = createPlanLookup(US);
  assert.equal(lookup('YouTube Premium', 'USD', 'appstore')?.plans[0].price, 18.99);
  assert.equal(lookup('YouTube Premium', 'USD', 'web')?.plans[0].price, 13.99);
  assert.equal(lookup('YouTube Premium', 'USD')?.source, 'web');
  // Only App Store data known: shown, and labelled as such.
  assert.equal(lookup('Netflix', 'USD', 'web')?.source, 'appStore');
});

test('plan lookup: never offers prices in another currency', () => {
  const lookup = createPlanLookup(US);
  assert.equal(lookup('YouTube Premium', 'EUR', 'web'), null);
  assert.equal(bundledPlanLookup('Spotify', 'USD'), null);
  assert.ok(bundledPlanLookup('Spotify', 'TRY')?.plans.length);
});

test('price raise is detected against the country file', () => {
  const sub: Subscription = {
    id: 'y', name: 'YouTube Premium', color: '#f00', icon: '▶', price: 11.99, billingCycle: 'monthly', startDate: '2026-01-01',
    trackingType: 'renewal', currentPeriodStart: '2026-01-01', completedCyclesCarry: 0, accruedSpentCarry: 0, isActive: true,
    currencyCode: 'USD', billedVia: 'web', planTemplateId: 'individual',
  };
  assert.equal(getPriceChangeInfo(sub, createPlanLookup(US))?.newPrice, 13.99);
  assert.equal(getPriceChangeInfo(sub), null); // bundled TRY data says nothing about USD
});

test('pricingCountryFor maps currencies to country files', () => {
  assert.equal(pricingCountryFor('TRY'), 'tr');
  assert.equal(pricingCountryFor('EUR', 'FR'), 'fr');
  assert.equal(pricingCountryFor('EUR', 'AT'), 'de');
  assert.equal(pricingCountryFor('JPY'), null);
});

test('App Store parser reads the In-App Purchases list and drops noise', () => {
  const html = `<dt class="x">In-App Purchases</dt> <dd><ul>
    <li><div class="text-pair svelte-1"><span>YouTube Premium</span> <span>₺159,99</span> </div></li>
    <li><div class="text-pair svelte-1"><span>Youtube Premium</span> <span>₺159,99</span> </div></li>
    <li><div class="text-pair svelte-1"><span>Premium Yearly</span> <span>₺1.599,99</span> </div></li>
    <li><div class="text-pair svelte-1"><span>@creator Subscription</span> <span>₺699,99</span> </div></li>
    <li><div class="text-pair svelte-1"><span>Free Trial</span> <span>₺129</span> </div></li>
  </ul></dd>`;
  const plans = parseInAppPurchases(html);
  assert.deepEqual(plans.map((p: { name: string; price: number; billingCycle: string }) => [p.name, p.price, p.billingCycle]), [
    ['YouTube Premium', 159.99, 'monthly'],
    ['Premium Yearly', 1599.99, 'yearly'],
  ]);
});

test('web extraction answers are rejected in the wrong currency', () => {
  assert.equal(validate({ currency: 'USD', plans: [{ name: 'Individual', price: 11.99, billingCycle: 'monthly' }] }, 'EUR'), null);
  assert.equal(validate({ currency: 'EUR', plans: [{ name: 'Individual', price: 11.99, billingCycle: 'monthly' }] }, 'EUR')?.length, 1);
});

test('App Store parser decodes HTML entities in names', () => {
  const html = `<dt>In-App Purchases</dt><dd><div class="text-pair x"><span>Plus &amp; Family</span> <span>$3.99</span></div></dd>`;
  assert.equal(parseInAppPurchases(html)[0].name, 'Plus & Family');
});

test('App Store parser skips one-off items (tips, rentals)', () => {
  const html = `<dt>In-App Purchases</dt><dd>
    <div class="text-pair x"><span>Super Chat</span> <span>$1.99</span></div>
    <div class="text-pair x"><span>Movies &amp; Shows</span> <span>$3.99</span></div>
    <div class="text-pair x"><span>Premium Lite</span> <span>$11.99</span></div></dd>`;
  assert.deepEqual(parseInAppPurchases(html).map((p: { name: string }) => p.name), ['Premium Lite']);
});
