// App Store storefront prices: the "In-App Purchases" list on each app's page,
// per country (the storefront is in the URL, so the runner's location doesn't matter).
import { fetchText, inferCycle, NotFoundError, OUT_DIR, parseLocalizedPrice, readJson, sleep, slug, SOURCES, writeJson } from './lib.mjs';


// Creator subscriptions, trials and region-locked leftovers aren't plans a user picks.
const NOISE = /@|trial|free|ücretsiz|deneme|gratis|kostenlos|gratuit|gratuito|\bonly\b/i;
// One-off purchases that sit in the same list: tips, coins, rentals, boosts.
const NOT_A_PLAN = /super ?chat|super ?thanks|super ?sticker|movies ?& ?shows|\bcoins?\b|\btokens?\b|\bcredits?\b|\bgems?\b|\bboosts?\b|\bstickers?\b|\bgifts?\b|\btips?\b|donat|rental|kirala/i;

const ENTITIES = { '&amp;': '&', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' };
const decode = text => text.replace(/&(amp|quot|#39|apos|lt|gt|nbsp);/g, m => ENTITIES[m]).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

export function parseInAppPurchases(html) {
  const start = html.search(/<dt[^>]*>\s*In-App Purchases\s*<\/dt>/);
  if (start === -1) return [];
  const end = html.indexOf('</dd>', start);
  const block = html.slice(start, end === -1 ? undefined : end);
  const byName = new Map(); // lower-cased name → { name, prices[] } in page order
  for (const m of block.matchAll(/<div class="text-pair[^"]*"><span>([^<]+)<\/span>\s*<span>([^<]+)<\/span>/g)) {
    const name = decode(m[1]).trim();
    const price = parseLocalizedPrice(decode(m[2]));
    if (!name || NOISE.test(name) || NOT_A_PLAN.test(name) || !Number.isFinite(price) || price <= 0) continue;
    const key = name.toLowerCase();
    if (!byName.has(key)) byName.set(key, { name, prices: [] });
    const entry = byName.get(key);
    if (!entry.prices.includes(price)) entry.prices.push(price);
  }
  const seen = new Map();
  for (const [key, { name, prices }] of byName) {
    const low = Math.min(...prices);
    const high = Math.max(...prices);
    // Apps often list monthly and yearly under one name: ~10–12× apart means both.
    if (prices.length > 1 && high / low >= 8 && high / low <= 13) {
      seen.set(`${key}#m`, { id: `${slug(name)}-monthly`, name, price: low, billingCycle: 'monthly' });
      seen.set(`${key}#y`, { id: `${slug(name)}-yearly`, name, price: high, billingCycle: 'yearly' });
    } else {
      // Otherwise the first (most popular) price wins.
      seen.set(key, { id: slug(name), name, price: prices[0], billingCycle: inferCycle(name) });
    }
  }
  return [...seen.values()];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const only = process.argv.slice(2); // optional: country codes to limit a run
  const countries = Object.entries(SOURCES.countries).filter(([cc]) => !only.length || only.includes(cc));
  const failures = [];
  for (const [cc, currency] of countries) {
    const file = new URL(`appstore-${cc}.json`, OUT_DIR);
    const previous = await readJson(file, { services: {} });
    const services = {};
    for (const [service, src] of Object.entries(SOURCES.services)) {
      if (!src.appStoreId) continue;
      try {
        // l=en keeps the section header in English on every storefront.
        const html = await fetchText(`https://apps.apple.com/${cc}/app/id${src.appStoreId}?l=en`);
        const plans = parseInAppPurchases(html);
        if (plans.length) services[service] = plans;
      } catch (err) {
        if (err instanceof NotFoundError) continue; // not sold in this storefront
        failures.push(`${cc}/${service}: ${err.message}`);
        if (previous.services[service]) services[service] = previous.services[service]; // keep last good
      }
      await sleep(3_500); // the App Store rate-limits bursts (~15–20 requests a minute)
    }
    await writeJson(file, { country: cc.toUpperCase(), currency, source: 'appstore', updatedAt: new Date().toISOString(), services });
    console.log(`${cc}: ${Object.keys(services).length} services`);
  }
  if (failures.length) console.warn(`Failures (kept previous data):\n${failures.join('\n')}`);
}
