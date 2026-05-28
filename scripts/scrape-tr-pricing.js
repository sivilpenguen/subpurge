const fs = require('node:fs/promises');
const path = require('node:path');

const OUTPUT_PATH = path.join(process.cwd(), 'data', 'pricing-tr.json');

const SOURCES = [
  { service: 'Spotify',          url: 'https://www.spotify.com/tr-tr/premium/',                    parser: parseSpotify },
  { service: 'YouTube Premium',  url: 'https://www.youtube.com/premium?hl=tr&gl=TR',               parser: parseYouTubePremium },
  { service: 'Netflix',          url: 'https://www.netflix.com/tr/signup/planform',                parser: parseNetflix },
  { service: 'Disney+',          url: 'https://www.disneyplus.com/tr-tr/subscribe',                parser: parseDisney },
  { service: 'Amazon Prime',     url: 'https://www.amazon.com.tr/amazonprime',                     parser: parseAmazonPrime },
  { service: 'Exxen',            url: 'https://www.exxen.com/uyelik-paketleri',                    parser: parseExxen },
  { service: 'Gain',             url: 'https://www.gain.tv/abone-ol',                              parser: parseGain },
  { service: 'Puhu',             url: 'https://puhutv.com/uyelik',                                 parser: parsePuhu },
  { service: 'TOD',              url: 'https://tod.tv/subscribe',                                  parser: parseTod },
  { service: 'ChatGPT',          url: 'https://openai.com/chatgpt/pricing/',                       parser: parseChatGPT },
  { service: 'iCloud',           url: 'https://www.apple.com/tr/icloud/',                          parser: parseICloud },
  { service: 'LinkedIn Premium', url: 'https://www.linkedin.com/premium/products/?countryCode=TR', parser: parseLinkedIn },
];

