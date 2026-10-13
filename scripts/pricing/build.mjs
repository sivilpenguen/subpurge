// Merges every source into one file per country: data/pricing/<cc>.json —
// the only file the app downloads. Turkey's web prices come from the
// hand-written scrapers (data/pricing-tr.json).
import { OUT_DIR, readJson, SOURCES, writeJson } from './lib.mjs';

const trWeb = await readJson(new URL('../../data/pricing-tr.json', import.meta.url), { services: {} });

for (const [cc, currency] of Object.entries(SOURCES.countries)) {
  const appStore = await readJson(new URL(`appstore-${cc}.json`, OUT_DIR), { services: {} });
  const web = cc === 'tr' ? trWeb : await readJson(new URL(`web-${cc}.json`, OUT_DIR), { services: {} });
  const services = {};
  for (const name of Object.keys(SOURCES.services)) {
    const entry = {};
    const webPlans = web.services[name]?.plans;
    if (webPlans?.length) entry.web = webPlans;
    if (appStore.services[name]?.length) entry.appStore = appStore.services[name];
    if (entry.web || entry.appStore) services[name] = entry;
  }
  await writeJson(new URL(`${cc}.json`, OUT_DIR), { country: cc.toUpperCase(), currency, updatedAt: new Date().toISOString(), services });
  console.log(`${cc}.json: ${Object.keys(services).length} services`);
}
