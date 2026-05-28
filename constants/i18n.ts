export type Locale = 'tr' | 'en' | 'es' | 'de' | 'fr';

export interface Translations {
  // Tab labels
  tabSubscriptions: string;
  tabStats: string;
  tabSettings: string;

  // Home screen
  subscriptions: string;
  monthly: string;
  yearly: string;
  active: string;
  current: string;
  ended: string;
  noSubscriptions: string;
  noSubscriptionsHint: string;
  noEndedSubscriptions: string;
  noEndedSubscriptionsHint: string;

  // Subscription card
  perMonth: string;
  terminate: string;
  reactivate: string;
  edit: string;
  delete: string;
  cancel: string;
  ok: string;
  deleteConfirmTitle: string;
  deleteConfirmMessage: string;
  terminateConfirmMessage: (name: string) => string;
  totalSpent: string;
  completedCycles: string;

  // Add / Edit screen
  newSubscription: string;
  editSubscription: string;
  cancelBtn: string;
  selectService: string;
  pickFromPresets: string;
  subscriptionName: string;
  subscriptionNamePlaceholder: string;
  billingCycle: string;
  price: string;
  pricePlaceholder: string;
  notes: string;
  notesPlaceholder: string;
  save: string;
  saveConfirmTitle: string;
  saveConfirmMessage: string;
  saveSuccessTitle: string;
  saveSuccessMessage: string;
  deleteSubscription: string;
  errorNameRequired: string;
  errorInvalidPrice: string;
  weekly: string;
  monthly2: string;
  yearly2: string;
  trackingType: string;
  autoRenewing: string;
  fixedTerm: string;
  startDate: string;
  nextPaymentDate: string;
  endDate: string;
  dateFormatHint: string;
  errorInvalidDate: string;
  errorTrackedDateBeforeStart: string;
  today: string;
  suggestedDate: string;
  whyPaying: string;
  whyPayingPlaceholder: string;
  quickCancelUrl: string;
  quickCancelUrlPlaceholder: string;
  reviewReminderDate: string;
  remindMeIn1Month: string;
  remindMeIn3Months: string;
  errorInvalidUrl: string;
  planTemplates: string;
  customPrice: string;
  manage: string;
  cancelNow: string;
  lastUsed: string;
  usedToday: string;
  usageAlerts: string;
  noUsageAlerts: string;
  noUsageAlertsHint: string;
  unusedFor: (days: number) => string;
  priceChangeAlerts: string;
  noPriceChanges: string;
  noPriceChangesHint: string;
  priceRaised: (currencySymbol: string, oldPrice: string, newPrice: string) => string;
  updatePlan: string;
  filterAll: string;
  filterUpcoming: string;
  filterIdle: string;
  filterPrice: string;
  focusUpcoming: string;
  focusUpcomingHint: string;
  focusAttention: string;
  focusAttentionHint: string;

  // Summary screen
  back: string;
  priceSummary: string;
  monthlyTotal: string;
  daily: string;
  subscriptionCount: string;
  costBreakdown: string;
  perMonthShort: string;
  perYear: string;

  // Stats screen
  statistics: string;
  noData: string;
  noDataHint: string;
  dailyCost: string;
  monthlyCost: string;
  yearlyCost: string;
  spendingBreakdown: string;
  dashboardEyebrow: string;
  dashboardTitle: string;
  dashboardSubtitle: string;
  monthlyFocus: string;
  upcomingPayments: string;
  noUpcomingPayments: string;
  noUpcomingPaymentsHint: string;
  purgeMode: string;
  noPurgeCandidates: string;
  noPurgeCandidatesHint: string;
  openCancelGuide: string;
  cancelGuideMissing: string;
  noReasonSaved: string;
  reviewDone: string;
  reviewSnooze: string;

  // Settings screen
  settings: string;
  currency: string;
  selectCurrency: string;
  summary: string;
  totalSubscriptions: string;
  terminated: string;
  language: string;
  selectLanguage: string;
  accumulatedSpent: string;
  endedAccumulatedSpent: string;
  paidUsageSpent: string;
  thisMonthDue: string;
  endedTotalSpent: string;
  futureCommitment: string;
  notificationTests: string;
  notificationTestsHint: string;
  runNotificationTest: string;
  notificationTestScheduled: string;
  notificationPermissionDenied: string;
  loadDemoData: string;
  loadDemoDataHint: string;
  demoLoadTitle: string;
  demoLoadMessage: string;
  demoLoadedTitle: string;
  demoLoadedMessage: string;

  // Currency / reset
  currencySymbolNote: string;
  resetData: string;
  resetDataHint: string;
  resetDataTitle: string;
  resetDataMessage: string;

  // Spend trend chart
  spendTrend: string;

  // Onboarding
  onboardingTitle: string;
  onboardingSubtitle: string;
  onboardingCta: string;
  onboardingDemoBtn: string;

  // Accessibility
  editSubscriptionHint: string;

  // Monthly equivalent label
  perMonthEquiv: (amount: string) => string;
}

