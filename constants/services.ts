import pricingTr from '../data/pricing-tr.json';

export type BillingCycle = 'monthly' | 'yearly' | 'weekly';

export interface ServicePlanTemplate {
  id: string;
  name: string;
  price: number;
  billingCycle: BillingCycle;
}

export interface ServicePreset {
  name: string;
  color: string;
  icon: string;
  logoUrl?: string;
  manageDeepLink?: string;
  quickCancelUrl?: string;
  plans?: ServicePlanTemplate[];
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
    logoUrl: 'https://logo.clearbit.com/primevideo.com',
    manageDeepLink: 'https://www.amazon.com/yourmembershipsandsubscriptions',
    quickCancelUrl: 'https://www.amazon.com/amazonprime',
    plans: [
      { id: 'monthly', name: 'Prime', price: 39.0, billingCycle: 'monthly' },
      { id: 'yearly', name: 'Prime Yillik', price: 390.0, billingCycle: 'yearly' },
    ],
  },
  {
    name: 'YouTube Premium',
    color: '#FF0000',
    icon: '▶️',
    logoUrl: 'https://logo.clearbit.com/youtube.com',
    manageDeepLink: 'https://www.youtube.com/account_paid_memberships',
    quickCancelUrl: 'https://www.youtube.com/paid_memberships',
    plans: [
      { id: 'individual', name: 'Individual', price: 49.99, billingCycle: 'monthly' },
      { id: 'family', name: 'Family', price: 159.99, billingCycle: 'monthly' },
      { id: 'student', name: 'Student', price: 52.99, billingCycle: 'monthly' },
      { id: 'individual-yearly', name: 'Individual Yearly', price: 799.99, billingCycle: 'yearly' },
    ],
  },
  {
    name: 'Disney+',
    color: '#113CCF',
    icon: '✨',
    logoUrl: 'https://logo.clearbit.com/disneyplus.com',
    manageDeepLink: 'https://www.disneyplus.com/account',
    quickCancelUrl: 'https://www.disneyplus.com/account/subscription',
    plans: [
      { id: 'monthly', name: 'Monthly', price: 134.99, billingCycle: 'monthly' },
      { id: 'yearly', name: 'Yearly', price: 1349.99, billingCycle: 'yearly' },
    ],
  },
  { name: 'Puhu', color: '#FFD400', icon: '📺', logoUrl: 'https://logo.clearbit.com/puhutv.com', manageDeepLink: 'https://puhutv.com', quickCancelUrl: 'https://puhutv.com' },
  { name: 'Exxen', color: '#FFDD00', icon: '⚫', logoUrl: 'https://logo.clearbit.com/exxen.com', manageDeepLink: 'https://www.exxen.com/tr', quickCancelUrl: 'https://www.exxen.com/tr' },
  { name: 'Gain', color: '#5CFF7A', icon: '▶️', logoUrl: 'https://logo.clearbit.com/gain.tv', manageDeepLink: 'https://www.gain.tv', quickCancelUrl: 'https://www.gain.tv' },
  { name: 'Tod', color: '#5B4BFF', icon: '🟣', logoUrl: 'https://logo.clearbit.com/todtv.com.tr', manageDeepLink: 'https://www.todtv.com.tr', quickCancelUrl: 'https://www.todtv.com.tr' },
  { name: 'Microsoft 365', color: '#D83B01', icon: '💼', logoUrl: 'https://logo.clearbit.com/microsoft.com', manageDeepLink: 'https://account.microsoft.com/services', quickCancelUrl: 'https://account.microsoft.com/services' },
  { name: 'Adobe Creative Cloud', color: '#FF0000', icon: '🎨', logoUrl: 'https://logo.clearbit.com/adobe.com', manageDeepLink: 'https://account.adobe.com/plans', quickCancelUrl: 'https://account.adobe.com/plans' },
  { name: 'PlayStation Plus', color: '#003087', icon: '🎮', logoUrl: 'https://logo.clearbit.com/playstation.com', manageDeepLink: 'https://www.playstation.com/account/subscriptions/', quickCancelUrl: 'https://www.playstation.com/account/subscriptions/' },
  { name: 'Xbox Game Pass', color: '#107C10', icon: '🕹️', logoUrl: 'https://logo.clearbit.com/xbox.com', manageDeepLink: 'https://account.microsoft.com/services', quickCancelUrl: 'https://account.microsoft.com/services', plans: [{ id: 'ultimate', name: 'Ultimate', price: 209.0, billingCycle: 'monthly' }] },
  {
    name: 'Apple One',
    color: '#555555',
    icon: '🍎',
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
    logoUrl: 'https://logo.clearbit.com/icloud.com',
    manageDeepLink: 'itms-apps://apps.apple.com/account/subscriptions',
    quickCancelUrl: 'https://apps.apple.com/account/subscriptions',
    plans: [
      { id: '50gb', name: '50 GB', price: 19.99, billingCycle: 'monthly' },
      { id: '200gb', name: '200 GB', price: 59.99, billingCycle: 'monthly' },
      { id: '2tb', name: '2 TB', price: 199.99, billingCycle: 'monthly' },
    ],
  },
  { name: 'Canva', color: '#00C4CC', icon: '🖌️', logoUrl: 'https://logo.clearbit.com/canva.com', manageDeepLink: 'https://www.canva.com/settings/billing-and-plans', quickCancelUrl: 'https://www.canva.com/settings/billing-and-plans', plans: [{ id: 'pro', name: 'Pro', price: 199.99, billingCycle: 'monthly' }] },
  { name: 'Duolingo Plus', color: '#58CC02', icon: '🦉', logoUrl: 'https://logo.clearbit.com/duolingo.com', manageDeepLink: 'https://www.duolingo.com/settings/account', quickCancelUrl: 'https://www.duolingo.com/settings/subscription', plans: [{ id: 'super', name: 'Super', price: 129.99, billingCycle: 'monthly' }] },
  { name: 'HBO Max', color: '#5822B4', icon: '🎭', logoUrl: 'https://logo.clearbit.com/max.com', manageDeepLink: 'https://www.max.com/account', quickCancelUrl: 'https://www.max.com/account/subscription', plans: [{ id: 'standard', name: 'Standard', price: 159.99, billingCycle: 'monthly' }] },
  { name: 'ChatGPT Plus', color: '#10A37F', icon: '🤖', logoUrl: 'https://logo.clearbit.com/openai.com', manageDeepLink: 'https://chatgpt.com/#settings', quickCancelUrl: 'https://chatgpt.com/#settings', plans: [{ id: 'plus', name: 'Plus', price: 749.0, billingCycle: 'monthly' }] },
  { name: 'LinkedIn Premium', color: '#0A66C2', icon: '💼', logoUrl: 'https://logo.clearbit.com/linkedin.com', manageDeepLink: 'https://www.linkedin.com/premium/products/', quickCancelUrl: 'https://www.linkedin.com/mypremium/cancel/' },
  { name: 'Dropbox', color: '#0061FF', icon: '📁', logoUrl: 'https://logo.clearbit.com/dropbox.com', manageDeepLink: 'https://www.dropbox.com/account/plan', quickCancelUrl: 'https://www.dropbox.com/account/billing', plans: [{ id: 'plus', name: 'Plus', price: 299.99, billingCycle: 'monthly' }] },
  { name: 'Hulu', color: '#1CE783', icon: '📺', logoUrl: 'https://logo.clearbit.com/hulu.com', manageDeepLink: 'https://secure.hulu.com/account', quickCancelUrl: 'https://secure.hulu.com/account/cancel' },
  { name: 'X (Twitter)', color: '#000000', icon: '🐦', logoUrl: 'https://logo.clearbit.com/x.com', manageDeepLink: 'https://x.com/settings/premium', quickCancelUrl: 'https://x.com/settings/subscription' },
  { name: 'Zoom', color: '#2D8CFF', icon: '📹', logoUrl: 'https://logo.clearbit.com/zoom.us', manageDeepLink: 'https://zoom.us/billing', quickCancelUrl: 'https://zoom.us/billing', plans: [{ id: 'pro', name: 'Pro', price: 419.99, billingCycle: 'monthly' }] },
  { name: 'MUBI', color: '#001F3F', icon: '◈', logoUrl: 'https://logo.clearbit.com/mubi.com', manageDeepLink: 'https://mubi.com/account', quickCancelUrl: 'https://mubi.com/account', plans: [{ id: 'monthly', name: 'MUBI', price: 139.99, billingCycle: 'monthly' }] },
  { name: 'Tabii', color: '#1A1A2E', icon: '◈', logoUrl: 'https://logo.clearbit.com/tabii.com', manageDeepLink: 'https://tabii.com/hesap', quickCancelUrl: 'https://tabii.com/hesap', plans: [{ id: 'monthly', name: 'Tabii', price: 99.99, billingCycle: 'monthly' }] },
  { name: 'Diğer', color: '#6C6C6C', icon: '◈' },
];

export const SERVICE_PRESETS = applyPricingOverrides(BASE_PRESETS);

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: 'Haftalık',
  monthly: 'Aylık',
  yearly: 'Yıllık',
};
