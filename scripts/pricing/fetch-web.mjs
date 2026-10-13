// Web prices for countries without a hand-written TR scraper. The three web
// sources (Spotify, iCloud+, Apple One) put prices in static HTML with the
// country in the URL, so plain parsers do the job — no model, no API key.
// A page showing another currency than the country's is rejected.
import { fetchText, inferCycle, NotFoundError, OUT_DIR, parseLocalizedPrice, readJson, sleep, slug, SOURCES, writeJson } from './lib.mjs';

/** Page → "| "-separated text tokens. */
export function tokens(html) {
  return html
    .replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, '|')
    .replace(/&nbsp;| |­/g, ' ')
    .replace(/&amp;/g, '&')
    .split('|')
    .map(t => t.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

const PRICE = /(?:R\$|MX\$|CA\$|C\$|A\$|US\$|[$£€])\s?\d[\d.,]*|\d[\d.,]*\s?€/;
const SYMBOLS = { EUR: ['€'], GBP: ['£'], BRL: ['R$'], USD: ['$', 'US$'], CAD: ['$', 'C$', 'CA$'], AUD: ['$', 'A$'], MXN: ['$', 'MX$'] };

/** A positive price in the expected currency, or null. */
export function priceIn(token, currency) {
  const m = token.match(PRICE);
  if (!m) return null;
  const symbol = m[0].replace(/[\d.,\s]/g, '');
  if (!(SYMBOLS[currency] ?? []).includes(symbol)) return null;
  const value = parseLocalizedPrice(m[0]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

const plan = (name, price, cycle = 'monthly') => ({ id: `${slug(name)}-${cycle}`, name, price, billingCycle: cycle });

/** "Premium | Duo | $18.99 / month" (a free-trial "$0" token may sit in between). */
export function parseSpotify(t, currency) {
  const plans = [];
  for (let i = 0; i < t.length - 2; i++) {
    if (t[i] !== 'Premium' || t[i + 1].length > 24 || /\d/.test(t[i + 1])) continue;
    for (let j = i + 2; j < Math.min(i + 6, t.length); j++) {
      const price = priceIn(t[j], currency);
      if (price) {
        if (!plans.some(p => p.name === t[i + 1])) plans.push(plan(t[i + 1], price));
        break;
      }
    }
  }
  return plans;
}

/** "50 GB | 0,99 €/Monat" — one plan per storage tier. */
export function parseICloud(t, currency) {
  const plans = [];
  for (let i = 0; i < t.length - 1; i++) {
    // French writes Go/To for GB/TB.
    const size = t[i].match(/^(?:iCloud\+?\s*)?(\d+)\s?(GB|TB|Go|To)$/i);
    if (!size) continue;
    const price = priceIn(t[i + 1], currency);
    const unit = size[2].toUpperCase().replace('GO', 'GB').replace('TO', 'TB');
    const name = `${size[1]} ${unit}`;
    if (price && !plans.some(p => p.name === name)) plans.push(plan(name, price));
  }
  return plans;
}

// Apple One's three plans in the storefront languages we cover.
const APPLE_ONE_PLANS = /^(individual|individuel|individuale|individueel|einzelperson|family|familie|famille|familia|família|familiar|famiglia|gezin|premier)$/i;

/** "Individual | £18.95" — only real plan names, never the per-service breakdown. */
export function parseAppleOne(t, currency) {
  const plans = [];
  for (let i = 0; i < t.length - 1; i++) {
    const name = t[i];
    if (!APPLE_ONE_PLANS.test(name)) continue;
    const price = priceIn(t[i + 1], currency);
    if (price && !plans.some(p => p.name === name)) plans.push(plan(name, price));
  }
  return plans;
}

const PARSERS = { 'Spotify': parseSpotify, 'iCloud+': parseICloud, 'Apple One': parseAppleOne };

if (import.meta.url === `file://${process.argv[1]}`) {
  const failures = [];
  for (const [cc, currency] of Object.entries(SOURCES.countries)) {
    if (cc === 'tr') continue; // Turkey has hand-written scrapers (scripts/scrape-tr-pricing*.cjs)
    const file = new URL(`web-${cc}.json`, OUT_DIR);
    const previous = await readJson(file, { services: {} });
    const services = {};
    for (const [service, src] of Object.entries(SOURCES.services)) {
      const url = src.web?.[cc];
      const parse = PARSERS[service];
      if (!url || !parse) continue;
      try {
        const plans = parse(tokens(await fetchText(url)), currency);
        if (plans.length) services[service] = { sourceUrl: url, plans };
        else throw new Error('no prices in the expected currency');
      } catch (err) {
        if (!(err instanceof NotFoundError)) failures.push(`${cc}/${service}: ${err.message}`);
        if (previous.services[service]) services[service] = previous.services[service]; // keep last good
      }
      await sleep(1_500);
    }
    await writeJson(file, { country: cc.toUpperCase(), currency, source: 'web', updatedAt: new Date().toISOString(), services });
    console.log(`${cc}: ${Object.keys(services).length} services`);
  }
  if (failures.length) console.warn(`Failures (kept previous data):\n${failures.join('\n')}`);
}