const tr: Translations = {
  tabSubscriptions: 'Abonelikler',
  tabStats: 'Özet',
  tabSettings: 'Ayarlar',
  subscriptions: 'Abonelikler',
  monthly: 'Aylık',
  yearly: 'Yıllık',
  active: 'Aktif',
  current: 'Mevcut',
  ended: 'Sonlandırılanlar',
  noSubscriptions: 'Henüz abonelik yok',
  noSubscriptionsHint: 'İlk aboneliğini eklemek için + butonuna dokun',
  noEndedSubscriptions: 'Sonlandırılan abonelik yok',
  noEndedSubscriptionsHint: 'Aktif abonelikleri uzun basarak sonlandırabilirsin',
  perMonth: '/ay',
  terminate: 'Sonlandır',
  reactivate: 'Yeniden Aktif Et',
  edit: 'Düzenle',
  delete: 'Sil',
  cancel: 'İptal',
  ok: 'Tamam',
  deleteConfirmTitle: 'Aboneliği Sil',
  deleteConfirmMessage: 'silinsin mi?',
  terminateConfirmMessage: (name: string) => `${name} sonlandırılsın mı?`,
  totalSpent: 'Toplam harcama',
  completedCycles: 'Tamamlanan döngü',
  newSubscription: 'Yeni Abonelik',
  editSubscription: 'Düzenle',
  cancelBtn: 'Geri',
  selectService: 'Servis seç',
  pickFromPresets: 'Hazır servislerden seç',
  subscriptionName: 'Abonelik Adı',
  subscriptionNamePlaceholder: 'örn. Kendi servisini yaz',
  billingCycle: 'Fatura Döngüsü',
  price: 'Ücret',
  pricePlaceholder: '0.00',
  notes: 'Not (isteğe bağlı)',
  notesPlaceholder: 'Hesap bilgisi, plan adı vs.',
  save: 'Kaydet',
  saveConfirmTitle: 'Değişiklikleri Kaydet',
  saveConfirmMessage: 'Bu abonelikteki değişiklikler kaydedilsin mi?',
  saveSuccessTitle: 'Kaydedildi',
  saveSuccessMessage: 'Abonelik kaydedildi.',
  deleteSubscription: 'Aboneliği Sil',
  errorNameRequired: 'Abonelik adı gerekli',
  errorInvalidPrice: 'Geçerli bir ücret gir',
  weekly: 'Haftalık',
  monthly2: 'Aylık',
  yearly2: 'Yıllık',
  trackingType: 'Takip Türü',
  autoRenewing: 'Otomatik yenilenir',
  fixedTerm: 'Sabit bitiş tarihi',
  startDate: 'Başlangıç Tarihi',
  nextPaymentDate: 'Sonraki Ödeme Tarihi',
  endDate: 'Bitiş Tarihi',
  dateFormatHint: 'YYYY-MM-DD',
  errorInvalidDate: 'alanı YYYY-MM-DD formatında olmalı',
  errorTrackedDateBeforeStart: 'Takip edilen tarih başlangıç tarihinden önce olamaz',
  today: 'Bugün',
  suggestedDate: 'Önerilen tarih',
  whyPaying: 'Neden Ödüyorum?',
  whyPayingPlaceholder: 'örn. Sadece The Bear için açık',
  quickCancelUrl: 'Hızlı İptal Linki',
  quickCancelUrlPlaceholder: 'ornek.com/cancel',
  reviewReminderDate: 'Gözden Geçirme Tarihi',
  remindMeIn1Month: '1 ay sonra',
  remindMeIn3Months: '3 ay sonra hatırlat',
  errorInvalidUrl: 'Geçerli bir bağlantı gir',
  planTemplates: 'Hazır Planlar',
  customPrice: 'Özel Fiyat',
  manage: 'Aboneliği yönet',
  cancelNow: 'Aboneliği iptal et',
  lastUsed: 'Son Kullanım',
  usedToday: '7 gün içinde kullandım',
  usageAlerts: 'Kullanım Uyarıları',
  noUsageAlerts: 'Atıl abonelik görünmüyor',
  noUsageAlertsHint: '15 gündür kullanmadığın aktif abonelikler burada listelenir.',
  unusedFor: (days: number) => `${days} gündür kullanmadın`,
  priceChangeAlerts: 'Fiyat Artışları',
  noPriceChanges: 'Şimdilik fiyat değişimi yok',
  noPriceChangesHint: 'Hazır planla eşleşen aboneliklerde zam olduğunda burada görünür.',
  priceRaised: (currencySymbol: string, oldPrice: string, newPrice: string) => `Fiyat ${currencySymbol}${oldPrice} -> ${currencySymbol}${newPrice}`,
  updatePlan: 'Planı güncelle',
  filterAll: 'Hepsi',
  filterUpcoming: 'Yaklaşan',
  filterIdle: 'Atıl',
  filterPrice: 'Zamlı',
  focusUpcoming: 'Bu hafta',
  focusUpcomingHint: '7 gün içinde yenilenecekler',
  focusAttention: 'Dikkat',
  focusAttentionHint: 'Atıl veya zamlanan abonelikler',
  back: '‹ Geri',
  priceSummary: 'Ücret Özeti',
  monthlyTotal: 'Aylık Toplam Harcama',
  daily: 'Günlük',
  subscriptionCount: 'Abonelik',
  costBreakdown: 'Abonelik Başı Maliyet',
  perMonthShort: '/ay',
  perYear: '/yıl',
  statistics: 'İstatistikler',
  noData: 'Henüz veri yok',
  noDataHint: 'Abonelik ekledikten sonra istatistikler burada görünür',
  dailyCost: 'Günlük',
  monthlyCost: 'Aylık',
  yearlyCost: 'Yıllık Toplam',
  spendingBreakdown: 'Harcama Dağılımı',
  dashboardEyebrow: 'Tek Bakışta',
  dashboardTitle: 'SubPurge Özeti',
  dashboardSubtitle: 'Yalnızca gerçekten kullandığın abonelikleri elde tut.',
  monthlyFocus: 'Bu Ay',
  upcomingPayments: 'Yaklaşan Ödemeler',
  noUpcomingPayments: 'Yaklaşan ödeme görünmüyor',
  noUpcomingPaymentsHint: 'Tarih eklediğin aktif abonelikler burada görünecek.',
  purgeMode: 'Purge Mode',
  noPurgeCandidates: 'Bugün temizlik yok',
  noPurgeCandidatesHint: 'Gözden geçirme tarihi gelen abonelikler burada iptal rehberiyle görünür.',
  openCancelGuide: 'Hızlı İptal',
  cancelGuideMissing: 'Bu abonelik için kayıtlı bir iptal rehberi yok.',
  noReasonSaved: 'Henüz neden aktif olduğunu not etmemişsin.',
  reviewDone: 'Tamamlandı (3 ay)',
  reviewSnooze: 'Ertele (1 ay)',
  settings: 'Ayarlar',
  currency: 'Para Birimi',
  selectCurrency: 'Para Birimi Seç',
  summary: 'Özet',
  totalSubscriptions: 'Toplam Abonelik',
  terminated: 'Sonlandırılan',
  language: 'Dil',
  selectLanguage: 'Dil Seç',
  accumulatedSpent: 'Aktif birikmiş harcama',
  endedAccumulatedSpent: 'Sonlandırılan harcamalar',
  paidUsageSpent: 'Ödenmiş kullanım',
  thisMonthDue: 'Bu ay ödenecek tutar',
  endedTotalSpent: 'Sonlandırılmış abonelik harcaması',
  futureCommitment: 'Gelecek ödemeler',
  notificationTests: 'Bildirim Testi',
  notificationTestsHint: 'Bu buton 5 ve 10 saniye sonra iki test bildirimi yollar. Gerçek hatırlatmalar 7 gün kullanım yoksa ve 4 gün kala otomatik planlanır.',
  runNotificationTest: 'Test bildirimi gönder',
  notificationTestScheduled: 'Test bildirimleri 5 ve 10 saniye içinde planlandı.',
  notificationPermissionDenied: 'Bildirim izni verilmedi. Test için önce izin vermen gerekiyor.',
  loadDemoData: 'Demo verisini yükle',
  loadDemoDataHint: 'Geçmiş harcama hesaplarını görmek için örnek abonelikleri tek dokunuşla yükle.',
  demoLoadTitle: 'Demo Verisi Yüklensin mi?',
  demoLoadMessage: 'Mevcut abonelikler demo verisi ile değiştirilecek.',
  demoLoadedTitle: 'Demo verisi hazır',
  demoLoadedMessage: 'Örnek abonelikler yüklendi.',
  currencySymbolNote: 'Para birimi değişimi sadece sembolü etkiler, fiyatları dönüştürmez.',
  resetData: 'Tüm Verileri Sil',
  resetDataHint: 'Uygulama kayıtlı tüm abonelikler ve ayarlar cihazdan silinir.',
  resetDataTitle: 'Tüm Veriler Silinsin mi?',
  resetDataMessage: 'Bu işlem geri alınamaz. Tüm abonelikler ve harcama geçmişi kalıcı olarak silinir.',
  spendTrend: 'Son 6 Ay',
  onboardingTitle: 'Subpurge\'e Hoş Geldin',
  onboardingSubtitle: 'Aboneliklerini takip et, gereksiz olanları keşfet ve aylık harcamanı kontrol altına al.',
  onboardingCta: 'Başla',
  onboardingDemoBtn: 'Demo verisi yükle',
  editSubscriptionHint: 'Aboneliği düzenle',
  perMonthEquiv: (amount: string) => `≈ ${amount}/ay`,
};

