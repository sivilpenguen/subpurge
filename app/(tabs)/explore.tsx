import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ServiceLogo } from '../../components/ServiceLogo';
import { ThemedAlert } from '../../components/ThemedAlert';
import { getTheme } from '../../constants/theme';
import { useAlertState } from '../../hooks/useAlertState';
import {
  getDaysSinceLastUsed,
  getDueReviewSubscriptions,
  getInactiveSubscriptions,
  getPriceIncreaseSubscriptions,
  useStore,
} from '../../store/useSubscriptionStore';
import { openSubscriptionLink } from '../../utils/subscriptionLinks';
import { formatDisplayDate } from '../../utils/subscriptionDates';

// ─── Section item types ──────────────────────────────────────────────────────

type ReviewItem = { kind: 'review'; subscription: ReturnType<typeof getDueReviewSubscriptions>[number] };
type InactiveItem = { kind: 'inactive'; subscription: ReturnType<typeof getInactiveSubscriptions>[number] };
type PriceItem = { kind: 'price'; subscription: ReturnType<typeof getPriceIncreaseSubscriptions>[number] };
type SectionItem = ReviewItem | InactiveItem | PriceItem;

type PurgeSection = {
  key: string;
  title: string;
  data: SectionItem[];
  empty: { title: string; hint: string };
};

