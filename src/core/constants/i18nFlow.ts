/**
 * Strings for the October 2026 redesign: list/cut tabs, decision deck,
 * cancel flow, splash and Pro. Merged into `t` by the store.
 */
import type { Locale } from './i18n';
import type { BillingSource } from '../store/subscriptionTypes';

export interface FlowTranslations {
  tabList: string;
  tabCut: string;
  endedSection: (count: number) => string;
  deckQuestion: string;
  keep: string;
  cut: string;
  savedPerYear: string;
  deckEmptyTitle: string;
  deckEmptyBody: string;
  deckCount: (index: number, total: number) => string;
  reasonReview: string;
  cancelAction: string;
  whereBilled: string;
  billingLabels: Record<BillingSource, string>;
  billingSteps: Record<BillingSource, string[]>;
  openPage: string;
  changeBilling: string;
  didYouCancel: (name: string) => string;
  didYouCancelBody: string;
  yesCancelled: string;
  remindTomorrow: string;
  savedToast: (amount: string) => string;
  proTitle: string;
  proTagline: string;
  proFeatures: string[];
  proBuy: (price: string) => string;
  proRestore: string;
  proLimitTitle: (limit: number) => string;
  proLimitBody: string;
  proSaved: (amount: string) => string;
  proActive: string;
  proThanks: string;
  proUnavailable: string;
  proNothingToRestore: string;
  proExportLocked: string;
}

const tr: FlowTranslations = {
  tabList: 'Liste',
  tabCut: 'Kes',
  endedSection: n => `Sonlandırılanlar (${n})`,
  deckQuestion: 'Bunu hâlâ istiyor musun?',
  keep: 'Tut',
  cut: 'Kes',
  savedPerYear: 'Yılda kurtardığın',
  deckEmptyTitle: 'Kesilecek bir şey yok',
  deckEmptyBody: 'Kullanmadığın, zamlanan ya da gözden geçirme zamanı gelen abonelikler burada tek tek önüne gelir.',
  deckCount: (i, n) => `${i} / ${n}`,
  reasonReview: 'Gözden geçirme zamanı geldi',
  cancelAction: 'İptal et',
  whereBilled: 'Nereden ödüyorsun?',
  billingLabels: { appstore: 'App Store (Apple)', googleplay: 'Google Play', web: 'Servisin web sitesi', operator: 'Operatör ya da banka' },
  billingSteps: {
    appstore: ['Açılan Abonelikler sayfasında aboneliği seç', '"Aboneliği İptal Et"e dokun', 'Buraya geri dön'],
    googleplay: ['Play Store abonelikler sayfasında aboneliği seç', '"Aboneliği iptal et"e dokun', 'Buraya geri dön'],
    web: ['Hesap sayfasında üyelik / plan bölümünü bul', '"İptal et" adımlarını sonuna kadar tamamla', 'Buraya geri dön'],
    operator: ['Operatörünün uygulamasını ya da müşteri hizmetlerini aç', 'Ek paket / dijital servis aboneliğini kapat', 'Buraya geri dön'],
  },
  openPage: 'Sayfayı aç',
  changeBilling: 'Ödeme yerini değiştir',
  didYouCancel: name => `${name} iptal ettin mi?`,
  didYouCancelBody: 'Ödediğin dönemin sonuna kadar erişimin devam eder.',
  yesCancelled: 'Evet, iptal ettim',
  remindTomorrow: 'Yarın hatırlat',
  savedToast: amount => `Yılda ${amount} kurtardın`,
  proTitle: 'SubPurge Pro',
  proTagline: 'Sana abonelik satmıyoruz. Bir kez öde, sonsuza kadar senin.',
  proFeatures: ['Sınırsız abonelik', 'Excel ve Numbers için CSV dışa aktarma', 'Gelecekteki tüm Pro özellikleri dahil'],
  proBuy: price => `Pro'yu al · ${price}`,
  proRestore: 'Satın alımları geri yükle',
  proLimitTitle: limit => `Ücretsiz sürümde ${limit} aktif abonelik var`,
  proLimitBody: 'Daha fazlasını takip etmek için Pro\'ya geç.',
  proSaved: amount => `Şimdiye kadar yılda ${amount} kestin; Pro bunun yanında küçük kalır.`,
  proActive: 'Pro aktif',
  proThanks: 'Pro açıldı, teşekkürler!',
  proUnavailable: 'Satın alma şu an kullanılamıyor.',
  proNothingToRestore: 'Geri yüklenecek satın alma bulunamadı.',
  proExportLocked: 'CSV dışa aktarma Pro özelliği. JSON yedeği ücretsiz.',
};

