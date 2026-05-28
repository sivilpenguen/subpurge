// assets/logos/ klasörüne PNG attığında otomatik kullanılır.
// Dosya adları aşağıdaki map ile eşleşmeli (snake_case).
// Placeholder olarak 1x1 şeffaf PNG var — gerçek PNG koyunca direkt değişir.

const LOCAL_LOGOS: Record<string, number> = {
  'Netflix': require('../assets/logos/netflix.png'),
  'Spotify': require('../assets/logos/spotify.png'),
  'Amazon Prime': require('../assets/logos/amazon_prime.png'),
  'YouTube Premium': require('../assets/logos/youtube.png'),
  'Disney+': require('../assets/logos/disney_plus.png'),
  'Puhu': require('../assets/logos/puhu.png'),
  'Exxen': require('../assets/logos/exxen.png'),
  'Gain': require('../assets/logos/gain.png'),
  'Tod': require('../assets/logos/tod.png'),
  'Microsoft 365': require('../assets/logos/microsoft_365.png'),
  'Adobe Creative Cloud': require('../assets/logos/adobe_cc.png'),
  'PlayStation Plus': require('../assets/logos/playstation_plus.png'),
  'Xbox Game Pass': require('../assets/logos/xbox_game_pass.png'),
  'Apple One': require('../assets/logos/apple_one.png'),
  'iCloud+': require('../assets/logos/icloud.png'),
  'Canva': require('../assets/logos/canva.png'),
  'Duolingo Plus': require('../assets/logos/duolingo.png'),
  'HBO Max': require('../assets/logos/hbo_max.png'),
  'ChatGPT Plus': require('../assets/logos/chatgpt.png'),
  'LinkedIn Premium': require('../assets/logos/linkedin.png'),
  'Dropbox': require('../assets/logos/dropbox.png'),
  'Hulu': require('../assets/logos/hulu.png'),
  'X (Twitter)': require('../assets/logos/x_twitter.png'),
  'Zoom': require('../assets/logos/zoom.png'),
  'MUBI': require('../assets/logos/mubi.png'),
  'Tabii': require('../assets/logos/tabii.png'),
  'Gemini': require('../assets/logos/gemini.png'),
  'Instagram': require('../assets/logos/instagram.png'),
  'CapCut': require('../assets/logos/capcut.png'),
};

export function getLocalLogo(serviceName: string): number | undefined {
  return LOCAL_LOGOS[serviceName];
}