export default function PurgeModeScreen() {
  const router = useRouter();
  const { subscriptions, currency, locale, t, themeMode, markSubscriptionUsed, snoozeReviewReminder } = useStore();
  const theme = getTheme(themeMode);
  const { alertConfig, closeAlert, setAlertConfig } = useAlertState();

  const dueReviews = useMemo(() => getDueReviewSubscriptions(subscriptions), [subscriptions]);
  const inactiveSubscriptions = useMemo(() => getInactiveSubscriptions(subscriptions), [subscriptions]);
  const priceIncreases = useMemo(() => getPriceIncreaseSubscriptions(subscriptions), [subscriptions]);

  const sections: PurgeSection[] = useMemo(() => [
    {
      key: 'review',
      title: t.purgeMode,
      data: dueReviews.map(s => ({ kind: 'review' as const, subscription: s })),
      empty: { title: t.noPurgeCandidates, hint: t.noPurgeCandidatesHint },
    },
    {
      key: 'inactive',
      title: t.usageAlerts,
      data: inactiveSubscriptions.map(s => ({ kind: 'inactive' as const, subscription: s })),
      empty: { title: t.noUsageAlerts, hint: t.noUsageAlertsHint },
    },
    {
      key: 'price',
      title: t.priceChangeAlerts,
      data: priceIncreases.map(s => ({ kind: 'price' as const, subscription: s })),
      empty: { title: t.noPriceChanges, hint: t.noPriceChangesHint },
    },
  ], [dueReviews, inactiveSubscriptions, priceIncreases, t]);

  const openLink = async (subscriptionName: string, deepLink?: string, url?: string) => {
    const opened = await openSubscriptionLink(deepLink, url);
    if (!opened) {
      setAlertConfig({
        title: subscriptionName,
        message: t.cancelGuideMissing,
        actions: [{ label: t.ok, variant: 'primary' }],
      });
    }
  };

  const renderItem = ({ item }: { item: SectionItem }) => {
    const { subscription } = item;

    if (item.kind === 'review') {
      return (
        <View style={[styles.stackCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.stackTop}>
            <View style={styles.stackIdentity}>
              <ServiceLogo logoUrl={subscription.logoUrl} icon={subscription.icon} color={subscription.color} size={38} serviceName={subscription.name} />
              <View style={styles.stackIdentityText}>
                <Text style={[styles.stackTitle, { color: theme.text }]}>{subscription.name}</Text>
                <Text style={[styles.stackMeta, { color: theme.subtext }]}>
                  {t.reviewReminderDate}: {subscription.reviewReminderDate ? formatDisplayDate(subscription.reviewReminderDate, locale) : '—'}
                </Text>
              </View>
            </View>
            <Text style={[styles.stackPrice, { color: theme.text }]}>{currency.symbol}{subscription.price.toFixed(2)}</Text>
          </View>
          <Text style={[styles.stackBodyLabel, { color: theme.subtext }]}>{t.whyPaying}</Text>
          <Text style={[styles.stackBodyText, { color: theme.text }]}>
            {subscription.purpose?.trim() || subscription.notes?.trim() || t.noReasonSaved}
          </Text>
          <View style={styles.stackActions}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: theme.border, backgroundColor: theme.secondaryButtonBg }]}
              onPress={() => snoozeReviewReminder(subscription.id, 1)}
              accessibilityLabel={t.reviewSnooze}
              accessibilityRole="button"
            >
              <Text style={[styles.secondaryBtnText, { color: theme.text }]}>{t.reviewSnooze}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.primaryButtonBg }]}
              onPress={() => snoozeReviewReminder(subscription.id, 3)}
              accessibilityLabel={t.reviewDone}
              accessibilityRole="button"
            >
              <Text style={[styles.primaryBtnText, { color: theme.primaryButtonText }]}>{t.reviewDone}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.stackActions, { marginTop: 8 }]}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: theme.border, backgroundColor: theme.secondaryButtonBg }]}
              onPress={() => router.push({ pathname: '/add-subscription', params: { id: subscription.id } })}
              accessibilityLabel={t.updatePlan}
              accessibilityRole="button"
            >
              <Text style={[styles.secondaryBtnText, { color: theme.text }]}>{t.updatePlan}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: theme.border, backgroundColor: theme.secondaryButtonBg }]}
              onPress={() => { void openLink(subscription.name, subscription.manageDeepLink, subscription.quickCancelUrl); }}
              accessibilityLabel={t.openCancelGuide}
              accessibilityRole="button"
            >
              <Text style={[styles.secondaryBtnText, { color: theme.text }]}>{t.openCancelGuide}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (item.kind === 'inactive') {
      const daysSinceLastUsed = getDaysSinceLastUsed(subscription) ?? 0;
      return (
        <View style={[styles.stackCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.stackTop}>
            <View style={styles.stackIdentity}>
              <ServiceLogo logoUrl={subscription.logoUrl} icon={subscription.icon} color={subscription.color} size={38} serviceName={subscription.name} />
              <View style={styles.stackIdentityText}>
                <Text style={[styles.stackTitle, { color: theme.text }]}>{subscription.name}</Text>
                <Text style={[styles.stackMeta, { color: theme.subtext }]}>
                  {t.lastUsed}: {subscription.lastUsedAt ? formatDisplayDate(subscription.lastUsedAt, locale) : '—'}
                </Text>
              </View>
            </View>
            <Text style={[styles.stackPrice, { color: theme.text }]}>{currency.symbol}{subscription.price.toFixed(2)}</Text>
          </View>
          <Text style={[styles.stackBodyText, { color: theme.text }]}>{t.unusedFor(daysSinceLastUsed)}</Text>
          <View style={styles.stackActions}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: theme.border, backgroundColor: theme.secondaryButtonBg }]}
              onPress={() => markSubscriptionUsed(subscription.id)}
              accessibilityLabel={t.usedToday}
              accessibilityRole="button"
            >
              <Text style={[styles.secondaryBtnText, { color: theme.text }]}>{t.usedToday}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.primaryButtonBg }]}
              onPress={() => { void openLink(subscription.name, subscription.manageDeepLink, subscription.quickCancelUrl); }}
              accessibilityLabel={t.openCancelGuide}
              accessibilityRole="button"
            >
              <Text style={[styles.primaryBtnText, { color: theme.primaryButtonText }]}>{t.openCancelGuide}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // price increase
    const priceItem = item as PriceItem;
    const priceChange = priceItem.subscription.priceChange;
    return (
      <View style={[styles.stackCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.stackTop}>
          <View style={styles.stackIdentity}>
            <ServiceLogo logoUrl={subscription.logoUrl} icon={subscription.icon} color={subscription.color} size={38} serviceName={subscription.name} />
            <View style={styles.stackIdentityText}>
              <Text style={[styles.stackTitle, { color: theme.text }]}>{subscription.name}</Text>
              <Text style={[styles.stackMeta, { color: theme.subtext }]}>+{currency.symbol}{priceChange.delta.toFixed(2)}</Text>
            </View>
          </View>
          <Text style={[styles.stackPrice, { color: theme.text }]}>{currency.symbol}{priceChange.newPrice.toFixed(2)}</Text>
        </View>
        <Text style={[styles.stackBodyText, { color: theme.text }]}>
          {t.priceRaised(currency.symbol, priceChange.oldPrice.toFixed(2), priceChange.newPrice.toFixed(2))}
        </Text>
        <View style={styles.stackActions}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: theme.border, backgroundColor: theme.secondaryButtonBg }]}
            onPress={() => router.push({ pathname: '/add-subscription', params: { id: subscription.id } })}
            accessibilityLabel={t.updatePlan}
            accessibilityRole="button"
          >
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>{t.updatePlan}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primaryButtonBg }]}
            onPress={() => { void openLink(subscription.name, subscription.manageDeepLink, subscription.quickCancelUrl); }}
            accessibilityLabel={t.manage}
            accessibilityRole="button"
          >
            <Text style={[styles.primaryBtnText, { color: theme.primaryButtonText }]}>{t.manage}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: PurgeSection }) => (
    <Text style={[styles.sectionTitle, { color: theme.text, backgroundColor: theme.bg }]}>{section.title}</Text>
  );

  const renderSectionFooter = ({ section }: { section: PurgeSection }) => {
    if (section.data.length > 0) return null;
    return (
      <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>{section.empty.title}</Text>
        <Text style={[styles.emptyHint, { color: theme.subtext }]}>{section.empty.hint}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.kind}-${item.subscription.id}-${index}`}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        contentContainerStyle={styles.content}
        stickySectionHeadersEnabled={false}
        SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
      />

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
  content: { padding: 20, paddingBottom: 120 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, paddingTop: 4 },
  sectionSeparator: { height: 24 },
  stackCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  stackTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 },
  stackIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  stackIdentityText: { flex: 1 },
  stackTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  stackMeta: { fontSize: 12 },
  stackPrice: { fontSize: 16, fontWeight: '700' },
  stackBodyLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  stackBodyText: { fontSize: 13, lineHeight: 19 },
  stackActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  primaryBtn: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryBtnText: { fontSize: 13, fontWeight: '700' },
  secondaryBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '600' },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  emptyHint: { fontSize: 13, lineHeight: 19 },
});