function normalize(v) {
  return v.replace(/[​-\u200F⁠﻿]/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
}
function parsePrice(v) {
  return Number(v.replace(/\./g, '').replace(',', '.'));
}
function escapeRe(v) {
  return v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function compact(plans) {
  return plans.filter(Boolean);
}
function extractPlan(html, label, billingCycle, id, name) {
  const m = html.match(new RegExp(escapeRe(label) + '([\\s\\S]{0,280})'));
  if (!m) return null;
  const prices = [...m[1].matchAll(/₺([\d.,]+)/g)].map(x => parsePrice(x[1])).filter(p => p > 0);
  if (!prices.length) return null;
  return { id, name: name || label, price: prices[prices.length - 1], billingCycle };
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      'accept-language': 'tr-TR,tr;q=0.9,en;q=0.8',
      'accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
    },
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return normalize(await res.text());
}

function parseSpotify(html) {
  const defs = [
    { id: 'individual', name: 'Individual', billingCycle: 'monthly', re: />Bireysel<\/h3>[\s\S]{0,240}?Sonra ayda ₺([\d.,]+)/ },
    { id: 'duo',        name: 'Duo',        billingCycle: 'monthly', re: />Duo<\/h3>[\s\S]{0,180}?₺([\d.,]+)\s*\/\s*ay/ },
    { id: 'family',     name: 'Family',     billingCycle: 'monthly', re: />Aile<\/h3>[\s\S]{0,180}?₺([\d.,]+)\s*\/\s*ay/ },
    { id: 'student',    name: 'Student',    billingCycle: 'monthly', re: />Öğrenci<\/h3>[\s\S]{0,240}?Sonra ayda ₺([\d.,]+)/ },
  ];
  const plans = compact(defs.map(({ re, ...p }) => { const m = html.match(re); return m ? { ...p, price: parsePrice(m[1]) } : null; }));
  if (!plans.length) throw new Error('No Spotify plans found');
  return { plans };
}

function parseYouTubePremium(html) {
  const plans = compact([
    extractPlan(html, '"text":"Bireysel"',          'monthly', 'individual',        'Individual'),
    extractPlan(html, '"text":"Aile planı"',   'monthly', 'family',            'Family'),
    extractPlan(html, '"text":"Öğrenci"',           'monthly', 'student',           'Student'),
    extractPlan(html, '"text":"1 yıllık bireysel"', 'yearly', 'individual-yearly', 'Individual Yearly'),
  ]);
  if (!plans.length) throw new Error('No YouTube Premium plans found');
  return { plans };
}

function parseNetflix(html) {
  const plans = compact([
    extractPlan(html, 'Standart', 'monthly', 'standard', 'Standard'),
    extractPlan(html, 'Premium',  'monthly', 'premium',  'Premium'),
    extractPlan(html, 'Temel',    'monthly', 'basic',    'Basic'),
  ]);
  if (!plans.length) return { skipped: 'Netflix signup plan page structure changed or geo-restricted.' };
  return { plans };
}

function parseDisney(html) {
  const plans = compact([
    extractPlan(html, 'Standart', 'monthly', 'standard', 'Standard'),
    extractPlan(html, 'Premium',  'monthly', 'premium',  'Premium'),
  ]);
  if (!plans.length) {
    const prices = [...html.matchAll(/₺\s*([\d.,]+)/g)].map(x => parsePrice(x[1])).filter(p => p > 50);
    if (prices.length) return { plans: [{ id: 'monthly', name: 'Monthly', price: Math.min(...prices), billingCycle: 'monthly' }] };
    return { skipped: 'Disney+ subscribe page structure not recognized.' };
  }
  return { plans };
}

function parseAmazonPrime(html) {
  const monthly = html.match(/₺([\d.,]+)\s*\/\s*ay/);
  const yearly  = html.match(/₺([\d.,]+)\s*\/\s*yıl/);
  const plans = compact([
    monthly ? { id: 'monthly', name: 'Prime',        price: parsePrice(monthly[1]), billingCycle: 'monthly' } : null,
    yearly  ? { id: 'yearly',  name: 'Prime Yıllık', price: parsePrice(yearly[1]),  billingCycle: 'yearly'  } : null,
  ]);
  if (!plans.length) return { skipped: 'Amazon Prime TR page structure not recognized.' };
  return { plans };
}

function parseExxen(html) {
  const plans = compact([
    extractPlan(html, 'Exxen Reklam', 'monthly', 'ads',      'Exxen Reklamlı'),
    extractPlan(html, 'Exxen+',       'monthly', 'plus',     'Exxen+'),
    extractPlan(html, 'Exxen',        'monthly', 'standard', 'Exxen'),
  ]);
  if (!plans.length) {
    const prices = [...html.matchAll(/₺([\d.,]+)\s*\/\s*ay/g)].map(x => parsePrice(x[1])).filter(p => p > 0);
    if (prices.length) return { plans: [{ id: 'monthly', name: 'Exxen', price: Math.min(...prices), billingCycle: 'monthly' }] };
    return { skipped: 'Exxen page structure not recognized.' };
  }
  return { plans };
}

function parseGain(html) {
  const monthly = html.match(/₺([\d.,]+)\s*\/\s*ay/);
  const yearly  = html.match(/₺([\d.,]+)\s*\/\s*yıl/);
  const plans = compact([
    monthly ? { id: 'monthly', name: 'Gain Aylık',  price: parsePrice(monthly[1]), billingCycle: 'monthly' } : null,
    yearly  ? { id: 'yearly',  name: 'Gain Yıllık', price: parsePrice(yearly[1]),  billingCycle: 'yearly'  } : null,
  ]);
  if (!plans.length) return { skipped: 'Gain page structure not recognized.' };
  return { plans };
}

function parsePuhu(html) {
  const monthly = html.match(/₺([\d.,]+)\s*\/\s*ay/);
  const yearly  = html.match(/₺([\d.,]+)\s*\/\s*yıl/);
  const plans = compact([
    monthly ? { id: 'monthly', name: 'Puhu Aylık',  price: parsePrice(monthly[1]), billingCycle: 'monthly' } : null,
    yearly  ? { id: 'yearly',  name: 'Puhu Yıllık', price: parsePrice(yearly[1]),  billingCycle: 'yearly'  } : null,
  ]);
  if (!plans.length) return { skipped: 'Puhu page structure not recognized.' };
  return { plans };
}

function parseTod(html) {
  const prices = [...html.matchAll(/₺([\d.,]+)/g)].map(x => parsePrice(x[1])).filter(p => p > 20);
  if (!prices.length) return { skipped: 'TOD page structure not recognized.' };
  return { plans: [{ id: 'monthly', name: 'TOD', price: Math.min(...prices), billingCycle: 'monthly' }] };
}

function parseChatGPT(html) {
  const m = html.match(/\$([\d.,]+)\s*\/\s*month/i);
  if (!m) return { skipped: 'ChatGPT pricing page structure not recognized.' };
  return { plans: [{ id: 'plus', name: 'ChatGPT Plus', price: parsePrice(m[1]), billingCycle: 'monthly' }], currency: 'USD' };
}

function parseICloud(html) {
  const plans = compact([
    extractPlan(html, '50 GB',  'monthly', '50gb',  'iCloud+ 50GB'),
    extractPlan(html, '200 GB', 'monthly', '200gb', 'iCloud+ 200GB'),
    extractPlan(html, '2 TB',   'monthly', '2tb',   'iCloud+ 2TB'),
    extractPlan(html, '6 TB',   'monthly', '6tb',   'iCloud+ 6TB'),
    extractPlan(html, '12 TB',  'monthly', '12tb',  'iCloud+ 12TB'),
  ]);
  if (!plans.length) return { skipped: 'iCloud TR page structure not recognized.' };
  return { plans };
}

function parseLinkedIn(html) {
  const plans = compact([
    extractPlan(html, 'Career',   'monthly', 'career',   'LinkedIn Career'),
    extractPlan(html, 'Business', 'monthly', 'business', 'LinkedIn Business'),
  ]);
  if (!plans.length) return { skipped: 'LinkedIn Premium TR page structure not recognized.' };
  return { plans };
}

async function main() {
  const result = { country: 'TR', currency: 'TRY', updatedAt: new Date().toISOString(), services: {}, skipped: {} };

  for (const source of SOURCES) {
    process.stdout.write('Fetching ' + source.service + '... ');
    try {
      const html = await fetchHtml(source.url);
      const parsed = source.parser(html);
      if (parsed.skipped) {
        result.skipped[source.service] = { reason: parsed.skipped, sourceUrl: source.url };
        console.log('⚠ skipped');
        continue;
      }
      result.services[source.service] = { sourceUrl: source.url, ...(parsed.currency ? { currency: parsed.currency } : {}), plans: parsed.plans };
      console.log('✓ ' + parsed.plans.length + ' plan(s)');
    } catch (err) {
      result.skipped[source.service] = { reason: err instanceof Error ? err.message : String(err), sourceUrl: source.url };
      console.log('✗ error');
    }
  }

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log('\nDone: ' + Object.keys(result.services).length + ' updated, ' + Object.keys(result.skipped).length + ' skipped');
}

void main();
