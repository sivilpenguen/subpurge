import pricingTr from '../data/pricing-tr.json';

export type BillingCycle = 'monthly' | 'yearly' | 'weekly';

export interface ServicePlanTemplate {
  id: string;
  name: string;
  price: number;
  billingCycle: BillingCycle;
}

export type ServiceCategory = 'video' | 'music' | 'gaming' | 'productivity' | 'storage' | 'education' | 'social' | 'other';

export const SERVICE_CATEGORIES: { id: ServiceCategory; label: string }[] = [
  { id: 'video',       label: '🎥 Dizi, Film & Canlı TV' },
  { id: 'music',       label: '🎵 Müzik & Video' },
  { id: 'gaming',      label: '🎮 Oyun' },
  { id: 'productivity', label: '💻 İş, Tasarım & Yapay Zeka' },
  { id: 'storage',     label: '☁️ Depolama & Ekosistem' },
  { id: 'education',   label: '🦉 Dil Öğrenimi' },
  { id: 'social',      label: '📱 Sosyal Medya' },
];

export interface ServicePreset {
  name: string;
  color: string;
  icon: string;
  logoUrl?: string;
  manageDeepLink?: string;
  quickCancelUrl?: string;
  plans?: ServicePlanTemplate[];
  category?: ServiceCategory;
}

type PricingTrPlan = { id: string; name: string; price: number; billingCycle: string };
type PricingTrServices = Record<string, { plans: PricingTrPlan[] }>;

/**
 * pricing-tr.json'daki planları preset'lere uygular.
 * Aynı ID varsa fiyatı günceller; yoksa yeni plan olarak ekler.
 * `npm run pricing:tr` çalıştırıldığında otomatik devreye girer.
 */
function applyPricingOverrides(presets: ServicePreset[]): ServicePreset[] {
  const trServices = pricingTr.services as PricingTrServices;

  return presets.map(preset => {
    const trService = trServices[preset.name];
    if (!trService?.plans?.length) return preset;

    const merged = [...(preset.plans ?? [])];

    for (const trPlan of trService.plans) {
      const billingCycle = trPlan.billingCycle as BillingCycle;
      const existing = merged.findIndex(p => p.id === trPlan.id);
      if (existing >= 0) {
        merged[existing] = { ...merged[existing], price: trPlan.price, billingCycle };
      } else {
        merged.push({ id: trPlan.id, name: trPlan.name, price: trPlan.price, billingCycle });
      }
    }

    return { ...preset, plans: merged };
  });
}

