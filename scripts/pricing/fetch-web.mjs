// Web prices for countries without a hand-written scraper: the page text goes to
// a small model on GitHub Models (free, rate-limited; GITHUB_TOKEN with
// `models: read` in Actions). Every answer is validated before it is kept.
import { fetchText, inferCycle, NotFoundError, OUT_DIR, readJson, sleep, slug, SOURCES, writeJson } from './lib.mjs';

const ENDPOINT = 'https://models.github.ai/inference/chat/completions';
const MODEL = process.env.PRICING_MODEL ?? 'openai/gpt-4.1-mini';
const TOKEN = process.env.GITHUB_TOKEN;
const MAX_CHARS = 40_000;

export function pageText(html) {
  return html
    .replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_CHARS);
}

const PROMPT = (service, currency) => `You extract subscription prices from the text of ${service}'s official pricing page.
Return JSON only: {"currency": "<ISO 4217 code the prices are in>", "plans": [{"name": "<plan name>", "price": <number>, "billingCycle": "monthly" | "yearly"}]}.
Rules: list only regular consumer plans with their normal price (not trial, promo or "first month" prices).
Use the price exactly as shown, as a plain number with a dot for decimals. If the page shows no prices, return {"currency": null, "plans": []}.
Expected currency: ${currency}. Do not convert currencies.`;

/** Rejects anything that doesn't look like a real price list in the expected currency. */
export function validate(answer, currency) {
  if (!answer || answer.currency !== currency || !Array.isArray(answer.plans)) return null;
  const plans = [];
  for (const p of answer.plans) {
    const price = Number(p?.price);
    const name = String(p?.name ?? '').trim();
    if (!name || !Number.isFinite(price) || price <= 0 || price > 100_000) continue;
    const billingCycle = p.billingCycle === 'yearly' ? 'yearly' : p.billingCycle === 'monthly' ? 'monthly' : inferCycle(name);
    const id = `${slug(name)}-${billingCycle}`;
    if (!plans.some(x => x.id === id)) plans.push({ id, name, price, billingCycle });
  }
  return plans.length >= 1 && plans.length <= 12 ? plans : null;
}

async function ask(service, currency, text) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PROMPT(service, currency) },
        { role: 'user', content: text },
      ],
    }),
  });
  if (!res.ok) throw new Error(`GitHub Models HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  return JSON.parse(json.choices?.[0]?.message?.content ?? 'null');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!TOKEN) {
    console.warn('GITHUB_TOKEN not set — skipping web prices (App Store prices still update).');
    process.exit(0);
  }
  const failures = [];
  for (const [cc, currency] of Object.entries(SOURCES.countries)) {
    if (cc === 'tr') continue; // Turkey has hand-written scrapers (scripts/scrape-tr-pricing*.js)
    const file = new URL(`web-${cc}.json`, OUT_DIR);
    const previous = await readJson(file, { services: {} });
    const services = {};
    for (const [service, src] of Object.entries(SOURCES.services)) {
      const url = src.web?.[cc];
      if (!url) continue;
      try {
        const plans = validate(await ask(service, currency, pageText(await fetchText(url))), currency);
        if (plans) services[service] = { sourceUrl: url, plans };
        else throw new Error('answer failed validation');
      } catch (err) {
        if (!(err instanceof NotFoundError)) failures.push(`${cc}/${service}: ${err.message}`);
        if (previous.services[service]) services[service] = previous.services[service]; // keep last good
      }
      await sleep(4_000); // stay well under the free tier's per-minute limit
    }
    await writeJson(file, { country: cc.toUpperCase(), currency, source: 'web', updatedAt: new Date().toISOString(), services });
    console.log(`${cc}: ${Object.keys(services).length} services`);
  }
  if (failures.length) console.warn(`Failures (kept previous data):\n${failures.join('\n')}`);
}
