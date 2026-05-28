import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { View as RNView } from 'react-native';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ServiceLogo } from '../../components/ServiceLogo';
import { SwipeableSubscriptionCard } from '../../components/SwipeableSubscriptionCard';
import { useCoachMarks } from '../../components/CoachMarks';
import { ThemedAlert } from '../../components/ThemedAlert';
import { AppTheme, getTheme } from '../../constants/theme';
import { useAlertState } from '../../hooks/useAlertState';
import {
  getInactiveSubscriptions,
  getPriceIncreaseSubscriptions,
  getTrackedDate,
  Subscription,
  useStore,
} from '../../store/useSubscriptionStore';
import { openSubscriptionLink } from '../../utils/subscriptionLinks';
import { compareDateValues, differenceInCalendarDays, formatDisplayDate, formatRelativeDayLabel } from '../../utils/subscriptionDates';
import { getMonthlyEquivalent, getSummaryTotals } from '../../utils/subscriptionSummary';

const STATUS_COLORS = {
  urgent: '#FF453A',
  warning: '#FF9F0A',
  success: '#34C759',
};

type Tab = 'active' | 'ended';
type ActiveFilter = 'all' | 'upcoming' | 'idle' | 'price';

function sortSubscriptions(subscriptions: Subscription[], tab: Tab): Subscription[] {
  return [...subscriptions].sort((left, right) => {
    if (tab === 'ended') {
      return (right.endedAt ?? '').localeCompare(left.endedAt ?? '');
    }

    const leftDate = getTrackedDate(left);
    const rightDate = getTrackedDate(right);

    if (leftDate && rightDate) {
      return compareDateValues(leftDate, rightDate);
    }

    if (leftDate) return -1;
    if (rightDate) return 1;
    return left.name.localeCompare(right.name);
  });
}

function getStatusTone(daysUntil: number) {
  if (daysUntil < 0) return STATUS_COLORS.urgent;
  if (daysUntil <= 3) return STATUS_COLORS.warning;
  return STATUS_COLORS.success;
}

function SubscriptionRow({
  item,
  currencySymbol,
  statusText,
  statusColor,
  dateLabel,
  dateValue,
  monthlyEquivLabel,
  editHint,
  theme,
  onOpenMenu,
  isLast,
  rowRef,
}: {
  item: Subscription;
  currencySymbol: string;
  statusText: string;
  statusColor: string;
  dateLabel: string;
  dateValue: string;
  monthlyEquivLabel: string | null;
  editHint: string;
  theme: AppTheme;
  onOpenMenu: (item: Subscription) => void;
  isLast: boolean;
  rowRef?: (r: any) => void;
}) {
  const router = useRouter();

  return (
    <View ref={rowRef}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push({ pathname: '/add-subscription', params: { id: item.id } })}
        activeOpacity={0.6}
        accessibilityLabel={item.name}
        accessibilityRole="button"
        accessibilityHint={editHint}
      >
        <ServiceLogo logoUrl={item.logoUrl} icon={item.icon} color={item.color} size={34} serviceName={item.name} />

        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.rowPrice, { color: theme.text }]}>{currencySymbol}{item.price.toFixed(2)}</Text>
          </View>
          <View style={styles.rowBottom}>
            <Text style={[styles.rowMeta, { color: theme.subtext }]} numberOfLines={1}>
              {dateLabel} {dateValue}
              {monthlyEquivLabel ? `  ·  ${monthlyEquivLabel}` : ''}
            </Text>
            <View style={[styles.rowDot, { backgroundColor: statusColor }]} />
          </View>
        </View>

        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => onOpenMenu(item)}
          accessibilityLabel="More options"
          accessibilityRole="button"
        >
          <Text style={[styles.rowMenu, { color: theme.subtext }]}>⋯</Text>
        </TouchableOpacity>
      </TouchableOpacity>
      {!isLast && <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />}
    </View>
  );
}

