/**
 * Puppeteer-based scraper for JS-rendered pricing pages.
 * Merges results into data/pricing-tr.json (created by scrape-tr-pricing.js).
 *
 * Usage: node scripts/scrape-tr-pricing-puppeteer.js
 */

const fs = require('node:fs/promises');
const path = require('node:path');
const puppeteer = require('puppeteer');

const OUTPUT_PATH = path.join(process.cwd(), 'data', 'pricing-tr.json');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(v) {
  const s = String(v).trim();
  if (/^\d+\.\d{1,2}$/.test(s)) return parseFloat(s);
  return Number(s.replace(/\./g, '').replace(',', '.'));
}

function compact(arr) { return arr.filter(Boolean); }

async function openPage(browser, url) {
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8' });
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  );
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  return page;
}

// Sayfadan TL fiyatlarını çek (₺X veya X TL formatları)
async function getTLPrices(page, minPrice = 20, maxPrice = 10000) {
  return page.evaluate((min, max) => {
    const texts = document.body.innerText;
    const toNum = s => {
      if (/^\d+\.\d{1,2}$/.test(s.trim())) return parseFloat(s);
      return Number(s.replace(/\./g, '').replace(',', '.'));
    };
    const results = [];
    for (const m of texts.matchAll(/₺\s*([\d.,]+)/g)) results.push(toNum(m[1]));
    for (const m of texts.matchAll(/([\d.,]+)\s*TL\b/g)) results.push(toNum(m[1]));
    return [...new Set(results)].filter(p => p >= min && p <= max);
  }, minPrice, maxPrice);
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

async function scrapeNetflix(browser) {
  const page = await openPage(browser, 'https://www.netflix.com/tr/signup/planform');
  await new Promise(r => setTimeout(r, 3000));
  // Accept cookie consent if present
  try {
    const btn = await page.$('[data-uia="accept-cookies-button"], button[id*="cookie"], button[class*="cookie-accept"]');
    if (btn) { await btn.click(); await new Promise(r => setTimeout(r, 1000)); }
  } catch { /* ignore */ }

  const plans = await page.evaluate(() => {
    const results = [];
    const rows = document.querySelectorAll('[data-uia*="plan"], .planCard, [class*="plan-card"], [class*="planCard"]');

    // Tablo yapısı: her satır plan adı + fiyat
    document.querySelectorAll('tr, [role="row"]').forEach(row => {
      const text = row.innerText || '';
      const priceMatch = text.match(/₺\s*([\d.,]+)/);
      if (!priceMatch) return;
      if (text.toLowerCase().includes('reklam')) results.push({ name: 'Reklam Destekli', raw: priceMatch[1] });
      else if (text.toLowerCase().includes('standart') || text.toLowerCase().includes('standard')) results.push({ name: 'Standard', raw: priceMatch[1] });
      else if (text.toLowerCase().includes('premium')) results.push({ name: 'Premium', raw: priceMatch[1] });
    });
    return results;
  });

  // Fallback: tüm sayfa fiyatlarını al
  if (!plans.length) {
    const prices = await getTLPrices(page, 100, 1000);
    await page.close();
    if (!prices.length) return { skipped: 'Netflix TR plan prices not found even with JS.' };
    const unique = [...new Set(prices)].sort((a, b) => a - b);
    return {
      plans: compact([
        unique[0] ? { id: 'standard-ads', name: 'Reklam Destekli', price: unique[0], billingCycle: 'monthly' } : null,
        unique[1] ? { id: 'standard',     name: 'Standard',        price: unique[1], billingCycle: 'monthly' } : null,
        unique[2] ? { id: 'premium',      name: 'Premium',         price: unique[2], billingCycle: 'monthly' } : null,
      ]),
    };
  }

  await page.close();
  const idMap = { 'Reklam Destekli': 'standard-ads', 'Standard': 'standard', 'Premium': 'premium' };
  return {
    plans: plans.map(p => ({ id: idMap[p.name] || p.name.toLowerCase(), name: p.name, price: parsePrice(p.raw), billingCycle: 'monthly' })),
  };
}

async function scrapeDisney(browser) {
  // Disney+ TR plan-select requires login — permanently skipped
  return { skipped: 'Disney+ TR plan-select requires login (unsolvable without credentials).' };
}

async function scrapeAmazon(browser) {
  const page = await openPage(browser, 'https://www.amazon.com.tr/amazonprime');
  await new Promise(r => setTimeout(r, 3000));

  const result = await page.evaluate(() => {
    const text = document.body.innerText;
    const monthly = text.match(/₺\s*([\d.,]+)\s*\/\s*ay/) || text.match(/([\d.,]+)\s*TL\s*\/\s*ay/i);
    const yearly  = text.match(/₺\s*([\d.,]+)\s*\/\s*yıl/) || text.match(/([\d.,]+)\s*TL\s*\/\s*yıl/i);
    return { monthly: monthly?.[1], yearly: yearly?.[1] };
  });

  await page.close();
  const plans = compact([
    result.monthly ? { id: 'monthly', name: 'Prime',        price: parsePrice(result.monthly), billingCycle: 'monthly' } : null,
    result.yearly  ? { id: 'yearly',  name: 'Prime Yıllık', price: parsePrice(result.yearly),  billingCycle: 'yearly'  } : null,
  ]);
  if (!plans.length) return { skipped: 'Amazon Prime TR prices not found.' };
  return { plans };
}

async function scrapeExxen(browser) {
  const page = await openPage(browser, 'https://www.exxen.com/uyelik');
  await new Promise(r => setTimeout(r, 2000));

  const prices = await getTLPrices(page, 30, 1000);
  await page.close();

  if (!prices.length) return { skipped: 'Exxen TR prices not found.' };
  const unique = [...new Set(prices)].sort((a, b) => a - b);
  return {
    plans: compact([
      unique[0] ? { id: 'standard', name: 'Exxen',   price: unique[0], billingCycle: 'monthly' } : null,
      unique[1] ? { id: 'plus',     name: 'Exxen+',  price: unique[1], billingCycle: 'monthly' } : null,
    ]),
  };
}

async function scrapePuhu(browser) {
  const page = await openPage(browser, 'https://puhutv.com/uyelik');
  await new Promise(r => setTimeout(r, 3000));

  const prices = await getTLPrices(page, 20, 500);
  await page.close();

  if (!prices.length) return { skipped: 'Puhu TR prices not found.' };
  const unique = [...new Set(prices)].sort((a, b) => a - b);
  return {
    plans: [{ id: 'monthly', name: 'Puhu', price: unique[0], billingCycle: 'monthly' }],
  };
}

async function scrapeTod(browser) {
  const page = await openPage(browser, 'https://www.tod.tv/tr/subscribe');
  await new Promise(r => setTimeout(r, 3000));

  const prices = await getTLPrices(page, 30, 1000);
  await page.close();

  if (!prices.length) return { skipped: 'TOD TR prices not found.' };
  const unique = [...new Set(prices)].sort((a, b) => a - b);
  return {
    plans: compact([
      unique[0] ? { id: 'monthly', name: 'TOD Aylık',  price: unique[0], billingCycle: 'monthly' } : null,
      unique[1] ? { id: 'yearly',  name: 'TOD Yıllık', price: unique[1], billingCycle: 'yearly'  } : null,
    ]),
  };
}

async function scrapeChatGPT(browser) {
  const page = await openPage(browser, 'https://openai.com/chatgpt/pricing/');
  await new Promise(r => setTimeout(r, 2000));

  const result = await page.evaluate(() => {
    const text = document.body.innerText;
    const m = text.match(/\$([\d.,]+)\s*\/\s*month/i) || text.match(/\$([\d.,]+)\s*per\s*month/i);
    return m ? m[1] : null;
  });

  await page.close();
  if (!result) return { skipped: 'ChatGPT pricing not found.' };
  return {
    plans: [{ id: 'plus', name: 'ChatGPT Plus', price: parsePrice(result), billingCycle: 'monthly' }],
    currency: 'USD',
  };
}

async function scrapeICloud(browser) {
  const page = await openPage(browser, 'https://www.apple.com/tr/icloud/');
  await new Promise(r => setTimeout(r, 2000));

  const plans = await page.evaluate(() => {
    const results = [];
    const sizes = [
      { label: '50 GB',  id: '50gb',  name: 'iCloud+ 50GB'  },
      { label: '200 GB', id: '200gb', name: 'iCloud+ 200GB' },
      { label: '2 TB',   id: '2tb',   name: 'iCloud+ 2TB'   },
      { label: '6 TB',   id: '6tb',   name: 'iCloud+ 6TB'   },
      { label: '12 TB',  id: '12tb',  name: 'iCloud+ 12TB'  },
    ];
    const allText = document.body.innerText.replace(/ /g, ' ');
    // Page layout: "iCloud+\nAyda X TL\n50 GB\n..." — price appears BEFORE size label
    for (const s of sizes) {
      const idx = allText.indexOf(s.label);
      if (idx < 0) continue;
      // Look backwards up to 200 chars for a TL price — use last match
      const snippet = allText.slice(Math.max(0, idx - 200), idx);
      const allTl = [...snippet.matchAll(/([\d.,]+)\s*TL\b/g)];
      const allSym = [...snippet.matchAll(/₺\s*([\d.,]+)/g)];
      const last = allTl.length ? allTl[allTl.length - 1] : (allSym.length ? allSym[allSym.length - 1] : null);
      const m = last;
      if (m) results.push({ id: s.id, name: s.name, raw: m[1] });
    }
    return results;
  });

  await page.close();
  if (!plans.length) return { skipped: 'iCloud TR prices not found.' };
  return {
    plans: plans.map(p => ({ id: p.id, name: p.name, price: parsePrice(p.raw), billingCycle: 'monthly' })),
  };
}

async function scrapeLinkedIn(browser) {
  const page = await openPage(browser, 'https://www.linkedin.com/premium/products/?countryCode=TR');
  await new Promise(r => setTimeout(r, 3000));

  const plans = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('[class*="premium-plan"], [data-test*="plan"], section, article').forEach(el => {
      const text = el.innerText || '';
      const priceMatch = text.match(/₺\s*([\d.,]+)/);
      if (!priceMatch) return;
      if (text.toLowerCase().includes('career')) results.push({ name: 'LinkedIn Career', raw: priceMatch[1] });
      else if (text.toLowerCase().includes('business')) results.push({ name: 'LinkedIn Business', raw: priceMatch[1] });
    });
    return results;
  });

  // Fallback
  if (!plans.length) {
    const prices = await getTLPrices(page, 100, 5000);
    await page.close();
    if (!prices.length) return { skipped: 'LinkedIn Premium TR prices not found (may require login).' };
    const unique = [...new Set(prices)].sort((a, b) => a - b);
    return {
      plans: compact([
        unique[0] ? { id: 'career',   name: 'LinkedIn Career',   price: unique[0], billingCycle: 'monthly' } : null,
        unique[1] ? { id: 'business', name: 'LinkedIn Business', price: unique[1], billingCycle: 'monthly' } : null,
      ]),
    };
  }

  await page.close();
  return {
    plans: plans.map(p => ({
      id: p.name.toLowerCase().replace('linkedin ', ''),
      name: p.name,
      price: parsePrice(p.raw),
      billingCycle: 'monthly',
    })),
  };
}