const en: Translations = {
  tabSubscriptions: 'Subscriptions',
  tabStats: 'Dashboard',
  tabSettings: 'Settings',
  subscriptions: 'Subscriptions',
  monthly: 'Monthly',
  yearly: 'Yearly',
  active: 'Active',
  current: 'Current',
  ended: 'Terminated',
  noSubscriptions: 'No subscriptions yet',
  noSubscriptionsHint: 'Tap + to add your first subscription',
  noEndedSubscriptions: 'No terminated subscriptions',
  noEndedSubscriptionsHint: 'Long press an active subscription to terminate it',
  perMonth: '/mo',
  terminate: 'Terminate',
  reactivate: 'Reactivate',
  edit: 'Edit',
  delete: 'Delete',
  cancel: 'Cancel',
  ok: 'OK',
  deleteConfirmTitle: 'Delete Subscription',
  deleteConfirmMessage: 'will be deleted. Are you sure?',
  terminateConfirmMessage: (name: string) => `Terminate ${name}?`,
  totalSpent: 'Total spent',
  completedCycles: 'Completed cycles',
  newSubscription: 'New Subscription',
  editSubscription: 'Edit',
  cancelBtn: 'Back',
  selectService: 'Select service',
  pickFromPresets: 'Pick from presets',
  subscriptionName: 'Subscription Name',
  subscriptionNamePlaceholder: 'e.g. My custom service',
  billingCycle: 'Billing Cycle',
  price: 'Price',
  pricePlaceholder: '0.00',
  notes: 'Notes (optional)',
  notesPlaceholder: 'Account info, plan name, etc.',
  save: 'Save',
  saveConfirmTitle: 'Save Changes',
  saveConfirmMessage: 'Do you want to save the changes to this subscription?',
  saveSuccessTitle: 'Saved',
  saveSuccessMessage: 'The subscription was saved.',
  deleteSubscription: 'Delete Subscription',
  errorNameRequired: 'Subscription name is required',
  errorInvalidPrice: 'Enter a valid price',
  weekly: 'Weekly',
  monthly2: 'Monthly',
  yearly2: 'Yearly',
  trackingType: 'Tracking Type',
  autoRenewing: 'Auto renews',
  fixedTerm: 'Fixed end date',
  startDate: 'Start Date',
  nextPaymentDate: 'Next Payment Date',
  endDate: 'End Date',
  dateFormatHint: 'YYYY-MM-DD',
  errorInvalidDate: 'must use YYYY-MM-DD format',
  errorTrackedDateBeforeStart: 'Tracked date cannot be earlier than the start date',
  today: 'Today',
  suggestedDate: 'Suggested date',
  whyPaying: 'Why am I paying?',
  whyPayingPlaceholder: 'e.g. Keeping it only for one show',
  quickCancelUrl: 'Quick cancel URL',
  quickCancelUrlPlaceholder: 'example.com/cancel',
  reviewReminderDate: 'Review reminder date',
  remindMeIn1Month: 'In 1 month',
  remindMeIn3Months: 'Remind me in 3 months',
  errorInvalidUrl: 'Enter a valid link',
  planTemplates: 'Ready plans',
  customPrice: 'Custom price',
  manage: 'Manage subscription',
  cancelNow: 'Cancel subscription',
  lastUsed: 'Last used',
  usedToday: 'Used within 7 days',
  usageAlerts: 'Usage nudges',
  noUsageAlerts: 'No idle subscriptions',
  noUsageAlertsHint: 'Active subscriptions you have not used for 15 days will appear here.',
  unusedFor: (days: number) => `Unused for ${days} days`,
  priceChangeAlerts: 'Price increases',
  noPriceChanges: 'No price changes right now',
  noPriceChangesHint: 'Matched plan templates will show increases here.',
  priceRaised: (currencySymbol: string, oldPrice: string, newPrice: string) => `Price ${currencySymbol}${oldPrice} -> ${currencySymbol}${newPrice}`,
  updatePlan: 'Update plan',
  filterAll: 'All',
  filterUpcoming: 'Upcoming',
  filterIdle: 'Idle',
  filterPrice: 'Raised',
  focusUpcoming: 'This week',
  focusUpcomingHint: 'Renewing in the next 7 days',
  focusAttention: 'Attention',
  focusAttentionHint: 'Idle or price-raised subscriptions',
  back: '‹ Back',
  priceSummary: 'Price Summary',
  monthlyTotal: 'Monthly Total',
  daily: 'Daily',
  subscriptionCount: 'Subscriptions',
  costBreakdown: 'Cost per Subscription',
  perMonthShort: '/mo',
  perYear: '/yr',
  statistics: 'Statistics',
  noData: 'No data yet',
  noDataHint: 'Add subscriptions to see statistics here',
  dailyCost: 'Daily',
  monthlyCost: 'Monthly',
  yearlyCost: 'Yearly Total',
  spendingBreakdown: 'Spending Breakdown',
  dashboardEyebrow: 'At a glance',
  dashboardTitle: 'SubPurge Dashboard',
  dashboardSubtitle: 'Keep only the subscriptions you still use.',
  monthlyFocus: 'This month',
  upcomingPayments: 'Upcoming payments',
  noUpcomingPayments: 'No upcoming payments yet',
  noUpcomingPaymentsHint: 'Active subscriptions with dates will appear here.',
  purgeMode: 'Purge Mode',
  noPurgeCandidates: 'Nothing to purge today',
  noPurgeCandidatesHint: 'Subscriptions with a due review date will show up here with a cancel guide.',
  openCancelGuide: 'Quick cancel',
  cancelGuideMissing: 'No cancel guide is saved for this subscription yet.',
  noReasonSaved: 'You have not saved a reason for keeping this active yet.',
  reviewDone: 'Done (3 mo)',
  reviewSnooze: 'Snooze (1 mo)',
  settings: 'Settings',
  currency: 'Currency',
  selectCurrency: 'Select Currency',
  summary: 'Summary',
  totalSubscriptions: 'Total Subscriptions',
  terminated: 'Terminated',
  language: 'Language',
  selectLanguage: 'Select Language',
  accumulatedSpent: 'Active accrued spend',
  endedAccumulatedSpent: 'Ended accumulated spend',
  paidUsageSpent: 'Paid usage',
  thisMonthDue: 'Due this billing period',
  endedTotalSpent: 'Ended subscription spend',
  futureCommitment: 'Future payments',
  notificationTests: 'Notification Tests',
  notificationTestsHint: 'This sends two test notifications after 5 and 10 seconds. Real reminders are scheduled automatically after 7 idle days and 4 days before renewal or end.',
  runNotificationTest: 'Send test notification',
  notificationTestScheduled: 'Test notifications were scheduled for 5 and 10 seconds later.',
  notificationPermissionDenied: 'Notification permission is missing. Allow it first to run the test.',
  loadDemoData: 'Load demo data',
  loadDemoDataHint: 'Load example subscriptions to preview historical spend calculations.',
  demoLoadTitle: 'Load Demo Data?',
  demoLoadMessage: 'Your current subscriptions will be replaced with demo data.',
  demoLoadedTitle: 'Demo ready',
  demoLoadedMessage: 'Example subscriptions have been loaded.',
  currencySymbolNote: 'Changing currency only updates the symbol, not the amounts.',
  resetData: 'Reset All Data',
  resetDataHint: 'Delete all subscriptions and settings from this device.',
  resetDataTitle: 'Reset All Data?',
  resetDataMessage: 'This cannot be undone. All subscriptions and spend history will be permanently deleted.',
  spendTrend: 'Last 6 Months',
  onboardingTitle: 'Welcome to Subpurge',
  onboardingSubtitle: 'Track your subscriptions, find the ones you can cut, and take back control of your monthly spend.',
  onboardingCta: 'Get Started',
  onboardingDemoBtn: 'Load demo data',
  editSubscriptionHint: 'Edit subscription',
  perMonthEquiv: (amount: string) => `≈ ${amount}/mo`,
};

