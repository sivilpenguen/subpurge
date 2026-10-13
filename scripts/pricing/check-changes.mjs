// Compares the freshly built country files with the committed ones. Any price
// that moved by more than 50%, or a service that lost all its plans, goes to
// data/pricing/REVIEW.md and the workflow opens a pull request instead of
// committing straight to main.
import { execFileSync } from 'node:child_process';
import { appendFileSync, writeFileSync } from 'node:fs';
import { OUT_DIR, readJson, SOURCES } from './lib.mjs';

function committed(path) {
  try {
    return JSON.parse(execFileSync('git', ['show', `HEAD:${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return null;
  }
}

const findings = [];
for (const cc of Object.keys(SOURCES.countries)) {
  const now = await readJson(new URL(`${cc}.json`, OUT_DIR), null);
  const before = committed(`data/pricing/${cc}.json`);
  if (!now || !before) continue;
  for (const [service, prev] of Object.entries(before.services)) {
    for (const source of ['web', 'appStore']) {
      const oldPlans = prev[source] ?? [];
      const newPlans = now.services[service]?.[source] ?? [];
      if (oldPlans.length && !newPlans.length) findings.push(`- ${cc.toUpperCase()} · ${service} (${source}): all plans disappeared`);
      for (const plan of newPlans) {
        const old = oldPlans.find(p => p.id === plan.id);
        if (!old) continue;
        const ratio = plan.price / old.price;
        if (ratio > 1.5 || ratio < 1 / 1.5) {
          findings.push(`- ${cc.toUpperCase()} · ${service} (${source}) · ${plan.name}: ${old.price} → ${plan.price}`);
        }
      }
    }
  }
}

const review = findings.length > 0;
writeFileSync(new URL('REVIEW.md', OUT_DIR), review
  ? `# Prices to check\n\nThese moved by more than 50% (or vanished) since the last run:\n\n${findings.join('\n')}\n`
  : '# Prices to check\n\nNothing unusual in the last run.\n');
console.log(review ? findings.join('\n') : 'No large changes.');
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `needs_review=${review}\n`);
