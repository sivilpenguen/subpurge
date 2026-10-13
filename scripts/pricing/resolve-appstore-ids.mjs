// One-off helper: finds each service's App Store app id via the public iTunes
// Search API. Review the output, then keep the ids in sources.json.
const TERMS = {
  'Netflix': 'Netflix', 'Spotify': 'Spotify Music', 'Amazon Prime': 'Amazon Prime Video', 'YouTube Premium': 'YouTube',
  'Disney+': 'Disney+', 'Exxen': 'Exxen', 'Gain': 'Gain', 'Tod': 'TOD', 'Microsoft 365': 'Microsoft 365 Copilot',
  'Adobe Creative Cloud': 'Adobe Creative Cloud', 'Xbox Game Pass': 'Xbox Game Pass', 'Canva': 'Canva',
  'Duolingo Plus': 'Duolingo', 'HBO Max': 'HBO Max', 'CapCut': 'CapCut', 'Gemini': 'Google Gemini',
  'ChatGPT Plus': 'ChatGPT', 'LinkedIn Premium': 'LinkedIn', 'Dropbox': 'Dropbox', 'X (Twitter)': 'X',
  'Zoom': 'Zoom Workplace', 'Instagram': 'Instagram', 'MUBI': 'MUBI', 'Tabii': 'tabii', 'Hulu': 'Hulu',
};
const out = {};
for (const [service, term] of Object.entries(TERMS)) {
  const country = ['Exxen', 'Gain', 'Tod', 'Tabii'].includes(service) ? 'tr' : 'us';
  const url = `https://itunes.apple.com/search?${new URLSearchParams({ term, entity: 'software', country, limit: '3' })}`;
  const res = await fetch(url);
  const json = await res.json();
  const hit = json.results?.[0];
  out[service] = hit ? { id: hit.trackId, name: hit.trackName, seller: hit.sellerName } : null;
  console.log(service.padEnd(22), hit ? `${hit.trackId}  ${hit.trackName} — ${hit.sellerName}` : 'NOT FOUND');
}