const es: Translations = {
  tabSubscriptions: 'Suscripciones',
  tabStats: 'Dashboard',
  tabSettings: 'Ajustes',
  subscriptions: 'Suscripciones',
  monthly: 'Mensual',
  yearly: 'Anual',
  active: 'Activas',
  current: 'Actuales',
  ended: 'Canceladas',
  noSubscriptions: 'Sin suscripciones aún',
  noSubscriptionsHint: 'Toca + para añadir tu primera suscripción',
  noEndedSubscriptions: 'Sin suscripciones canceladas',
  noEndedSubscriptionsHint: 'Mantén pulsada una suscripción activa para cancelarla',
  perMonth: '/mes',
  terminate: 'Cancelar',
  reactivate: 'Reactivar',
  edit: 'Editar',
  delete: 'Eliminar',
  cancel: 'Cancelar',
  ok: 'Aceptar',
  deleteConfirmTitle: 'Eliminar suscripción',
  deleteConfirmMessage: '¿deseas eliminarlo?',
  terminateConfirmMessage: (name: string) => `¿Cancelar ${name}?`,
  totalSpent: 'Gasto total',
  completedCycles: 'Ciclos completados',
  newSubscription: 'Nueva suscripción',
  editSubscription: 'Editar',
  cancelBtn: 'Volver',
  selectService: 'Selecciona servicio',
  pickFromPresets: 'Elegir de preajustes',
  subscriptionName: 'Nombre de suscripción',
  subscriptionNamePlaceholder: 'ej. Mi servicio personalizado',
  billingCycle: 'Ciclo de facturación',
  price: 'Precio',
  pricePlaceholder: '0.00',
  notes: 'Notas (opcional)',
  notesPlaceholder: 'Info de cuenta, nombre del plan, etc.',
  save: 'Guardar',
  saveConfirmTitle: 'Guardar cambios',
  saveConfirmMessage: '¿Quieres guardar los cambios de esta suscripción?',
  saveSuccessTitle: 'Guardado',
  saveSuccessMessage: 'La suscripción se guardó.',
  deleteSubscription: 'Eliminar suscripción',
  errorNameRequired: 'El nombre es obligatorio',
  errorInvalidPrice: 'Introduce un precio válido',
  weekly: 'Semanal',
  monthly2: 'Mensual',
  yearly2: 'Anual',
  trackingType: 'Tipo de seguimiento',
  autoRenewing: 'Renovación automática',
  fixedTerm: 'Fecha fija de finalización',
  startDate: 'Fecha de inicio',
  nextPaymentDate: 'Próximo pago',
  endDate: 'Fecha de finalización',
  dateFormatHint: 'YYYY-MM-DD',
  errorInvalidDate: 'debe usar el formato YYYY-MM-DD',
  errorTrackedDateBeforeStart: 'La fecha de seguimiento no puede ser anterior al inicio',
  today: 'Hoy',
  suggestedDate: 'Fecha sugerida',
  whyPaying: 'Por que sigo pagando?',
  whyPayingPlaceholder: 'ej. Solo por una serie',
  quickCancelUrl: 'Enlace rapido de cancelacion',
  quickCancelUrlPlaceholder: 'example.com/cancel',
  reviewReminderDate: 'Fecha de revision',
  remindMeIn1Month: 'En 1 mes',
  remindMeIn3Months: 'Recordarmelo en 3 meses',
  errorInvalidUrl: 'Introduce un enlace valido',
  planTemplates: 'Planes listos',
  customPrice: 'Precio personalizado',
  manage: 'Gestionar suscripcion',
  cancelNow: 'Cancelar suscripcion',
  lastUsed: 'Ultimo uso',
  usedToday: 'La use en 7 dias',
  usageAlerts: 'Alertas de uso',
  noUsageAlerts: 'No hay suscripciones inactivas',
  noUsageAlertsHint: 'Las suscripciones activas sin uso durante 15 dias apareceran aqui.',
  unusedFor: (days: number) => `Sin usar durante ${days} dias`,
  priceChangeAlerts: 'Subidas de precio',
  noPriceChanges: 'No hay cambios de precio por ahora',
  noPriceChangesHint: 'Los planes asociados mostraran aqui las subidas.',
  priceRaised: (currencySymbol: string, oldPrice: string, newPrice: string) => `Precio ${currencySymbol}${oldPrice} -> ${currencySymbol}${newPrice}`,
  updatePlan: 'Actualizar plan',
  filterAll: 'Todo',
  filterUpcoming: 'Proximos',
  filterIdle: 'Inactivas',
  filterPrice: 'Subidas',
  focusUpcoming: 'Esta semana',
  focusUpcomingHint: 'Renovaciones dentro de 7 dias',
  focusAttention: 'Atencion',
  focusAttentionHint: 'Suscripciones inactivas o con subida',
  back: '‹ Volver',
  priceSummary: 'Resumen de precios',
  monthlyTotal: 'Total mensual',
  daily: 'Diario',
  subscriptionCount: 'Suscripciones',
  costBreakdown: 'Coste por suscripción',
  perMonthShort: '/mes',
  perYear: '/año',
  statistics: 'Estadísticas',
  noData: 'Sin datos aún',
  noDataHint: 'Añade suscripciones para ver estadísticas aquí',
  dailyCost: 'Diario',
  monthlyCost: 'Mensual',
  yearlyCost: 'Total anual',
  spendingBreakdown: 'Desglose de gastos',
  dashboardEyebrow: 'De un vistazo',
  dashboardTitle: 'Panel de SubPurge',
  dashboardSubtitle: 'Conserva solo las suscripciones que realmente usas.',
  monthlyFocus: 'Este mes',
  upcomingPayments: 'Proximos pagos',
  noUpcomingPayments: 'Aun no hay pagos proximos',
  noUpcomingPaymentsHint: 'Las suscripciones activas con fecha apareceran aqui.',
  purgeMode: 'Purge Mode',
  noPurgeCandidates: 'Nada que limpiar hoy',
  noPurgeCandidatesHint: 'Las suscripciones con revision pendiente apareceran aqui con su guia de cancelacion.',
  openCancelGuide: 'Cancelar rapido',
  cancelGuideMissing: 'Todavia no hay una guia de cancelacion guardada para esta suscripcion.',
  noReasonSaved: 'Aun no has guardado por que mantienes esto activo.',
  reviewDone: 'Listo (3 meses)',
  reviewSnooze: 'Posponer (1 mes)',
  settings: 'Ajustes',
  currency: 'Moneda',
  selectCurrency: 'Seleccionar moneda',
  summary: 'Resumen',
  totalSubscriptions: 'Total suscripciones',
  terminated: 'Canceladas',
  language: 'Idioma',
  selectLanguage: 'Seleccionar idioma',
  accumulatedSpent: 'Gasto acumulado activo',
  endedAccumulatedSpent: 'Gasto acumulado cancelado',
  paidUsageSpent: 'Uso pagado',
  thisMonthDue: 'A pagar este período',
  endedTotalSpent: 'Gasto en suscripciones canceladas',
  futureCommitment: 'Pagos futuros',
  notificationTests: 'Pruebas de notificaciones',
  notificationTestsHint: 'Este boton envia dos notificaciones de prueba a los 5 y 10 segundos. Los recordatorios reales se programan automaticamente tras 7 dias sin uso y 4 dias antes de renovar o terminar.',
  runNotificationTest: 'Enviar notificacion de prueba',
  notificationTestScheduled: 'Las notificaciones de prueba se programaron para 5 y 10 segundos.',
  notificationPermissionDenied: 'Falta el permiso de notificaciones. Concedelo antes de probar.',
  loadDemoData: 'Cargar datos demo',
  loadDemoDataHint: 'Carga suscripciones de ejemplo para ver los cálculos históricos.',
  demoLoadTitle: '¿Cargar datos demo?',
  demoLoadMessage: 'Tus suscripciones actuales se reemplazarán con datos demo.',
  demoLoadedTitle: 'Demo lista',
  demoLoadedMessage: 'Se cargaron suscripciones de ejemplo.',
  currencySymbolNote: 'Cambiar la moneda solo actualiza el símbolo, no los importes.',
  resetData: 'Eliminar todos los datos',
  resetDataHint: 'Elimina todas las suscripciones y ajustes del dispositivo.',
  resetDataTitle: '¿Eliminar todos los datos?',
  resetDataMessage: 'Esto no se puede deshacer. Todas las suscripciones e historial se eliminarán.',
  spendTrend: 'Últimos 6 meses',
  onboardingTitle: 'Bienvenido a Subpurge',
  onboardingSubtitle: 'Sigue tus suscripciones, descubre cuáles puedes cancelar y controla tu gasto mensual.',
  onboardingCta: 'Empezar',
  onboardingDemoBtn: 'Cargar datos demo',
  editSubscriptionHint: 'Editar suscripcion',
  perMonthEquiv: (amount: string) => `≈ ${amount}/mes`,
};

