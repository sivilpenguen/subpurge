/**
 * Strings added for the Capacitor rewrite. Previously several of these were
 * hard-coded in Turkish inside components (onboarding, coach marks, service
 * categories, backup errors). Merged on top of TRANSLATIONS by the store.
 */
import type { Locale } from './i18n';
import type { ServiceCategory } from './services';

export interface ExtraTranslations {
  obSlides: { title: string; body: string }[];
  obContinue: string;
  obStart: string;
  obDemo: string;
  coachSteps: { title: string; body: string }[];
  coachNext: string;
  coachDone: string;
  coachSkip: string;
  categories: Record<Exclude<ServiceCategory, 'other'>, string>;
  addCustomService: (name: string) => string;
  backupUnsupported: string;
  backupInvalidJson: string;
  backupInvalidFormat: string;
  currencySymbolNote: string;
  appearance: string;
  themeDark: string;
  themeLight: string;
  perYearLabel: string;
  nextUp: string;
  nothingScheduled: string;
  purgeSavings: (amount: string) => string;
  purgeIntro: string;
  attentionCount: (count: number) => string;
  version: string;
  undo: string;
  moreDetails: string;
  reviewDue: string;
  cycleShort: { weekly: string; monthly: string; yearly: string };
  toastTerminated: (name: string) => string;
  toastDeleted: (name: string) => string;
  toastUsed: (name: string) => string;
  toastReactivated: (name: string) => string;
}

const tr: ExtraTranslations = {
  obSlides: [
    { title: 'Her aboneliğin tek bir fişte', body: 'Yenileme tarihlerini, tutarları ve döngüleri tek yerde gör.' },
    { title: 'Kullanmadığını yakala', body: 'Purge Mode, boşta kalan, zamlanan ve gözden geçirme zamanı gelen abonelikleri öne çıkarır.' },
    { title: 'Kes, kurtar', body: 'Aylık harcamanı net gör, gereksizleri tek dokunuşla iptal sayfasına götür.' },
  ],
  obContinue: 'Devam',
  obStart: 'Başla',
  obDemo: 'Demo verisiyle dene',
  coachSteps: [
    { title: 'Abonelik ekle', body: 'İlk aboneliğini eklemek için buraya dokun.' },
    { title: 'Kaydır', body: 'Sola kaydır: sonlandır. Sağa kaydır: son 7 günde kullandım. ⋯ menüsünde daha fazlası var.' },
    { title: 'Kes', body: 'Kullanmadığın, zamlanmış ya da gözden geçirme zamanı gelen abonelikler burada toplanır.' },
  ],
  coachNext: 'Sonraki',
  coachDone: 'Anladım',
  coachSkip: 'Geç',
  categories: {
    video: 'Dizi, Film & Canlı TV',
    music: 'Müzik & Video',
    gaming: 'Oyun',
    productivity: 'İş, Tasarım & Yapay Zeka',
    storage: 'Depolama & Ekosistem',
    education: 'Dil Öğrenimi',
    social: 'Sosyal Medya',
  },
  addCustomService: name => `"${name}" ekle`,
  backupUnsupported: 'Bu cihazda dosya paylaşımı desteklenmiyor.',
  backupInvalidJson: 'Dosya JSON formatında değil.',
  backupInvalidFormat: 'Geçersiz Subpurge yedek formatı.',
  currencySymbolNote: 'Yeni eklenen aboneliklerin para birimi. Toplamlar güncel kurla bu birime çevrilir.',
  appearance: 'Görünüm',
  themeDark: 'Koyu',
  themeLight: 'Açık',
  perYearLabel: 'yılda',
  nextUp: 'Sıradaki ödeme',
  nothingScheduled: 'Planlanmış ödeme yok',
  purgeSavings: amount => `Bunların hepsini kesersen yılda ${amount} cebinde kalır.`,
  purgeIntro: 'Kullanmadığın, zamlanan ve gözden geçirme zamanı gelen abonelikler.',
  attentionCount: count => `${count} dikkat`,
  version: 'Sürüm',
  undo: 'Geri al',
  toastTerminated: name => `${name} sonlandırıldı`,
  toastDeleted: name => `${name} silindi`,
  toastUsed: name => `${name}: kullanıldı`,
  toastReactivated: name => `${name} yeniden aktif`,
  moreDetails: 'Daha fazla ayrıntı',
  cycleShort: { weekly: '/hf', monthly: '/ay', yearly: '/yıl' },
  reviewDue: 'Gözden geçirme zamanı',
};