// ─── Sources ──────────────────────────────────────────────────────────────────

const PUPPETEER_SOURCES = [
  { service: 'Netflix',          url: 'https://www.netflix.com/tr/signup/planform',                   scraper: scrapeNetflix },
  { service: 'Disney+',          url: 'https://www.disneyplus.com/tr-tr/sign-up/plan-select',         scraper: scrapeDisney  },
  { service: 'Amazon Prime',     url: 'https://www.amazon.com.tr/amazonprime',                        scraper: scrapeAmazon  },
  { service: 'Exxen',            url: 'https://www.exxen.com/uyelik',                                 scraper: scrapeExxen   },
  { service: 'Puhu',             url: 'https://puhutv.com',                                           scraper: scrapePuhu    },
  { service: 'TOD',              url: 'https://www.tod.tv/tr/subscribe',                              scraper: scrapeTod     },
  { service: 'ChatGPT',          url: 'https://openai.com/chatgpt/pricing/',                          scraper: scrapeChatGPT },
  { service: 'iCloud',           url: 'https://www.apple.com/tr/icloud/',                             scraper: scrapeICloud  },
  { service: 'LinkedIn Premium', url: 'https://www.linkedin.com/premium/products/?countryCode=TR',    scraper: scrapeLinkedIn },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

async function main() {
  // Mevcut pricing-tr.json'u oku (fetch scraper'ın sonuçlarını koru)
  let existing = { country: 'TR', currency: 'TRY', updatedAt: new Date().toISOString(), services: {}, skipped: {} };
  try {
    const raw = await fs.readFile(OUTPUT_PATH, 'utf8');
    existing = JSON.parse(raw);
    existing.updatedAt = new Date().toISOString();
  } catch {
    // Dosya yoksa yeni oluştur
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  for (const source of PUPPETEER_SOURCES) {
    process.stdout.write('Puppeteer → ' + source.service + '... ');
    try {
      const result = await source.scraper(browser);
      if (result.skipped) {
        existing.skipped[source.service] = { reason: result.skipped, sourceUrl: source.url };
        console.log('⚠ skipped');
        continue;
      }
      existing.services[source.service] = {
        sourceUrl: source.url,
        ...(result.currency ? { currency: result.currency } : {}),
        plans: result.plans,
      };
      // Skipped listesinden kaldır (artık başarılı)
      delete existing.skipped[source.service];
      console.log('✓ ' + result.plans.length + ' plan(s): ' + result.plans.map(p => p.name + ' ' + (result.currency === 'USD' ? '$' : '₺') + p.price).join(', '));
    } catch (err) {
      existing.skipped[source.service] = {
        reason: err instanceof Error ? err.message : String(err),
        sourceUrl: source.url,
      };
      console.log('✗ ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  await browser.close();
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(existing, null, 2) + '\n', 'utf8');

  const ok = Object.keys(existing.services).length;
  const sk = Object.keys(existing.skipped).length;
  console.log('\nDone: ' + ok + ' total updated, ' + sk + ' skipped → ' + OUTPUT_PATH);
}

void main();
