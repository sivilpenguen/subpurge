// App Store storefront prices: the "In-App Purchases" list on each app's page,
// per country (the storefront is in the URL, so the runner's location doesn't matter).
import { fetchText, inferCycle, NotFoundError, OUT_DIR, parseLocalizedPrice, readJson, sleep, slug, SOURCES, writeJson } from './lib.mjs';


// Creator subscriptions, trials and region-locked leftovers aren't plans a user picks.
const NOISE = /@|trial|free|ücretsiz|deneme|gratis|kostenlos|gratuit|gratuito|\bonly\b/i;

export function parseInAppPurchases(html) {
  const start = html.search(/<dt[^>]*>\s*In-App Purchases\s*<\/dt>/);
  if (start === -1) return [];
  const end = html.indexOf('</dd>', start);
  const block = html.slice(start, end === -1 ? undefined : end);
  const seen = new Map();
  for (const m of block.matchAll(/<div class="text-pair[^"]*"><span>([^<]+)<\/span>\s*<span>([^<]+)<\/span>/g)) {
    const name = m[1].trim();
    const price = parseLocalizedPrice(m[2]);
    const key = name.toLowerCase();
    if (!name || NOISE.test(name) || !Number.isFinite(price) || price <= 0 || seen.has(key)) continue;
    // Apple lists the most popular items first; keep the first price per name.
    seen.set(key, { id: slug(name), name, price, billingCycle: inferCycle(name) });
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