const en: ExtraTranslations = {
  obSlides: [
    { title: 'Every subscription on one receipt', body: 'See renewal dates, amounts and billing cycles in one place.' },
    { title: 'Catch what you don’t use', body: 'Purge Mode surfaces idle, price-raised and due-for-review subscriptions.' },
    { title: 'Cut and keep the change', body: 'See your monthly spend clearly and jump straight to the cancel page.' },
  ],
  obContinue: 'Continue',
  obStart: 'Get started',
  obDemo: 'Try with demo data',
  coachSteps: [
    { title: 'Add a subscription', body: 'Tap here to add your first subscription.' },
    { title: 'Swipe', body: 'Swipe left to terminate. Swipe right to mark as used in the last 7 days. The ⋯ menu has more.' },
    { title: 'Cut', body: 'Idle, price-raised and due-for-review subscriptions are collected here.' },
  ],
  coachNext: 'Next',
  coachDone: 'Got it',
  coachSkip: 'Skip',
  categories: {
    video: 'TV, Film & Live',
    music: 'Music & Video',
    gaming: 'Gaming',
    productivity: 'Work, Design & AI',
    storage: 'Storage & Ecosystem',
    education: 'Language Learning',
    social: 'Social Media',
  },
  addCustomService: name => `Add "${name}"`,
  backupUnsupported: 'File sharing is not supported on this device.',
  backupInvalidJson: 'The file is not valid JSON.',
  backupInvalidFormat: 'Not a valid Subpurge backup.',
  currencySymbolNote: 'Currency for new subscriptions. Totals are converted to it at current rates.',
  appearance: 'Appearance',
  themeDark: 'Dark',
  themeLight: 'Light',
  perYearLabel: 'per year',
  nextUp: 'Next payment',
  nothingScheduled: 'No payments scheduled',
  purgeSavings: amount => `Cut all of these and keep ${amount} a year.`,
  purgeIntro: 'Idle, price-raised and due-for-review subscriptions.',
  attentionCount: count => `${count} need attention`,
  version: 'Version',
  undo: 'Undo',
  toastTerminated: name => `${name} terminated`,
  toastDeleted: name => `${name} deleted`,
  toastUsed: name => `${name}: marked as used`,
  toastReactivated: name => `${name} reactivated`,
  moreDetails: 'More details',
  cycleShort: { weekly: '/wk', monthly: '/mo', yearly: '/yr' },
  reviewDue: 'Due for review',
};