export default function SubscriptionsScreen() {
  const {
    subscriptions,
    currency,
    locale,
    t,
    themeMode,
    toggleThemeMode,
    toggleActive,
    deleteSubscription,
    markSubscriptionUsed,
  } = useStore();
  const router = useRouter();
  const theme = getTheme(themeMode);
  const { registerRef } = useCoachMarks();
  const [tab, setTab] = useState<Tab>('active');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const { alertConfig, closeAlert, showAlert } = useAlertState();

  const active = useMemo(() => sortSubscriptions(subscriptions.filter(s => s.isActive), 'active'), [subscriptions]);
  const ended = useMemo(() => sortSubscriptions(subscriptions.filter(s => !s.isActive), 'ended'), [subscriptions]);
  const inactiveAlerts = useMemo(() => getInactiveSubscriptions(active), [active]);
  const priceAlerts = useMemo(() => getPriceIncreaseSubscriptions(active), [active]);
  const { monthlyTotal } = useMemo(() => getSummaryTotals(subscriptions), [subscriptions]);
  const upcomingSoon = useMemo(
    () => active.filter(s => {
      const d = getTrackedDate(s);
      if (!d) return false;
      return differenceInCalendarDays(d) <= 7;
    }),
    [active],
  );

  const filteredActive = useMemo(() => {
    if (activeFilter === 'upcoming') return upcomingSoon;
    if (activeFilter === 'idle') return inactiveAlerts;
    if (activeFilter === 'price') return priceAlerts;
    return active;
  }, [active, activeFilter, inactiveAlerts, priceAlerts, upcomingSoon]);

  const displayed = tab === 'active' ? filteredActive : ended;

  const openQuickAccess = async (item: Subscription, mode: 'manage' | 'cancel') => {
    const opened = await openSubscriptionLink(
      mode === 'manage' ? item.manageDeepLink : undefined,
      item.quickCancelUrl,
    );
    if (!opened) {
      showAlert({ title: item.name, message: t.cancelGuideMissing, actions: [{ label: t.ok, variant: 'primary' }] });
    }
  };

  const openActiveActions = (item: Subscription) => {
    showAlert({
      title: item.name,
      actions: [
        { label: t.manage, variant: 'primary', onPress: () => { void openQuickAccess(item, 'manage'); } },
        { label: t.usedToday, onPress: () => markSubscriptionUsed(item.id) },
        { label: t.terminate, variant: 'destructive', onPress: () => toggleActive(item.id) },
        { label: t.cancelBtn },
      ],
    });
  };

  const openEndedActions = (item: Subscription) => {
    showAlert({
      title: item.name,
      accent: 'destructive',
      actions: [
        { label: t.reactivate, variant: 'primary', onPress: () => toggleActive(item.id) },
        { label: t.delete, variant: 'destructive', onPress: () => deleteSubscription(item.id) },
        { label: t.cancelBtn },
      ],
    });
  };

  const filterOptions: { id: ActiveFilter; icon: string; label: string }[] = [
    { id: 'all', icon: '≡', label: t.filterAll },
    { id: 'upcoming', icon: '⧗', label: t.filterUpcoming },
    { id: 'idle', icon: '⊘', label: t.filterIdle },
    { id: 'price', icon: '△', label: t.filterPrice },
  ];

  const attentionCount = inactiveAlerts.length + priceAlerts.length;

  return (
    <GestureHandlerRootView style={styles.flex}>
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.iconBtn, { borderColor: theme.border }]}
          onPress={toggleThemeMode}
          accessibilityRole="button"
          accessibilityLabel={themeMode === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
        >
          <View style={styles.themeToggleTrack}>
            <View style={[
              styles.themeToggleThumb,
              { backgroundColor: theme.text },
              themeMode === 'light' && styles.themeToggleThumbRight,
            ]} />
          </View>
        </TouchableOpacity>

        <View pointerEvents="none" style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t.subscriptions}</Text>
        </View>

        <TouchableOpacity
          ref={r => registerRef('addBtn', r as any)}
          style={[styles.addBtn, { backgroundColor: theme.text }]}
          onPress={() => router.push('/add-subscription')}
          accessibilityLabel={t.newSubscription}
          accessibilityRole="button"
        >
          <Text style={[styles.addBtnText, { color: theme.bg }]}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Stats card */}
      <TouchableOpacity
        style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.push('/summary')}
        activeOpacity={0.85}
      >
        <View style={styles.statsCardTop}>
          <View>
            <Text style={[styles.statsCardLabel, { color: theme.subtext }]}>{t.perMonthShort}</Text>
            <Text style={[styles.statsCardValue, { color: theme.text }]}>{currency.symbol}{monthlyTotal.toFixed(2)}</Text>
          </View>
          <Text style={[styles.statsCardArrow, { color: theme.subtext }]}>›</Text>
        </View>

        <View style={[styles.statsCardDivider, { backgroundColor: theme.border }]} />

        <View style={styles.statsCardBottom}>
          <View style={styles.statsNote}>
            <Text style={[styles.statsNoteIcon, { color: upcomingSoon.length > 0 ? STATUS_COLORS.warning : theme.subtext }]}>⧗</Text>
            <Text style={[styles.statsNoteText, { color: upcomingSoon.length > 0 ? STATUS_COLORS.warning : theme.subtext }]}>
              {upcomingSoon.length} {t.filterUpcoming}
            </Text>
          </View>
          <Text style={[styles.statsNoteDot, { color: theme.border }]}>·</Text>
          <View style={styles.statsNote}>
            <Text style={[styles.statsNoteIcon, { color: attentionCount > 0 ? STATUS_COLORS.urgent : theme.subtext }]}>◎</Text>
            <Text style={[styles.statsNoteText, { color: attentionCount > 0 ? STATUS_COLORS.urgent : theme.subtext }]}>
              {attentionCount} {t.focusAttention}
            </Text>
          </View>
          <Text style={[styles.statsNoteDot, { color: theme.border }]}>·</Text>
          <View style={styles.statsNote}>
            <Text style={[styles.statsNoteIcon, { color: theme.subtext }]}>⬡</Text>
            <Text style={[styles.statsNoteText, { color: theme.subtext }]}>{active.length} {t.active}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Tabs */}
      <View style={[styles.tabRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'active' && { backgroundColor: theme.cardStrong }]}
          onPress={() => setTab('active')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'active' }}
        >
          <Text style={[styles.tabBtnText, { color: tab === 'active' ? theme.text : theme.subtext }]}>
            {t.active} {active.length > 0 && `(${active.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'ended' && { backgroundColor: theme.cardStrong }]}
          onPress={() => setTab('ended')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'ended' }}
        >
          <Text style={[styles.tabBtnText, { color: tab === 'ended' ? theme.text : theme.subtext }]}>
            {t.ended} {ended.length > 0 && `(${ended.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters (active tab only) */}
      {tab === 'active' && (
        <View style={styles.filterRow}>
          {filterOptions.map(option => {
            const active = activeFilter === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={styles.filterChip}
                onPress={() => setActiveFilter(option.id)}
                accessibilityLabel={option.label}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.filterChipIcon, { color: active ? theme.text : theme.subtext }]}>{option.icon}</Text>
                <Text style={[styles.filterChipText, { color: active ? theme.text : theme.subtext }]}>
                  {option.label}
                </Text>
                {active && <View style={[styles.filterChipDot, { backgroundColor: theme.text }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <FlatList
        data={displayed}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => {
          const trackedDate = getTrackedDate(item);
          const daysUntil = trackedDate ? differenceInCalendarDays(trackedDate) : Number.NaN;
          const dateLabel = item.isActive
            ? (item.trackingType === 'renewal' ? t.nextPaymentDate : t.endDate)
            : t.terminated;
          const dateValue = item.isActive
            ? (trackedDate ? formatDisplayDate(trackedDate, locale) : '—')
            : (item.endedAt ? formatDisplayDate(item.endedAt, locale) : '—');
          const statusText = item.isActive
            ? (trackedDate ? formatRelativeDayLabel(trackedDate, locale) : t.active)
            : t.ended;
          const statusColor = item.isActive ? getStatusTone(daysUntil) : theme.inactive;

          const monthlyEquiv = getMonthlyEquivalent(item);
          const monthlyEquivLabel = item.billingCycle !== 'monthly'
            ? t.perMonthEquiv(`${currency.symbol}${monthlyEquiv.toFixed(2)}`)
            : null;

          return (
            <SwipeableSubscriptionCard
              theme={theme}
              isActive={item.isActive}
              rightActionLabel={item.isActive ? t.usedToday : t.reactivate}
              onRightAction={() => item.isActive ? markSubscriptionUsed(item.id) : toggleActive(item.id)}
              leftActionLabel={item.isActive ? t.terminate : t.delete}
              onLeftAction={() => item.isActive
                ? showAlert({
                    title: item.name,
                    accent: 'destructive',
                    actions: [
                      { label: t.cancel },
                      { label: t.terminate, variant: 'destructive', onPress: () => toggleActive(item.id) },
                    ],
                  })
                : showAlert({
                    title: item.name,
                    accent: 'destructive',
                    actions: [
                      { label: t.cancel },
                      { label: t.delete, variant: 'destructive', onPress: () => deleteSubscription(item.id) },
                    ],
                  })
              }
            >
              <SubscriptionRow
                item={item}
                currencySymbol={currency.symbol}
                statusText={statusText}
                statusColor={statusColor}
                dateLabel={dateLabel}
                dateValue={dateValue}
                monthlyEquivLabel={monthlyEquivLabel}
                editHint={t.editSubscriptionHint}
                theme={theme}
                onOpenMenu={tab === 'active' ? openActiveActions : openEndedActions}
                isLast={index === displayed.length - 1}
                rowRef={index === 0 ? (r: any) => registerRef('subscriptionRow', r) : undefined}
              />
            </SwipeableSubscriptionCard>
          );
        }}
        contentContainerStyle={displayed.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyIcon, { color: theme.border }]}>{tab === 'active' ? '⬡' : '⊟'}</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {tab === 'active' ? t.noSubscriptions : t.noEndedSubscriptions}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
              {tab === 'active' ? t.noSubscriptionsHint : t.noEndedSubscriptionsHint}
            </Text>
            {tab === 'active' && (
              <TouchableOpacity
                style={[styles.emptyAddBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push('/add-subscription')}
                accessibilityRole="button"
              >
                <Text style={[styles.emptyAddBtnText, { color: theme.accent }]}>+ {t.newSubscription}</Text>
              </TouchableOpacity>
            )}
          </View>
        }
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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    position: 'relative',
  },
  headerTitleWrap: {
    position: 'absolute',
    left: 76,
    right: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  iconBtn: {
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  themeToggleTrack: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  themeToggleThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignSelf: 'flex-start',
  },
  themeToggleThumbRight: {
    alignSelf: 'flex-end',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { fontSize: 20, lineHeight: 22, fontWeight: '300', textAlign: 'center' },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 10,
  },
  statsCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsCardLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  statsCardValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  statsCardArrow: { fontSize: 20 },
  statsCardDivider: { height: 1 },
  statsCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  statsNote: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statsNoteIcon: { fontSize: 11 },
  statsNoteText: { fontSize: 11, fontWeight: '500' },
  statsNoteDot: { fontSize: 14, lineHeight: 14 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  tabBtnText: { fontSize: 13, fontWeight: '600' },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 0,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  filterChip: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 3,
  },
  filterChipIcon: { fontSize: 13 },
  filterChipText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  filterChipDot: { width: 3, height: 3, borderRadius: 2 },
  listContent: { paddingBottom: 120 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  rowTitle: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  rowPrice: { fontSize: 15, fontWeight: '700' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowMeta: { fontSize: 12, flex: 1 },
  rowDot: { width: 5, height: 5, borderRadius: 3 },
  rowDivider: { height: StyleSheet.hairlineWidth, marginTop: 0 },
  rowMenu: { fontSize: 18, paddingHorizontal: 4 },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 14, fontWeight: '100' },
  emptyTitle: { fontSize: 17, fontWeight: '600', marginBottom: 8 },
  emptySubtext: { fontSize: 13, textAlign: 'center', paddingHorizontal: 40, marginBottom: 24 },
  emptyAddBtn: {
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyAddBtnText: { fontSize: 15, fontWeight: '700' },
});