const en: FlowTranslations = {
  tabList: 'List',
  tabCut: 'Cut',
  endedSection: n => `Terminated (${n})`,
  deckQuestion: 'Do you still want this?',
  keep: 'Keep',
  cut: 'Cut',
  savedPerYear: 'Saved per year',
  deckEmptyTitle: 'Nothing to cut',
  deckEmptyBody: 'Idle, price-raised and due-for-review subscriptions show up here one at a time.',
  deckCount: (i, n) => `${i} / ${n}`,
  reasonReview: 'Time to review it',
  cancelAction: 'Cancel it',
  whereBilled: 'Where do you pay?',
  billingLabels: { appstore: 'App Store (Apple)', googleplay: 'Google Play', web: 'The service’s website', operator: 'Carrier or bank' },
  billingSteps: {
    appstore: ['Pick the subscription on the Subscriptions page', 'Tap “Cancel Subscription”', 'Come back here'],
    googleplay: ['Pick the subscription in Play Store subscriptions', 'Tap “Cancel subscription”', 'Come back here'],
    web: ['Find the membership / plan section of your account', 'Finish every cancel step', 'Come back here'],
    operator: ['Open your carrier’s app or customer service', 'Turn off the add-on / digital service', 'Come back here'],
  },
  openPage: 'Open the page',
  changeBilling: 'Change where I pay',
  didYouCancel: name => `Did you cancel ${name}?`,
  didYouCancelBody: 'You keep access until the end of the period you paid for.',
  yesCancelled: 'Yes, I cancelled',
  remindTomorrow: 'Remind me tomorrow',
  savedToast: amount => `You saved ${amount} a year`,
  proTitle: 'SubPurge Pro',
  proTagline: 'We don’t sell you a subscription. Pay once, keep it forever.',
  proFeatures: ['Unlimited subscriptions', 'CSV export for Excel and Numbers', 'Every future Pro feature included'],
  proBuy: price => `Get Pro · ${price}`,
  proRestore: 'Restore purchases',
  proLimitTitle: limit => `The free version tracks ${limit} active subscriptions`,
  proLimitBody: 'Upgrade to Pro to track more.',
  proSaved: amount => `You’ve cut ${amount} a year so far; Pro costs a fraction of that.`,
  proActive: 'Pro is active',
  proThanks: 'Pro unlocked — thank you!',
  proUnavailable: 'Purchases are not available right now.',
  proNothingToRestore: 'No purchases to restore.',
  proExportLocked: 'CSV export is a Pro feature. The JSON backup is free.',
};

