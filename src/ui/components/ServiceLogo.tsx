import { useState } from 'react';

// Bundled logos in public/logos/, keyed by service name.
const LOCAL_LOGOS: Record<string, string> = {
  'Netflix': 'netflix',
  'Spotify': 'spotify',
  'Amazon Prime': 'amazon_prime',
  'YouTube Premium': 'youtube',
  'Disney+': 'disney_plus',
  'Puhu': 'puhu',
  'Exxen': 'exxen',
  'Gain': 'gain',
  'Tod': 'tod',
  'Microsoft 365': 'microsoft_365',
  'Adobe Creative Cloud': 'adobe_cc',
  'PlayStation Plus': 'playstation_plus',
  'Xbox Game Pass': 'xbox_game_pass',
  'Apple One': 'apple_one',
  'iCloud+': 'icloud',
  'Canva': 'canva',
  'Duolingo Plus': 'duolingo',
  'HBO Max': 'hbo_max',
  'ChatGPT Plus': 'chatgpt',
  'LinkedIn Premium': 'linkedin',
  'Dropbox': 'dropbox',
  'Hulu': 'hulu',
  'X (Twitter)': 'x_twitter',
  'Zoom': 'zoom',
  'MUBI': 'mubi',
  'Tabii': 'tabii',
  'Gemini': 'gemini',
  'Instagram': 'instagram',
  'CapCut': 'capcut',
};

// Monochrome marks, recoloured to the theme's text colour (see .logo.tint).
const TINTED = new Set(['ChatGPT Plus', 'X (Twitter)']);

interface Props {
  name: string;
  color: string;
  size?: number;
}

export function ServiceLogo({ name, color, size = 40 }: Props) {
  const file = LOCAL_LOGOS[name];
  const [failed, setFailed] = useState(false);

  if (file && !failed) {
    return (
      <div className={`logo${TINTED.has(name) ? ' tint' : ''}`} style={{ width: size, height: size }}>
        <img src={`logos/${file}.png`} alt="" loading="lazy" onError={() => setFailed(true)} />
      </div>
    );
  }

  const letter = (name.trim()[0] ?? '?').toLocaleUpperCase();
  return (
    <div className="logo" style={{ width: size, height: size, background: color || '#6C6C6C', borderColor: 'transparent' }}>
      <span className="monogram" style={{ fontSize: size * 0.46 }}>{letter}</span>
    </div>
  );
}
