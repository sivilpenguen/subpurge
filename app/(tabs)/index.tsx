import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

type Filter = 'all' | 'upcoming' | 'idle' | 'price' | 'ended';

function sortSubscriptions(subscriptions: Subscription[], tab: 'active' | 'ended'): Subscription[] {
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
    exchangeRates,
  } = useStore();
  const router = useRouter();
  const theme = getTheme(themeMode);
  const { registerRef } = useCoachMarks();
  const [filter, setFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { alertConfig, closeAlert, showAlert } = useAlertState();

  const active = useMemo(() => sortSubscriptions(subscriptions.filter(s => s.isActive), 'active'), [subscriptions]);
  const ended = useMemo(() => sortSubscriptions(subscriptions.filter(s => !s.isActive), 'ended'), [subscriptions]);
  const inactiveAlerts = useMemo(() => getInactiveSubscriptions(active), [active]);
  const priceAlerts = useMemo(() => getPriceIncreaseSubscriptions(active), [active]);
  const { monthlyTotal } = useMemo(() => getSummaryTotals(subscriptions, currency.code, exchangeRates), [subscriptions, currency.code, exchangeRates]);
  const upcomingSoon = useMemo(
    () => active.filter(s => {
      const d = getTrackedDate(s);
      if (!d) return false;
      return differenceInCalendarDays(d) <= 7;
    }),
    [active],
  );

  const baseList = useMemo(() => {
    if (filter === 'ended') return ended;
    if (filter === 'upcoming') return upcomingSoon;
    if (filter === 'idle') return inactiveAlerts;
    if (filter === 'price') return priceAlerts;
    return active;
  }, [filter, active, ended, upcomingSoon, inactiveAlerts, priceAlerts]);

  const displayed = useMemo(() => {
    if (!searchQuery.trim()) return baseList;
    const q = searchQuery.toLowerCase();
    return baseList.filter(s => s.name.toLowerCase().includes(q));
  }, [baseList, searchQuery]);

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

  const filterOptions: { id: Filter; icon: string; label: string }[] = [
    { id: 'all', icon: '≡', label: t.filterAll },
    { id: 'upcoming', icon: '⧗', label: t.filterUpcoming },
    { id: 'idle', icon: '⊘', label: t.filterIdle },
    { id: 'price', icon: '△', label: t.filterPrice },
    { id: 'ended', icon: '⊟', label: t.ended },
  ];

  const attentionCount = inactiveAlerts.length + priceAlerts.length;

  return (
    <GestureHandlerRootView style={styles.flex}>
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={toggleThemeMode}
          accessibilityRole="button"
          accessibilityLabel={themeMode === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
        >
          <View style={[styles.themeToggleTrack, { borderColor: theme.border }]}>
            <View style={[
              styles.themeToggleThumb,
              { backgroundColor: theme.text },
              themeMode === 'light' && styles.themeToggleThumbRight,
            ]}>
              <Text style={styles.themeToggleIcon}>
                {themeMode === 'dark' ? '🌙' : '☀️'}
              </Text>
            </View>
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

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.searchIcon, { color: theme.subtext }]}>⌕</Text>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder={t.searchPlaceholder}
          placeholderTextColor={theme.subtext}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {filterOptions.map(option => {
          const isActive = filter === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={styles.filterChip}
              onPress={() => setFilter(option.id)}
              accessibilityLabel={option.label}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.filterChipIcon, { color: isActive ? theme.text : theme.subtext }]}>{option.icon}</Text>
              <Text style={[styles.filterChipText, { color: isActive ? theme.text : theme.subtext }]}>
                {option.label}
              </Text>
              {isActive && <View style={[styles.filterChipDot, { backgroundColor: theme.text }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

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
                onOpenMenu={item.isActive ? openActiveActions : openEndedActions}
                isLast={index === displayed.length - 1}
                rowRef={index === 0 ? (r: any) => registerRef('subscriptionRow', r) : undefined}
              />
            </SwipeableSubscriptionCard>
          );
        }}
        contentContainerStyle={displayed.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyIcon, { color: theme.border }]}>{filter === 'ended' ? '⊟' : '⬡'}</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {filter === 'ended' ? t.noEndedSubscriptions : t.noSubscriptions}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
              {filter === 'ended' ? t.noEndedSubscriptionsHint : t.noSubscriptionsHint}
            </Text>
            {filter !== 'ended' && (
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  themeToggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  themeToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleThumbRight: {
    alignSelf: 'flex-end',
  },
  themeToggleIcon: { fontSize: 12, lineHeight: 14 },
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
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