const es: FlowTranslations = {
  tabList: 'Lista',
  tabCut: 'Cortar',
  endedSection: n => `Canceladas (${n})`,
  deckQuestion: '¿Todavía la quieres?',
  keep: 'Mantener',
  cut: 'Cortar',
  savedPerYear: 'Ahorro al año',
  deckEmptyTitle: 'Nada que cortar',
  deckEmptyBody: 'Aquí aparecen una a una las suscripciones inactivas, encarecidas o pendientes de revisión.',
  deckCount: (i, n) => `${i} / ${n}`,
  reasonReview: 'Toca revisarla',
  cancelAction: 'Cancelar',
  whereBilled: '¿Dónde pagas?',
  billingLabels: { appstore: 'App Store (Apple)', googleplay: 'Google Play', web: 'Web del servicio', operator: 'Operador o banco' },
  billingSteps: {
    appstore: ['Elige la suscripción en la página Suscripciones', 'Toca “Cancelar suscripción”', 'Vuelve aquí'],
    googleplay: ['Elige la suscripción en Play Store', 'Toca “Cancelar suscripción”', 'Vuelve aquí'],
    web: ['Busca la sección de plan en tu cuenta', 'Completa todos los pasos de cancelación', 'Vuelve aquí'],
    operator: ['Abre la app o el servicio de tu operador', 'Desactiva el servicio digital', 'Vuelve aquí'],
  },
  openPage: 'Abrir la página',
  changeBilling: 'Cambiar dónde pago',
  didYouCancel: name => `¿Cancelaste ${name}?`,
  didYouCancelBody: 'Mantienes el acceso hasta el final del periodo pagado.',
  yesCancelled: 'Sí, la cancelé',
  remindTomorrow: 'Recuérdamelo mañana',
  savedToast: amount => `Ahorras ${amount} al año`,
  proTitle: 'SubPurge Pro',
  proTagline: 'No te vendemos una suscripción. Paga una vez, tuyo para siempre.',
  proFeatures: ['Suscripciones ilimitadas', 'Exportación CSV para Excel y Numbers', 'Todas las funciones Pro futuras'],
  proBuy: price => `Obtener Pro · ${price}`,
  proRestore: 'Restaurar compras',
  proLimitTitle: limit => `La versión gratis sigue ${limit} suscripciones activas`,
  proLimitBody: 'Pásate a Pro para seguir más.',
  proSaved: amount => `Ya has recortado ${amount} al año; Pro cuesta una fracción.`,
  proActive: 'Pro activo',
  proThanks: '¡Pro desbloqueado, gracias!',
  proUnavailable: 'Las compras no están disponibles ahora.',
  proNothingToRestore: 'No hay compras para restaurar.',
  proExportLocked: 'Exportar a CSV es una función Pro. La copia JSON es gratis.',
};

const de: FlowTranslations = {
  tabList: 'Liste',
  tabCut: 'Kündigen',
  endedSection: n => `Beendet (${n})`,
  deckQuestion: 'Willst du das noch?',
  keep: 'Behalten',
  cut: 'Kündigen',
  savedPerYear: 'Gespart pro Jahr',
  deckEmptyTitle: 'Nichts zu kündigen',
  deckEmptyBody: 'Ungenutzte, teurer gewordene und fällige Abos erscheinen hier einzeln.',
  deckCount: (i, n) => `${i} / ${n}`,
  reasonReview: 'Zeit für eine Überprüfung',
  cancelAction: 'Kündigen',
  whereBilled: 'Wo zahlst du?',
  billingLabels: { appstore: 'App Store (Apple)', googleplay: 'Google Play', web: 'Website des Dienstes', operator: 'Mobilfunkanbieter oder Bank' },
  billingSteps: {
    appstore: ['Wähle das Abo auf der Seite „Abonnements“', 'Tippe auf „Abo kündigen“', 'Komm hierher zurück'],
    googleplay: ['Wähle das Abo in den Play-Store-Abos', 'Tippe auf „Abo kündigen“', 'Komm hierher zurück'],
    web: ['Suche im Konto den Bereich Mitgliedschaft / Tarif', 'Schließe alle Kündigungsschritte ab', 'Komm hierher zurück'],
    operator: ['Öffne die App oder den Kundendienst deines Anbieters', 'Deaktiviere den Zusatzdienst', 'Komm hierher zurück'],
  },
  openPage: 'Seite öffnen',
  changeBilling: 'Zahlungsort ändern',
  didYouCancel: name => `Hast du ${name} gekündigt?`,
  didYouCancelBody: 'Du behältst den Zugang bis zum Ende des bezahlten Zeitraums.',
  yesCancelled: 'Ja, gekündigt',
  remindTomorrow: 'Morgen erinnern',
  savedToast: amount => `Du sparst ${amount} pro Jahr`,
  proTitle: 'SubPurge Pro',
  proTagline: 'Wir verkaufen dir kein Abo. Einmal zahlen, für immer behalten.',
  proFeatures: ['Unbegrenzte Abos', 'CSV-Export für Excel und Numbers', 'Alle künftigen Pro-Funktionen'],
  proBuy: price => `Pro holen · ${price}`,
  proRestore: 'Käufe wiederherstellen',
  proLimitTitle: limit => `Die Gratisversion verfolgt ${limit} aktive Abos`,
  proLimitBody: 'Mit Pro verfolgst du mehr.',
  proSaved: amount => `Du hast bisher ${amount} pro Jahr gespart; Pro kostet nur einen Bruchteil.`,
  proActive: 'Pro ist aktiv',
  proThanks: 'Pro freigeschaltet, danke!',
  proUnavailable: 'Käufe sind gerade nicht verfügbar.',
  proNothingToRestore: 'Keine Käufe zum Wiederherstellen.',
  proExportLocked: 'CSV-Export ist eine Pro-Funktion. Das JSON-Backup ist kostenlos.',
};

