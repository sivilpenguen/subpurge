import { useRouter } from 'expo-router';
import { useCoachMarks } from '../../components/CoachMarks';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CURRENCIES } from '../../constants/currencies';
import { LANGUAGE_OPTIONS } from '../../constants/i18n';
import { getTheme } from '../../constants/theme';
import { useAlertState } from '../../hooks/useAlertState';
import {
  getSubscriptionFutureCommitment,
  getSubscriptionTotalSpent,
  useStore,
} from '../../store/useSubscriptionStore';
import { ThemedAlert } from '../../components/ThemedAlert';
import { scheduleNotificationTestAsync, syncSubscriptionNotificationsAsync } from '../../utils/subscriptionNotifications';

export default function SettingsScreen() {
  const router = useRouter();
  const { currency, setCurrency, locale, setLocale, subscriptions, themeMode, t, loadDemoSubscriptions, resetAllData } = useStore();
  const { startTour } = useCoachMarks();
  const theme = getTheme(themeMode);
  const activeSubscriptions = subscriptions.filter(subscription => subscription.isActive);
  const endedSubscriptions = subscriptions.filter(subscription => !subscription.isActive);
  const activeCount = activeSubscriptions.length;
  // Sum of active subscription prices (what you'll pay next per their cycle)
  const thisMonthDue = activeSubscriptions.reduce((sum, s) => sum + s.price, 0);
  // Total actually paid for terminated subscriptions (completed cycles × price + carry)
  const endedTotalSpent = endedSubscriptions.reduce((sum, s) => sum + getSubscriptionTotalSpent(s), 0);
  // Remaining commitment until each active subscription's tracked end date
  const futureCommitment = activeSubscriptions.reduce((sum, s) => sum + getSubscriptionFutureCommitment(s), 0);
  const [currencyModal, setCurrencyModal] = useState(false);
  const [langModal, setLangModal] = useState(false);
  const { alertConfig, closeAlert, setAlertConfig } = useAlertState();

  const currentLang = LANGUAGE_OPTIONS.find(l => l.code === locale);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t.settings}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>{t.language}</Text>
        <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setLangModal(true)} accessibilityLabel={t.selectLanguage} accessibilityRole="button">
          <View style={styles.pickerLeft}>
            <Text style={styles.pickerFlag}>
              {locale === 'tr' ? '🇹🇷' : locale === 'en' ? '🇬🇧' : locale === 'es' ? '🇪🇸' : locale === 'de' ? '🇩🇪' : '🇫🇷'}
            </Text>
            <View>
              <Text style={[styles.pickerCode, { color: theme.text }]}>{currentLang?.nativeName}</Text>
              <Text style={[styles.pickerName, { color: theme.subtext }]}>{currentLang?.name}</Text>
            </View>
          </View>
          <Text style={[styles.pickerChevron, { color: theme.subtext }]}>▼</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 24, color: theme.subtext }]}>{t.currency}</Text>
        <Text style={[styles.noteText, { color: theme.subtext }]}>{t.currencySymbolNote}</Text>
        <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setCurrencyModal(true)} accessibilityLabel={t.selectCurrency} accessibilityRole="button">
          <View style={styles.pickerLeft}>
            <Text style={[styles.pickerSymbol, { color: theme.text }]}>{currency.symbol}</Text>
            <View>
              <Text style={[styles.pickerCode, { color: theme.text }]}>{currency.code}</Text>
              <Text style={[styles.pickerName, { color: theme.subtext }]}>{currency.name}</Text>
            </View>
          </View>
          <Text style={[styles.pickerChevron, { color: theme.subtext }]}>▼</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 24, color: theme.subtext }]}>{t.summary}</Text>
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.subtext }]}>{t.totalSubscriptions}</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{subscriptions.length}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.subtext }]}>{t.active}</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{activeCount}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.subtext }]}>{t.terminated}</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{endedSubscriptions.length}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.subtext }]}>{t.thisMonthDue}</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{currency.symbol}{thisMonthDue.toFixed(2)}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.subtext }]}>{t.endedTotalSpent}</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{currency.symbol}{endedTotalSpent.toFixed(2)}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.subtext }]}>{t.futureCommitment}</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{currency.symbol}{futureCommitment.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.demoBtn, { marginTop: 12, backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push('/summary')}
        >
          <Text style={[styles.demoBtnText, { color: theme.text }]}>{t.priceSummary}</Text>
          <Text style={[styles.demoBtnHint, { color: theme.subtext }]}>{t.costBreakdown}</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 24, color: theme.subtext }]}>Onboarding</Text>
        <TouchableOpacity
          style={[styles.demoBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={startTour}
        >
          <Text style={[styles.demoBtnText, { color: theme.text }]}>Karşılama ekranını göster</Text>
          <Text style={[styles.demoBtnHint, { color: theme.subtext }]}>Onboarding önizlemesi</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 24, color: theme.subtext }]}>{t.notificationTests}</Text>
        <TouchableOpacity
          style={[styles.demoBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={async () => {
            const scheduled = await scheduleNotificationTestAsync(locale);
            if (scheduled) {
              await syncSubscriptionNotificationsAsync(subscriptions, locale, { requestPermissions: false });
            }
            setAlertConfig({
              title: t.notificationTests,
              message: scheduled ? t.notificationTestScheduled : t.notificationPermissionDenied,
              actions: [{ label: t.ok, variant: 'primary' }],
              accent: scheduled ? 'neutral' : 'destructive',
            });
          }}
        >
          <Text style={[styles.demoBtnText, { color: theme.text }]}>{t.runNotificationTest}</Text>
          <Text style={[styles.demoBtnHint, { color: theme.subtext }]}>{t.notificationTestsHint}</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 24, color: theme.subtext }]}>{t.resetData}</Text>
        <TouchableOpacity
          style={[styles.demoBtn, { backgroundColor: theme.card, borderColor: 'rgba(255,59,48,0.4)' }]}
          onPress={() => {
            setAlertConfig({
              title: t.resetDataTitle,
              message: t.resetDataMessage,
              accent: 'destructive',
              actions: [
                { label: t.cancel },
                {
                  label: t.resetData,
                  variant: 'destructive',
                  onPress: () => { resetAllData(); },
                },
              ],
            });
          }}
        >
          <Text style={[styles.demoBtnText, { color: theme.destructive }]}>{t.resetData}</Text>
          <Text style={[styles.demoBtnHint, { color: theme.subtext }]}>{t.resetDataHint}</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 24, color: theme.subtext }]}>{t.loadDemoData}</Text>
        <TouchableOpacity
          style={[styles.demoBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => {
            setAlertConfig({
              title: t.demoLoadTitle,
              message: t.demoLoadMessage,
              accent: 'destructive',
              actions: [
                { label: t.cancel },
                {
                  label: t.loadDemoData,
                  variant: 'destructive',
                  onPress: () => {
                    loadDemoSubscriptions();
                    setAlertConfig({
                      title: t.demoLoadedTitle,
                      message: t.demoLoadedMessage,
                      actions: [{ label: t.ok, variant: 'primary' }],
                    });
                  },
                },
              ],
            });
          }}
        >
          <Text style={[styles.demoBtnText, { color: theme.text }]}>{t.loadDemoData}</Text>
          <Text style={[styles.demoBtnHint, { color: theme.subtext }]}>{t.loadDemoDataHint}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={langModal} transparent animationType="slide" onRequestClose={() => setLangModal(false)}>
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: theme.overlay }]} activeOpacity={1} onPress={() => setLangModal(false)}>
          <View style={[styles.modalSheet, { backgroundColor: theme.modalBg }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.selectLanguage}</Text>
            <FlatList
              data={LANGUAGE_OPTIONS}
              keyExtractor={l => l.code}
              renderItem={({ item }) => {
                const selected = locale === item.code;
                const flag = item.code === 'tr' ? '🇹🇷' : item.code === 'en' ? '🇬🇧' : item.code === 'es' ? '🇪🇸' : item.code === 'de' ? '🇩🇪' : '🇫🇷';
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, selected && { backgroundColor: theme.modalActive }]}
                    onPress={() => { setLocale(item.code); setLangModal(false); }}
                  >
                    <Text style={styles.modalFlag}>{flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalCode, { color: theme.text }]}>{item.nativeName}</Text>
                      <Text style={[styles.modalName, { color: theme.subtext }]}>{item.name}</Text>
                    </View>
                    {selected && <Text style={[styles.modalCheck, { color: theme.text }]}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={[styles.modalDivider, { backgroundColor: theme.modalDivider }]} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={currencyModal} transparent animationType="slide" onRequestClose={() => setCurrencyModal(false)}>
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: theme.overlay }]} activeOpacity={1} onPress={() => setCurrencyModal(false)}>
          <View style={[styles.modalSheet, { backgroundColor: theme.modalBg }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.selectCurrency}</Text>
            <FlatList
              data={CURRENCIES}
              keyExtractor={c => c.code}
              renderItem={({ item }) => {
                const selected = currency.code === item.code;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, selected && { backgroundColor: theme.modalActive }]}
                    onPress={() => { setCurrency(item); setCurrencyModal(false); }}
                  >
                    <Text style={[styles.modalSymbol, { color: theme.text }]}>{item.symbol}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalCode, { color: theme.text }]}>{item.code}</Text>
                      <Text style={[styles.modalName, { color: theme.subtext }]}>{item.name}</Text>
                    </View>
                    {selected && <Text style={[styles.modalCheck, { color: theme.text }]}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={[styles.modalDivider, { backgroundColor: theme.modalDivider }]} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <ThemedAlert
        visible={!!alertConfig}
        title={alertConfig?.title}
        message={alertConfig?.message}
        actions={alertConfig?.actions ?? []}
        accent={alertConfig?.accent}
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  content: { padding: 20, paddingBottom: 120 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  pickerBtn: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  pickerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pickerSymbol: { fontSize: 24, fontWeight: '700', width: 36, textAlign: 'center' },
  pickerFlag: { fontSize: 26, width: 36, textAlign: 'center' },
  pickerCode: { fontSize: 15, fontWeight: '600' },
  pickerName: { fontSize: 12, marginTop: 2 },
  pickerChevron: { fontSize: 12 },
  infoCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  infoDivider: { height: 1 },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
    marginTop: -4,
  },
  demoBtn: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  demoBtnText: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  demoBtnHint: { fontSize: 12, lineHeight: 18 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 20 },
  modalSymbol: { fontSize: 20, fontWeight: '600', width: 32, textAlign: 'center' },
  modalFlag: { fontSize: 22, width: 32, textAlign: 'center' },
  modalCode: { fontSize: 14, fontWeight: '600' },
  modalName: { fontSize: 12, marginTop: 1 },
  modalCheck: { fontSize: 16, fontWeight: '700' },
  modalDivider: { height: 1, marginLeft: 66 },
});