const es: ExtraTranslations = {
  obSlides: [
    { title: 'Todas tus suscripciones en un recibo', body: 'Fechas de renovación, importes y ciclos en un solo lugar.' },
    { title: 'Detecta lo que no usas', body: 'Purge Mode destaca suscripciones inactivas, con subida de precio o pendientes de revisión.' },
    { title: 'Corta y ahorra', body: 'Ve tu gasto mensual con claridad y ve directo a la página de cancelación.' },
  ],
  obContinue: 'Continuar',
  obStart: 'Empezar',
  obDemo: 'Probar con datos demo',
  coachSteps: [
    { title: 'Añade una suscripción', body: 'Toca aquí para añadir tu primera suscripción.' },
    { title: 'Desliza', body: 'Desliza a la izquierda para cancelar. A la derecha para marcar como usada en los últimos 7 días. El menú ⋯ tiene más.' },
    { title: 'Cortar', body: 'Aquí se reúnen las suscripciones inactivas, encarecidas o pendientes de revisión.' },
  ],
  coachNext: 'Siguiente',
  coachDone: 'Entendido',
  coachSkip: 'Omitir',
  categories: {
    video: 'Series, cine y TV',
    music: 'Música y vídeo',
    gaming: 'Juegos',
    productivity: 'Trabajo, diseño e IA',
    storage: 'Almacenamiento y ecosistema',
    education: 'Idiomas',
    social: 'Redes sociales',
  },
  addCustomService: name => `Añadir "${name}"`,
  backupUnsupported: 'Este dispositivo no permite compartir archivos.',
  backupInvalidJson: 'El archivo no es JSON válido.',
  backupInvalidFormat: 'No es una copia de Subpurge válida.',
  currencySymbolNote: 'Moneda de las nuevas suscripciones. Los totales se convierten al tipo actual.',
  appearance: 'Apariencia',
  themeDark: 'Oscuro',
  themeLight: 'Claro',
  perYearLabel: 'al año',
  nextUp: 'Próximo pago',
  nothingScheduled: 'No hay pagos programados',
  purgeSavings: amount => `Si cancelas todas, ahorras ${amount} al año.`,
  purgeIntro: 'Suscripciones inactivas, encarecidas o pendientes de revisión.',
  attentionCount: count => `${count} requieren atención`,
  version: 'Versión',
  undo: 'Deshacer',
  toastTerminated: name => `${name} cancelada`,
  toastDeleted: name => `${name} eliminada`,
  toastUsed: name => `${name}: marcada como usada`,
  toastReactivated: name => `${name} reactivada`,
  moreDetails: 'Más detalles',
  cycleShort: { weekly: '/sem', monthly: '/mes', yearly: '/año' },
  reviewDue: 'Toca revisar',
};

const de: ExtraTranslations = {
  obSlides: [
    { title: 'Alle Abos auf einem Beleg', body: 'Verlängerungen, Beträge und Zyklen an einem Ort.' },
    { title: 'Finde, was du nicht nutzt', body: 'Purge Mode zeigt ungenutzte, teurer gewordene und fällige Abos.' },
    { title: 'Kündigen und sparen', body: 'Sieh deine Monatsausgaben klar und spring direkt zur Kündigungsseite.' },
  ],
  obContinue: 'Weiter',
  obStart: 'Los geht’s',
  obDemo: 'Mit Demodaten testen',
  coachSteps: [
    { title: 'Abo hinzufügen', body: 'Tippe hier, um dein erstes Abo hinzuzufügen.' },
    { title: 'Wischen', body: 'Nach links: beenden. Nach rechts: in den letzten 7 Tagen genutzt. Im ⋯-Menü gibt es mehr.' },
    { title: 'Kündigen', body: 'Hier landen ungenutzte, teurer gewordene und fällige Abos.' },
  ],
  coachNext: 'Weiter',
  coachDone: 'Verstanden',
  coachSkip: 'Überspringen',
  categories: {
    video: 'Serien, Filme & TV',
    music: 'Musik & Video',
    gaming: 'Gaming',
    productivity: 'Arbeit, Design & KI',
    storage: 'Speicher & Ökosystem',
    education: 'Sprachen lernen',
    social: 'Soziale Medien',
  },
  addCustomService: name => `„${name}“ hinzufügen`,
  backupUnsupported: 'Dateifreigabe wird auf diesem Gerät nicht unterstützt.',
  backupInvalidJson: 'Die Datei ist kein gültiges JSON.',
  backupInvalidFormat: 'Keine gültige Subpurge-Sicherung.',
  currencySymbolNote: 'Währung für neue Abos. Summen werden zum aktuellen Kurs umgerechnet.',
  appearance: 'Darstellung',
  themeDark: 'Dunkel',
  themeLight: 'Hell',
  perYearLabel: 'pro Jahr',
  nextUp: 'Nächste Zahlung',
  nothingScheduled: 'Keine Zahlungen geplant',
  purgeSavings: amount => `Kündigst du alle, sparst du ${amount} im Jahr.`,
  purgeIntro: 'Ungenutzte, teurer gewordene und fällige Abos.',
  attentionCount: count => `${count} brauchen Aufmerksamkeit`,
  version: 'Version',
  undo: 'Rückgängig',
  toastTerminated: name => `${name} beendet`,
  toastDeleted: name => `${name} gelöscht`,
  toastUsed: name => `${name}: als genutzt markiert`,
  toastReactivated: name => `${name} reaktiviert`,
  moreDetails: 'Weitere Details',
  cycleShort: { weekly: '/Wo', monthly: '/Mon', yearly: '/Jahr' },
  reviewDue: 'Überprüfung fällig',
};