const de: Translations = {
  tabSubscriptions: 'Abos',
  tabStats: 'Dashboard',
  tabSettings: 'Einstellungen',
  subscriptions: 'Abonnements',
  monthly: 'Monatlich',
  yearly: 'Jährlich',
  active: 'Aktiv',
  current: 'Aktuell',
  ended: 'Beendet',
  noSubscriptions: 'Noch keine Abonnements',
  noSubscriptionsHint: 'Tippe auf +, um dein erstes Abo hinzuzufügen',
  noEndedSubscriptions: 'Keine beendeten Abonnements',
  noEndedSubscriptionsHint: 'Halte ein aktives Abo gedrückt, um es zu beenden',
  perMonth: '/Monat',
  terminate: 'Beenden',
  reactivate: 'Reaktivieren',
  edit: 'Bearbeiten',
  delete: 'Löschen',
  cancel: 'Abbrechen',
  ok: 'OK',
  deleteConfirmTitle: 'Abo löschen',
  deleteConfirmMessage: 'soll gelöscht werden?',
  terminateConfirmMessage: (name: string) => `${name} beenden?`,
  totalSpent: 'Gesamtausgaben',
  completedCycles: 'Abgeschlossene Zyklen',
  newSubscription: 'Neues Abonnement',
  editSubscription: 'Bearbeiten',
  cancelBtn: 'Zurück',
  selectService: 'Dienst auswählen',
  pickFromPresets: 'Aus Voreinstellungen wählen',
  subscriptionName: 'Abo-Name',
  subscriptionNamePlaceholder: 'z.B. Mein Dienst',
  billingCycle: 'Abrechnungszyklus',
  price: 'Preis',
  pricePlaceholder: '0.00',
  notes: 'Notizen (optional)',
  notesPlaceholder: 'Kontodaten, Planname usw.',
  save: 'Speichern',
  saveConfirmTitle: 'Änderungen speichern',
  saveConfirmMessage: 'Möchtest du die Änderungen an diesem Abo speichern?',
  saveSuccessTitle: 'Gespeichert',
  saveSuccessMessage: 'Das Abo wurde gespeichert.',
  deleteSubscription: 'Abo löschen',
  errorNameRequired: 'Abo-Name ist erforderlich',
  errorInvalidPrice: 'Gib einen gültigen Preis ein',
  weekly: 'Wöchentlich',
  monthly2: 'Monatlich',
  yearly2: 'Jährlich',
  trackingType: 'Tracking-Typ',
  autoRenewing: 'Automatisch verlängernd',
  fixedTerm: 'Feste Enddatum',
  startDate: 'Startdatum',
  nextPaymentDate: 'Nächstes Zahlungsdatum',
  endDate: 'Enddatum',
  dateFormatHint: 'YYYY-MM-DD',
  errorInvalidDate: 'muss das Format YYYY-MM-DD verwenden',
  errorTrackedDateBeforeStart: 'Das Tracking-Datum darf nicht vor dem Startdatum liegen',
  today: 'Heute',
  suggestedDate: 'Vorgeschlagenes Datum',
  whyPaying: 'Warum zahle ich noch?',
  whyPayingPlaceholder: 'z.B. Nur fur eine Serie aktiv',
  quickCancelUrl: 'Schneller-Kundigungslink',
  quickCancelUrlPlaceholder: 'example.com/cancel',
  reviewReminderDate: 'Erinnerung zur Prufung',
  remindMeIn1Month: 'In 1 Monat',
  remindMeIn3Months: 'In 3 Monaten erinnern',
  errorInvalidUrl: 'Gib einen gultigen Link ein',
  planTemplates: 'Fertige Tarife',
  customPrice: 'Eigener Preis',
  manage: 'Abo verwalten',
  cancelNow: 'Abo kundigen',
  lastUsed: 'Zuletzt genutzt',
  usedToday: 'Innerhalb von 7 Tagen genutzt',
  usageAlerts: 'Nutzungswarnungen',
  noUsageAlerts: 'Keine inaktiven Abos',
  noUsageAlertsHint: 'Aktive Abos ohne Nutzung seit 15 Tagen erscheinen hier.',
  unusedFor: (days: number) => `${days} Tage nicht genutzt`,
  priceChangeAlerts: 'Preiserhohungen',
  noPriceChanges: 'Derzeit keine Preisanderungen',
  noPriceChangesHint: 'Verknupfte Tarife zeigen Erhohungen hier an.',
  priceRaised: (currencySymbol: string, oldPrice: string, newPrice: string) => `Preis ${currencySymbol}${oldPrice} -> ${currencySymbol}${newPrice}`,
  updatePlan: 'Tarif aktualisieren',
  filterAll: 'Alle',
  filterUpcoming: 'Bald',
  filterIdle: 'Inaktiv',
  filterPrice: 'Erhoht',
  focusUpcoming: 'Diese Woche',
  focusUpcomingHint: 'Erneuerung innerhalb von 7 Tagen',
  focusAttention: 'Achtung',
  focusAttentionHint: 'Inaktive oder teurere Abos',
  back: '‹ Zurück',
  priceSummary: 'Preisübersicht',
  monthlyTotal: 'Monatliche Gesamtkosten',
  daily: 'Täglich',
  subscriptionCount: 'Abonnements',
  costBreakdown: 'Kosten pro Abo',
  perMonthShort: '/Mo.',
  perYear: '/Jahr',
  statistics: 'Statistiken',
  noData: 'Noch keine Daten',
  noDataHint: 'Füge Abos hinzu, um Statistiken zu sehen',
  dailyCost: 'Täglich',
  monthlyCost: 'Monatlich',
  yearlyCost: 'Jährliche Gesamtkosten',
  spendingBreakdown: 'Ausgabenaufschlüsselung',
  dashboardEyebrow: 'Auf einen Blick',
  dashboardTitle: 'SubPurge Dashboard',
  dashboardSubtitle: 'Behalte nur die Abos, die du noch nutzt.',
  monthlyFocus: 'Dieser Monat',
  upcomingPayments: 'Anstehende Zahlungen',
  noUpcomingPayments: 'Noch keine anstehenden Zahlungen',
  noUpcomingPaymentsHint: 'Aktive Abos mit Datum erscheinen hier.',
  purgeMode: 'Purge Mode',
  noPurgeCandidates: 'Heute nichts zu bereinigen',
  noPurgeCandidatesHint: 'Abos mit falliger Prufung erscheinen hier mit Kundigungslink.',
  openCancelGuide: 'Schnell kundigen',
  cancelGuideMissing: 'Fur dieses Abo ist noch kein Kundigungslink gespeichert.',
  noReasonSaved: 'Du hast noch keinen Grund fur dieses aktive Abo gespeichert.',
  reviewDone: 'Erledigt (3 Mo.)',
  reviewSnooze: 'Verschieben (1 Mo.)',
  settings: 'Einstellungen',
  currency: 'Währung',
  selectCurrency: 'Währung auswählen',
  summary: 'Übersicht',
  totalSubscriptions: 'Abonnements gesamt',
  terminated: 'Beendet',
  language: 'Sprache',
  selectLanguage: 'Sprache auswählen',
  accumulatedSpent: 'Kumulierte aktive Ausgaben',
  endedAccumulatedSpent: 'Kumulierte beendete Ausgaben',
  paidUsageSpent: 'Bezahlte Nutzung',
  thisMonthDue: 'Fällig in diesem Zeitraum',
  endedTotalSpent: 'Ausgaben beendeter Abos',
  futureCommitment: 'Zukünftige Zahlungen',
  notificationTests: 'Benachrichtigungstest',
  notificationTestsHint: 'Dieser Button sendet zwei Testbenachrichtigungen nach 5 und 10 Sekunden. Echte Erinnerungen werden nach 7 Tagen ohne Nutzung und 4 Tage vor Verlangerung oder Ende automatisch geplant.',
  runNotificationTest: 'Testbenachrichtigung senden',
  notificationTestScheduled: 'Die Testbenachrichtigungen wurden fur 5 und 10 Sekunden spater geplant.',
  notificationPermissionDenied: 'Die Benachrichtigungsberechtigung fehlt. Erlaube sie zuerst fur den Test.',
  loadDemoData: 'Demo-Daten laden',
  loadDemoDataHint: 'Lade Beispielabos, um historische Ausgaben zu sehen.',
  demoLoadTitle: 'Demo-Daten laden?',
  demoLoadMessage: 'Deine aktuellen Abos werden durch Demo-Daten ersetzt.',
  demoLoadedTitle: 'Demo bereit',
  demoLoadedMessage: 'Beispielabos wurden geladen.',
  currencySymbolNote: 'Die Währungsänderung betrifft nur das Symbol, nicht die Beträge.',
  resetData: 'Alle Daten zurücksetzen',
  resetDataHint: 'Löscht alle Abos und Einstellungen von diesem Gerät.',
  resetDataTitle: 'Alle Daten zurücksetzen?',
  resetDataMessage: 'Das kann nicht rückgängig gemacht werden. Alle Abos und der Verlauf werden gelöscht.',
  spendTrend: 'Letzte 6 Monate',
  onboardingTitle: 'Willkommen bei Subpurge',
  onboardingSubtitle: 'Verfolge deine Abos, finde überflüssige und behalte deine monatlichen Ausgaben im Blick.',
  onboardingCta: 'Loslegen',
  onboardingDemoBtn: 'Demo-Daten laden',
  editSubscriptionHint: 'Abo bearbeiten',
  perMonthEquiv: (amount: string) => `≈ ${amount}/Mo.`,
};