const fr: FlowTranslations = {
  tabList: 'Liste',
  tabCut: 'Couper',
  endedSection: n => `Résiliés (${n})`,
  deckQuestion: 'Tu le veux encore ?',
  keep: 'Garder',
  cut: 'Couper',
  savedPerYear: 'Économisé par an',
  deckEmptyTitle: 'Rien à couper',
  deckEmptyBody: 'Les abonnements inactifs, augmentés ou à revoir apparaissent ici un par un.',
  deckCount: (i, n) => `${i} / ${n}`,
  reasonReview: 'C’est le moment de le revoir',
  cancelAction: 'Résilier',
  whereBilled: 'Où paies-tu ?',
  billingLabels: { appstore: 'App Store (Apple)', googleplay: 'Google Play', web: 'Site du service', operator: 'Opérateur ou banque' },
  billingSteps: {
    appstore: ['Choisis l’abonnement dans la page Abonnements', 'Touche « Annuler l’abonnement »', 'Reviens ici'],
    googleplay: ['Choisis l’abonnement dans le Play Store', 'Touche « Résilier l’abonnement »', 'Reviens ici'],
    web: ['Trouve la section abonnement de ton compte', 'Termine toutes les étapes de résiliation', 'Reviens ici'],
    operator: ['Ouvre l’app ou le service client de ton opérateur', 'Désactive le service numérique', 'Reviens ici'],
  },
  openPage: 'Ouvrir la page',
  changeBilling: 'Changer où je paie',
  didYouCancel: name => `As-tu résilié ${name} ?`,
  didYouCancelBody: 'Tu gardes l’accès jusqu’à la fin de la période payée.',
  yesCancelled: 'Oui, c’est résilié',
  remindTomorrow: 'Me le rappeler demain',
  savedToast: amount => `Tu économises ${amount} par an`,
  proTitle: 'SubPurge Pro',
  proTagline: 'On ne te vend pas d’abonnement. Paie une fois, garde-le pour toujours.',
  proFeatures: ['Abonnements illimités', 'Export CSV pour Excel et Numbers', 'Toutes les futures fonctions Pro'],
  proBuy: price => `Obtenir Pro · ${price}`,
  proRestore: 'Restaurer les achats',
  proLimitTitle: limit => `La version gratuite suit ${limit} abonnements actifs`,
  proLimitBody: 'Passe à Pro pour en suivre plus.',
  proSaved: amount => `Tu as déjà coupé ${amount} par an ; Pro n’en coûte qu’une fraction.`,
  proActive: 'Pro est actif',
  proThanks: 'Pro débloqué, merci !',
  proUnavailable: 'Les achats ne sont pas disponibles.',
  proNothingToRestore: 'Aucun achat à restaurer.',
  proExportLocked: 'L’export CSV est une fonction Pro. La sauvegarde JSON est gratuite.',
};

export const FLOW_TRANSLATIONS: Record<Locale, FlowTranslations> = { tr, en, es, de, fr };

/** Splash line (option 2), cycled through every language on the splash. */
export const SPLASH_LINES = [
  'Kullanmadığına ödeme.',
  'Stop paying for what you don’t use.',
  'Deja de pagar lo que no usas.',
  'Zahl nicht für das, was du nicht nutzt.',
  'Ne paie plus ce que tu n’utilises pas.',
];