const fr: ExtraTranslations = {
  obSlides: [
    { title: 'Tous tes abonnements sur un ticket', body: 'Dates de renouvellement, montants et cycles au même endroit.' },
    { title: 'Repère ce que tu n’utilises pas', body: 'Purge Mode met en avant les abonnements inactifs, augmentés ou à revoir.' },
    { title: 'Coupe et économise', body: 'Vois clairement ta dépense mensuelle et va directement à la page de résiliation.' },
  ],
  obContinue: 'Continuer',
  obStart: 'Commencer',
  obDemo: 'Essayer avec la démo',
  coachSteps: [
    { title: 'Ajouter un abonnement', body: 'Touche ici pour ajouter ton premier abonnement.' },
    { title: 'Glisse', body: 'À gauche : résilier. À droite : utilisé ces 7 derniers jours. Le menu ⋯ propose plus.' },
    { title: 'Couper', body: 'Les abonnements inactifs, augmentés ou à revoir sont réunis ici.' },
  ],
  coachNext: 'Suivant',
  coachDone: 'Compris',
  coachSkip: 'Passer',
  categories: {
    video: 'Séries, films & TV',
    music: 'Musique & vidéo',
    gaming: 'Jeux',
    productivity: 'Travail, design & IA',
    storage: 'Stockage & écosystème',
    education: 'Langues',
    social: 'Réseaux sociaux',
  },
  addCustomService: name => `Ajouter « ${name} »`,
  backupUnsupported: 'Le partage de fichiers n’est pas pris en charge sur cet appareil.',
  backupInvalidJson: 'Le fichier n’est pas un JSON valide.',
  backupInvalidFormat: 'Sauvegarde Subpurge invalide.',
  currencySymbolNote: 'Devise des nouveaux abonnements. Les totaux sont convertis au taux actuel.',
  appearance: 'Apparence',
  themeDark: 'Sombre',
  themeLight: 'Clair',
  perYearLabel: 'par an',
  nextUp: 'Prochain paiement',
  nothingScheduled: 'Aucun paiement prévu',
  purgeSavings: amount => `Coupe-les tous et garde ${amount} par an.`,
  purgeIntro: 'Abonnements inactifs, augmentés ou à revoir.',
  attentionCount: count => `${count} à surveiller`,
  version: 'Version',
  undo: 'Annuler',
  toastTerminated: name => `${name} résilié`,
  toastDeleted: name => `${name} supprimé`,
  toastUsed: name => `${name} : marqué comme utilisé`,
  toastReactivated: name => `${name} réactivé`,
  moreDetails: 'Plus de détails',
  cycleShort: { weekly: '/sem', monthly: '/mois', yearly: '/an' },
  reviewDue: 'À revoir',
};

export const EXTRA_TRANSLATIONS: Record<Locale, ExtraTranslations> = { tr, en, es, de, fr };