const fr: Translations = {
  tabSubscriptions: 'Abonnements',
  tabStats: 'Dashboard',
  tabSettings: 'Paramètres',
  subscriptions: 'Abonnements',
  monthly: 'Mensuel',
  yearly: 'Annuel',
  active: 'Actifs',
  current: 'En cours',
  ended: 'Résiliés',
  noSubscriptions: 'Aucun abonnement',
  noSubscriptionsHint: 'Appuyez sur + pour ajouter votre premier abonnement',
  noEndedSubscriptions: 'Aucun abonnement résilié',
  noEndedSubscriptionsHint: "Appuyez longuement sur un abonnement actif pour le résilier",
  perMonth: '/mois',
  terminate: 'Résilier',
  reactivate: 'Réactiver',
  edit: 'Modifier',
  delete: 'Supprimer',
  cancel: 'Annuler',
  ok: 'OK',
  deleteConfirmTitle: "Supprimer l'abonnement",
  deleteConfirmMessage: 'sera supprimé. Confirmer ?',
  terminateConfirmMessage: (name: string) => `Résilier ${name} ?`,
  totalSpent: 'Dépense totale',
  completedCycles: 'Cycles terminés',
  newSubscription: 'Nouvel abonnement',
  editSubscription: 'Modifier',
  cancelBtn: 'Retour',
  selectService: 'Choisir un service',
  pickFromPresets: 'Choisir parmi les services',
  subscriptionName: "Nom de l'abonnement",
  subscriptionNamePlaceholder: 'ex. Mon service perso',
  billingCycle: 'Cycle de facturation',
  price: 'Prix',
  pricePlaceholder: '0.00',
  notes: 'Notes (facultatif)',
  notesPlaceholder: 'Infos compte, nom du plan, etc.',
  save: 'Enregistrer',
  saveConfirmTitle: 'Enregistrer les modifications',
  saveConfirmMessage: 'Voulez-vous enregistrer les modifications de cet abonnement ?',
  saveSuccessTitle: 'Enregistré',
  saveSuccessMessage: "L'abonnement a été enregistré.",
  deleteSubscription: "Supprimer l'abonnement",
  errorNameRequired: 'Le nom est requis',
  errorInvalidPrice: 'Entrez un prix valide',
  weekly: 'Hebdomadaire',
  monthly2: 'Mensuel',
  yearly2: 'Annuel',
  trackingType: 'Type de suivi',
  autoRenewing: 'Renouvellement automatique',
  fixedTerm: 'Date de fin fixe',
  startDate: 'Date de début',
  nextPaymentDate: 'Prochaine date de paiement',
  endDate: 'Date de fin',
  dateFormatHint: 'YYYY-MM-DD',
  errorInvalidDate: 'doit utiliser le format YYYY-MM-DD',
  errorTrackedDateBeforeStart: 'La date suivie ne peut pas précéder la date de début',
  today: "Aujourd'hui",
  suggestedDate: 'Date suggérée',
  whyPaying: 'Pourquoi je paie encore ?',
  whyPayingPlaceholder: 'ex. Seulement pour une serie',
  quickCancelUrl: 'Lien de resiliation rapide',
  quickCancelUrlPlaceholder: 'example.com/cancel',
  reviewReminderDate: 'Date de revision',
  remindMeIn1Month: 'Dans 1 mois',
  remindMeIn3Months: 'Me le rappeler dans 3 mois',
  errorInvalidUrl: 'Entrez un lien valide',
  planTemplates: 'Forfaits prets',
  customPrice: 'Prix personnalisé',
  manage: "Gerer l'abonnement",
  cancelNow: "Resilier l'abonnement",
  lastUsed: 'Derniere utilisation',
  usedToday: 'Utilise sous 7 jours',
  usageAlerts: "Alertes d'utilisation",
  noUsageAlerts: 'Aucun abonnement inactif',
  noUsageAlertsHint: 'Les abonnements actifs non utilises depuis 15 jours apparaitront ici.',
  unusedFor: (days: number) => `Inutilise depuis ${days} jours`,
  priceChangeAlerts: 'Hausses de prix',
  noPriceChanges: 'Aucune hausse de prix pour le moment',
  noPriceChangesHint: 'Les forfaits lies afficheront ici les hausses.',
  priceRaised: (currencySymbol: string, oldPrice: string, newPrice: string) => `Prix ${currencySymbol}${oldPrice} -> ${currencySymbol}${newPrice}`,
  updatePlan: 'Mettre a jour',
  filterAll: 'Tout',
  filterUpcoming: 'A venir',
  filterIdle: 'Inactifs',
  filterPrice: 'Hausses',
  focusUpcoming: 'Cette semaine',
  focusUpcomingHint: 'Renouvellements sous 7 jours',
  focusAttention: 'Attention',
  focusAttentionHint: 'Abonnements inactifs ou plus chers',
  back: '‹ Retour',
  priceSummary: 'Résumé des prix',
  monthlyTotal: 'Total mensuel',
  daily: 'Quotidien',
  subscriptionCount: 'Abonnements',
  costBreakdown: 'Coût par abonnement',
  perMonthShort: '/mois',
  perYear: '/an',
  statistics: 'Statistiques',
  noData: 'Pas encore de données',
  noDataHint: "Ajoutez des abonnements pour voir les statistiques",
  dailyCost: 'Quotidien',
  monthlyCost: 'Mensuel',
  yearlyCost: 'Total annuel',
  spendingBreakdown: 'Répartition des dépenses',
  dashboardEyebrow: "En un coup d'oeil",
  dashboardTitle: 'Tableau de bord SubPurge',
  dashboardSubtitle: 'Gardez seulement les abonnements que vous utilisez encore.',
  monthlyFocus: 'Ce mois-ci',
  upcomingPayments: 'Paiements a venir',
  noUpcomingPayments: 'Aucun paiement a venir pour le moment',
  noUpcomingPaymentsHint: 'Les abonnements actifs avec date apparaitront ici.',
  purgeMode: 'Purge Mode',
  noPurgeCandidates: "Rien a nettoyer aujourd'hui",
  noPurgeCandidatesHint: 'Les abonnements a revoir apparaitront ici avec un lien de resiliation.',
  openCancelGuide: 'Resiliation rapide',
  cancelGuideMissing: "Aucun guide de resiliation n'est encore enregistre pour cet abonnement.",
  noReasonSaved: "Vous n'avez pas encore note pourquoi cet abonnement reste actif.",
  reviewDone: 'Termine (3 mois)',
  reviewSnooze: 'Reporter (1 mois)',
  settings: 'Paramètres',
  currency: 'Devise',
  selectCurrency: 'Choisir une devise',
  summary: 'Résumé',
  totalSubscriptions: 'Total abonnements',
  terminated: 'Résiliés',
  language: 'Langue',
  selectLanguage: 'Choisir la langue',
  accumulatedSpent: 'Dépense cumulée active',
  endedAccumulatedSpent: 'Dépense cumulée résiliée',
  paidUsageSpent: 'Usage paye',
  thisMonthDue: 'À payer ce mois',
  endedTotalSpent: 'Dépense abonnements résiliés',
  futureCommitment: 'Paiements futurs',
  notificationTests: 'Test des notifications',
  notificationTestsHint: 'Ce bouton envoie deux notifications de test apres 5 et 10 secondes. Les vrais rappels sont programmes automatiquement apres 7 jours sans usage et 4 jours avant le renouvellement ou la fin.',
  runNotificationTest: 'Envoyer une notification de test',
  notificationTestScheduled: 'Les notifications de test sont programmees pour dans 5 et 10 secondes.',
  notificationPermissionDenied: "L'autorisation de notification manque. Autorise-la d'abord pour faire le test.",
  loadDemoData: 'Charger la démo',
  loadDemoDataHint: "Chargez des abonnements d'exemple pour prévisualiser le calcul historique.",
  demoLoadTitle: 'Charger les données de démo ?',
  demoLoadMessage: 'Vos abonnements actuels seront remplacés par les données de démo.',
  demoLoadedTitle: 'Démo prête',
  demoLoadedMessage: "Les abonnements d'exemple ont été chargés.",
  currencySymbolNote: "Le changement de devise ne met à jour que le symbole, pas les montants.",
  resetData: 'Réinitialiser tout',
  resetDataHint: 'Supprime tous les abonnements et paramètres de cet appareil.',
  resetDataTitle: 'Réinitialiser toutes les données ?',
  resetDataMessage: "Cette action est irréversible. Tous les abonnements et l'historique seront supprimés.",
  spendTrend: '6 derniers mois',
  onboardingTitle: 'Bienvenue dans Subpurge',
  onboardingSubtitle: "Suivez vos abonnements, trouvez ceux à couper et reprenez le contrôle de vos dépenses.",
  onboardingCta: 'Commencer',
  onboardingDemoBtn: 'Charger la démo',
  editSubscriptionHint: "Modifier l'abonnement",
  perMonthEquiv: (amount: string) => `≈ ${amount}/mois`,
};

export const TRANSLATIONS: Record<Locale, Translations> = { tr, en, es, de, fr };

export const LOCALES: Locale[] = ['tr', 'en', 'es', 'de', 'fr'];

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export const LANGUAGE_OPTIONS: { code: Locale; name: string; nativeName: string }[] = [
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
];
