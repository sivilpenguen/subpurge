import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export const SOURCES = JSON.parse(await readFile(new URL('./sources.json', import.meta.url), 'utf8'));
export const OUT_DIR = new URL('../../data/pricing/', import.meta.url);

export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function readJson(url, fallback) {
  try { return JSON.parse(await readFile(url, 'utf8')); } catch { return fallback; }
}

export async function writeJson(url, value) {
  await mkdir(dirname(url.pathname), { recursive: true });
  await writeFile(url, JSON.stringify(value, null, 2) + '\n');
}

/** "₺1.299,99", "19,99 €", "$1,299.99", "R$ 44,90", "¥1,500" → number. */
export function parseLocalizedPrice(text) {
  const raw = String(text).replace(/[^\d.,]/g, '');
  if (!raw) return NaN;
  const lastSep = Math.max(raw.lastIndexOf(','), raw.lastIndexOf('.'));
  if (lastSep === -1) return Number(raw);
  const decimals = raw.length - lastSep - 1;
  if (decimals === 3) return Number(raw.replace(/[.,]/g, '')); // "1.500" / "1,500" are thousands
  const intPart = raw.slice(0, lastSep).replace(/[.,]/g, '');
  return Number(`${intPart}.${raw.slice(lastSep + 1)}`);
}

const YEARLY = /\b(year|yearly|annual|annually|yıllık|yillik|jahr|jährlich|jahres|anual|annuel|annuale|jaar|jaarlijks|12 ?(months?|ay|monate|meses|mois|mesi|maanden))\b/i;
const WEEKLY = /\b(week|weekly|haftalık|woche|semana|semaine|settimana)\b/i;

export function inferCycle(name) {
  if (YEARLY.test(name)) return 'yearly';
  if (WEEKLY.test(name)) return 'weekly';
  return 'monthly';
}

export function slug(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

export class NotFoundError extends Error {}

/** GET with backoff on 429/5xx. A 404 throws NotFoundError (e.g. app not sold in that country). */
export async function fetchText(url, headers = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'accept-language': 'en;q=0.9',
        ...headers,
      },
    });
    if (res.ok) return res.text();
    if (res.status === 404) throw new NotFoundError(url);
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await sleep(15_000 * (attempt + 1));
      continue;
    }
    throw new Error(`HTTP ${res.status} ${url}`);
  }
}