const BASE_PRESETS: ServicePreset[] = [
  {
    name: 'Netflix',
    color: '#E50914',
    icon: '🎬',
    category: 'video' as const,
    logoUrl: 'https://logo.clearbit.com/netflix.com',
    manageDeepLink: 'https://www.netflix.com/YourAccount',
    quickCancelUrl: 'https://www.netflix.com/cancelplan',
    plans: [
      { id: 'standard', name: 'Standard', price: 229.99, billingCycle: 'monthly' },
      { id: 'premium', name: 'Premium', price: 299.99, billingCycle: 'monthly' },
    ],
  },
  {
    name: 'Spotify',
    color: '#1DB954',
    icon: '🎵',
    category: 'music' as const,
    logoUrl: 'https://logo.clearbit.com/spotify.com',
    manageDeepLink: 'https://www.spotify.com/account/overview/',
    quickCancelUrl: 'https://www.spotify.com/account/subscription/',
    plans: [
      { id: 'individual', name: 'Individual', price: 99, billingCycle: 'monthly' },
      { id: 'duo', name: 'Duo', price: 135, billingCycle: 'monthly' },
      { id: 'family', name: 'Family', price: 165, billingCycle: 'monthly' },
      { id: 'student', name: 'Student', price: 55, billingCycle: 'monthly' },
    ],
  },
  {
    name: 'Amazon Prime',
    color: '#00A8E1',
    icon: '📦',
    category: 'video' as const,
    logoUrl: 'https://logo.clearbit.com/primevideo.com',
    manageDeepLink: 'https://www.amazon.com/yourmembershipsandsubscriptions',
    quickCancelUrl: 'https://www.amazon.com/amazonprime',
    plans: [
      { id: 'monthly', name: 'Prime Reklamlı', price: 69.90, billingCycle: 'monthly' },
      { id: 'monthly-noad', name: 'Prime Reklamsız', price: 129.80, billingCycle: 'monthly' },
    ],
  },
  {
    name: 'YouTube Premium',
    color: '#FF0000',
    icon: '▶️',
    category: 'music' as const,
    logoUrl: 'https://logo.clearbit.com/youtube.com',
    manageDeepLink: 'https://www.youtube.com/account_paid_memberships',
    quickCancelUrl: 'https://www.youtube.com/paid_memberships',
    plans: [
      { id: 'individual', name: 'Bireysel', price: 79.99, billingCycle: 'monthly' },
      { id: 'family', name: 'Aile', price: 159.99, billingCycle: 'monthly' },
      { id: 'student', name: 'Öğrenci', price: 52.99, billingCycle: 'monthly' },
      { id: 'lite', name: 'Premium Lite', price: 49.99, billingCycle: 'monthly' },
    ],
  },
  {
    name: 'Disney+',
    color: '#113CCF',
    icon: '✨',
    category: 'video' as const,
    logoUrl: 'https://logo.clearbit.com/disneyplus.com',
    manageDeepLink: 'https://www.disneyplus.com/account',
    quickCancelUrl: 'https://www.disneyplus.com/account/subscription',
    plans: [
      { id: 'ads-monthly', name: 'Reklamlı Aylık', price: 249.90, billingCycle: 'monthly' },
      { id: 'ads-yearly', name: 'Reklamlı Yıllık', price: 2499.00, billingCycle: 'yearly' },
      { id: 'noad-monthly', name: 'Reklamsız Aylık', price: 449.90, billingCycle: 'monthly' },
      { id: 'noad-yearly', name: 'Reklamsız Yıllık', price: 4499.00, billingCycle: 'yearly' },
    ],
  },
  // { name: 'Puhu', color: '#FFD400', icon: '📺', logoUrl: 'https://logo.clearbit.com/puhutv.com', manageDeepLink: 'https://puhutv.com', quickCancelUrl: 'https://puhutv.com' },
  { name: 'Exxen', color: '#FFDD00', icon: '⚫', category: 'video' as const, logoUrl: 'https://logo.clearbit.com/exxen.com', manageDeepLink: 'https://www.exxen.com/tr', quickCancelUrl: 'https://www.exxen.com/tr', plans: [
    { id: 'ads', name: 'Exxen Reklamlı', price: 160.90, billingCycle: 'monthly' },
    { id: 'noad', name: 'Exxen Reklamsız', price: 223.90, billingCycle: 'monthly' },
    { id: 'spor-ads', name: 'ExxenSpor Reklamlı', price: 327.90, billingCycle: 'monthly' },
    { id: 'spor-noad', name: 'ExxenSpor Reklamsız', price: 390.90, billingCycle: 'monthly' },
  ] },
  { name: 'Gain', color: '#5CFF7A', icon: '▶️', category: 'video' as const, logoUrl: 'https://logo.clearbit.com/gain.tv', manageDeepLink: 'https://www.gain.tv', quickCancelUrl: 'https://www.gain.tv', plans: [{ id: 'monthly', name: 'Premium', price: 249.00, billingCycle: 'monthly' }] },
  { name: 'Tod', color: '#5B4BFF', icon: '🟣', category: 'video' as const, logoUrl: 'https://logo.clearbit.com/todtv.com.tr', manageDeepLink: 'https://www.todtv.com.tr', quickCancelUrl: 'https://www.todtv.com.tr', plans: [
    { id: 'entertainment', name: 'Eğlence', price: 299, billingCycle: 'monthly' },
    { id: 'entertainment-plus', name: 'Eğlence+', price: 349, billingCycle: 'monthly' },
    { id: 'sports-s', name: 'Sporun Yıldızı S', price: 449, billingCycle: 'monthly' },
    { id: 'sports-m', name: 'Sporun Yıldızı M', price: 549, billingCycle: 'monthly' },
    { id: 'sports-l', name: 'Sporun Yıldızı L', price: 669, billingCycle: 'monthly' },
  ] },
  { name: 'Microsoft 365', color: '#D83B01', icon: '💼', category: 'productivity' as const, logoUrl: 'https://logo.clearbit.com/microsoft.com', manageDeepLink: 'https://account.microsoft.com/services', quickCancelUrl: 'https://account.microsoft.com/services', plans: [
    { id: 'personal-monthly', name: 'Bireysel Aylık', price: 329.99, billingCycle: 'monthly' },
    { id: 'personal-yearly', name: 'Bireysel Yıllık', price: 3299.99, billingCycle: 'yearly' },
    { id: 'family-monthly', name: 'Aile Aylık', price: 409.99, billingCycle: 'monthly' },
    { id: 'family-yearly', name: 'Aile Yıllık', price: 4099.99, billingCycle: 'yearly' },
  ] },
  { name: 'Adobe Creative Cloud', color: '#FF0000', icon: '🎨', category: 'productivity' as const, logoUrl: 'https://logo.clearbit.com/adobe.com', manageDeepLink: 'https://account.adobe.com/plans', quickCancelUrl: 'https://account.adobe.com/plans', plans: [
    { id: 'all-apps', name: 'Tüm Uygulamalar', price: 1627.20, billingCycle: 'monthly' },
    { id: 'single-app', name: 'Tek Uygulama', price: 549.60, billingCycle: 'monthly' },
  ] },
  { name: 'PlayStation Plus', color: '#003087', icon: '🎮', category: 'gaming' as const, logoUrl: 'https://logo.clearbit.com/playstation.com', manageDeepLink: 'https://www.playstation.com/account/subscriptions/', quickCancelUrl: 'https://www.playstation.com/account/subscriptions/', plans: [
    { id: 'essential-monthly', name: 'Essential Aylık', price: 400, billingCycle: 'monthly' },
    { id: 'essential-yearly', name: 'Essential Yıllık', price: 2890, billingCycle: 'yearly' },
    { id: 'extra-monthly', name: 'Extra Aylık', price: 600, billingCycle: 'monthly' },
    { id: 'extra-3month', name: 'Extra 3 Aylık', price: 1660, billingCycle: 'monthly' },
    { id: 'extra-yearly', name: 'Extra Yıllık', price: 4810, billingCycle: 'yearly' },
    { id: 'deluxe-monthly', name: 'Deluxe Aylık', price: 710, billingCycle: 'monthly' },
    { id: 'deluxe-3month', name: 'Deluxe 3 Aylık', price: 1960, billingCycle: 'monthly' },
    { id: 'deluxe-yearly', name: 'Deluxe Yıllık', price: 5560, billingCycle: 'yearly' },
  ] },
  { name: 'Xbox Game Pass', color: '#107C10', icon: '🕹️', category: 'gaming' as const, logoUrl: 'https://logo.clearbit.com/xbox.com', manageDeepLink: 'https://account.microsoft.com/services', quickCancelUrl: 'https://account.microsoft.com/services', plans: [
    { id: 'essential', name: 'Essential', price: 269, billingCycle: 'monthly' },
    { id: 'pc', name: 'PC Game Pass', price: 419, billingCycle: 'monthly' },
    { id: 'premium', name: 'Game Pass Premium', price: 409, billingCycle: 'monthly' },
    { id: 'ultimate', name: 'Game Pass Ultimate', price: 529, billingCycle: 'monthly' },
  ] },
  {
    name: 'Apple One',
    color: '#555555',
    icon: '🍎',
    category: 'storage' as const,
    logoUrl: 'https://logo.clearbit.com/apple.com',
    manageDeepLink: 'itms-apps://apps.apple.com/account/subscriptions',
    quickCancelUrl: 'https://apps.apple.com/account/subscriptions',
    plans: [
      { id: 'individual', name: 'Individual', price: 199.99, billingCycle: 'monthly' },
      { id: 'family', name: 'Family', price: 259.99, billingCycle: 'monthly' },
    ],
  },
  {
    name: 'iCloud+',
    color: '#3478F6',
    icon: '☁️',
    category: 'storage' as const,
    logoUrl: 'https://logo.clearbit.com/icloud.com',
    manageDeepLink: 'itms-apps://apps.apple.com/account/subscriptions',
    quickCancelUrl: 'https://apps.apple.com/account/subscriptions',
    plans: [
      { id: '50gb', name: '50 GB', price: 39.99, billingCycle: 'monthly' },
      { id: '200gb', name: '200 GB', price: 129.99, billingCycle: 'monthly' },
      { id: '2tb', name: '2 TB', price: 399.99, billingCycle: 'monthly' },
      { id: '6tb', name: '6 TB', price: 1299.99, billingCycle: 'monthly' },
      { id: '12tb', name: '12 TB', price: 2499.99, billingCycle: 'monthly' },
    ],
  },
  { name: 'Canva', color: '#00C4CC', icon: '🖌️', category: 'productivity' as const, logoUrl: 'https://logo.clearbit.com/canva.com', manageDeepLink: 'https://www.canva.com/settings/billing-and-plans', quickCancelUrl: 'https://www.canva.com/settings/billing-and-plans', plans: [
    { id: 'pro-monthly', name: 'Pro Aylık', price: 240, billingCycle: 'monthly' },
    { id: 'pro-yearly', name: 'Pro Yıllık', price: 1920, billingCycle: 'yearly' },
    { id: 'business-monthly', name: 'Business Aylık', price: 340, billingCycle: 'monthly' },
    { id: 'business-yearly', name: 'Business Yıllık', price: 3400, billingCycle: 'yearly' },
  ] },
  { name: 'Duolingo Plus', color: '#58CC02', icon: '🦉', category: 'education' as const, logoUrl: 'https://logo.clearbit.com/duolingo.com', manageDeepLink: 'https://www.duolingo.com/settings/account', quickCancelUrl: 'https://www.duolingo.com/settings/subscription', plans: [{ id: 'super', name: 'Super', price: 129.99, billingCycle: 'monthly' }] },
  { name: 'HBO Max', color: '#5822B4', icon: '🎭', category: 'video' as const, logoUrl: 'https://logo.clearbit.com/max.com', manageDeepLink: 'https://www.max.com/account', quickCancelUrl: 'https://www.max.com/account/subscription', plans: [{ id: 'standard', name: 'Standard', price: 159.99, billingCycle: 'monthly' }] },
  { name: 'CapCut', color: '#000000', icon: '◈', category: 'productivity' as const, logoUrl: 'https://logo.clearbit.com/capcut.com', manageDeepLink: 'https://www.capcut.com', quickCancelUrl: 'https://www.capcut.com', plans: [
    { id: 'mobile-monthly', name: 'Mobil Pro Aylık', price: 289.99, billingCycle: 'monthly' },
    { id: 'mobile-yearly', name: 'Mobil Pro Yıllık', price: 2299.99, billingCycle: 'yearly' },
    { id: 'desktop-monthly', name: 'Masaüstü Pro Aylık', price: 249.00, billingCycle: 'monthly' },
    { id: 'desktop-yearly', name: 'Masaüstü Pro Yıllık', price: 1919.00, billingCycle: 'yearly' },
  ] },
  { name: 'Gemini', color: '#4285F4', icon: '◈', category: 'productivity' as const, logoUrl: 'https://logo.clearbit.com/gemini.google.com', manageDeepLink: 'https://one.google.com', quickCancelUrl: 'https://one.google.com', plans: [
    { id: 'ai-plus', name: 'Google AI Plus', price: 199.99, billingCycle: 'monthly' },
    { id: 'ai-pro', name: 'Google AI Pro', price: 719.99, billingCycle: 'monthly' },
    { id: 'ai-ultra-5x', name: 'Google AI Ultra (5x)', price: 1479.99, billingCycle: 'monthly' },
    { id: 'ai-ultra-20x', name: 'Google AI Ultra (20x)', price: 8999.99, billingCycle: 'monthly' },
  ] },
  { name: 'ChatGPT Plus', color: '#10A37F', icon: '🤖', category: 'productivity' as const, logoUrl: 'https://logo.clearbit.com/openai.com', manageDeepLink: 'https://chatgpt.com/#settings', quickCancelUrl: 'https://chatgpt.com/#settings', plans: [{ id: 'plus', name: 'Plus', price: 799, billingCycle: 'monthly' }] },
  { name: 'LinkedIn Premium', color: '#0A66C2', icon: '💼', category: 'productivity' as const, logoUrl: 'https://logo.clearbit.com/linkedin.com', manageDeepLink: 'https://www.linkedin.com/premium/products/', quickCancelUrl: 'https://www.linkedin.com/mypremium/cancel/', plans: [
    { id: 'career', name: 'Career', price: 1200, billingCycle: 'monthly' },
    { id: 'business', name: 'Business', price: 2400, billingCycle: 'monthly' },
  ] },
  { name: 'Dropbox', color: '#0061FF', icon: '📁', category: 'storage' as const, logoUrl: 'https://logo.clearbit.com/dropbox.com', manageDeepLink: 'https://www.dropbox.com/account/plan', quickCancelUrl: 'https://www.dropbox.com/account/billing', plans: [
    { id: 'plus-monthly', name: 'Plus Aylık', price: 79.99, billingCycle: 'monthly' },
    { id: 'plus-yearly', name: 'Plus Yıllık', price: 799.99, billingCycle: 'yearly' },
  ] },
  // { name: 'Hulu', color: '#1CE783', icon: '📺', logoUrl: 'https://logo.clearbit.com/hulu.com', manageDeepLink: 'https://secure.hulu.com/account', quickCancelUrl: 'https://secure.hulu.com/account/cancel' },
  { name: 'X (Twitter)', color: '#000000', icon: '🐦', category: 'social' as const, logoUrl: 'https://logo.clearbit.com/x.com', manageDeepLink: 'https://x.com/settings/premium', quickCancelUrl: 'https://x.com/settings/subscription' },
  { name: 'Zoom', color: '#2D8CFF', icon: '📹', category: 'social' as const, logoUrl: 'https://logo.clearbit.com/zoom.us', manageDeepLink: 'https://zoom.us/billing', quickCancelUrl: 'https://zoom.us/billing', plans: [{ id: 'pro', name: 'Pro', price: 419.99, billingCycle: 'monthly' }] },
  { name: 'Instagram', color: '#E1306C', icon: '📸', category: 'social' as const, logoUrl: 'https://logo.clearbit.com/instagram.com', manageDeepLink: 'https://www.instagram.com/accounts/manage_access/', quickCancelUrl: 'https://www.instagram.com/accounts/manage_access/', plans: [
    { id: 'web', name: 'Web', price: 249.99, billingCycle: 'monthly' },
    { id: 'android', name: 'Android', price: 259.99, billingCycle: 'monthly' },
    { id: 'ios', name: 'iOS', price: 279.99, billingCycle: 'monthly' },
  ] },
  { name: 'MUBI', color: '#001F3F', icon: '◈', category: 'video' as const, logoUrl: 'https://logo.clearbit.com/mubi.com', manageDeepLink: 'https://mubi.com/account', quickCancelUrl: 'https://mubi.com/account', plans: [{ id: 'monthly', name: 'MUBI Aylık', price: 229, billingCycle: 'monthly' }, { id: 'yearly', name: 'MUBI Yıllık', price: 1980, billingCycle: 'yearly' }] },
  { name: 'Tabii', color: '#1A1A2E', icon: '◈', category: 'video' as const, logoUrl: 'https://logo.clearbit.com/tabii.com', manageDeepLink: 'https://tabii.com/hesap', quickCancelUrl: 'https://tabii.com/hesap', plans: [{ id: 'monthly', name: 'Tabii', price: 99, billingCycle: 'monthly' }] },
];

export const SERVICE_PRESETS = applyPricingOverrides(BASE_PRESETS);

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: 'Haftalık',
  monthly: 'Aylık',
  yearly: 'Yıllık',
};
