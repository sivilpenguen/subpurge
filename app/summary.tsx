import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Svg, Rect, Text as SvgText } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTheme } from '../constants/theme';
import { getSubscriptionAccruedSpent, useStore } from '../store/useSubscriptionStore';
import { getMonthlyEquivalent, getMonthlySpendHistory, getSummaryTotals } from '../utils/subscriptionSummary';

const CHART_HEIGHT = 120;
const LABEL_HEIGHT = 18;
const VALUE_HEIGHT = 14;
const BAR_AREA_HEIGHT = CHART_HEIGHT - LABEL_HEIGHT - VALUE_HEIGHT - 8; // space for labels + values

export default function SummaryScreen() {
  const router = useRouter();
  const { subscriptions, currency, t, themeMode } = useStore();
  const theme = getTheme(themeMode);
  const { width: screenWidth } = useWindowDimensions();
  const { monthlyTotal, dailyCost, yearlyCost, subscriptionCount } = getSummaryTotals(subscriptions);
  const breakdown = [...subscriptions].sort((left, right) => getMonthlyEquivalent(right) - getMonthlyEquivalent(left));
  const trendData = useMemo(() => getMonthlySpendHistory(subscriptions, 6), [subscriptions]);
  const trendMax = useMemo(() => Math.max(...trendData.map(d => d.amount), 1), [trendData]);

  // chart dimensions (card padding 16 each side, screen padding 20 each side)
  const chartWidth = screenWidth - 40 - 32;
  const barCount = trendData.length;
  const colWidth = chartWidth / barCount;
  const barWidth = Math.max(6, colWidth * 0.55);
  const currentIsoMonth = new Date().toISOString().slice(0, 7);

  const cycleLabels = {
    weekly: t.weekly,
    monthly: t.monthly2,
    yearly: t.yearly2,
  } as const;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.headerButtonBg, borderColor: theme.headerButtonBorder }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: theme.headerButtonText }]}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t.priceSummary}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.summaryLabel, { color: theme.subtext }]}>{t.monthlyTotal}</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{currency.symbol}{monthlyTotal.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.summaryLabel, { color: theme.subtext }]}>{t.daily}</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{currency.symbol}{dailyCost.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.summaryLabel, { color: theme.subtext }]}>{t.yearlyCost}</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{currency.symbol}{yearlyCost.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.summaryLabel, { color: theme.subtext }]}>{t.subscriptionCount}</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{subscriptionCount}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.spendTrend}</Text>
        <View style={[styles.trendCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            {trendData.map((month, i) => {
              const isCurrent = month.isoMonth === currentIsoMonth;
              const barH = trendMax > 0 ? Math.max(4, (month.amount / trendMax) * BAR_AREA_HEIGHT) : 4;
              const cx = i * colWidth + colWidth / 2;
              const barX = cx - barWidth / 2;
              const barY = BAR_AREA_HEIGHT - barH + VALUE_HEIGHT + 2;
              const barColor = isCurrent ? theme.text : theme.border;
              const labelColor = isCurrent ? theme.text : theme.subtext;
              const valueLabel = month.amount > 0
                ? `${currency.symbol}${Math.round(month.amount)}`
                : '';

              return (
                <Svg key={month.isoMonth}>
                  {/* value above bar */}
                  <SvgText
                    x={cx}
                    y={barY - 4}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight="600"
                    fill={labelColor}
                  >
                    {valueLabel}
                  </SvgText>

                  {/* bar */}
                  <Rect
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barH}
                    rx={4}
                    fill={barColor}
                  />

                  {/* month label */}
                  <SvgText
                    x={cx}
                    y={CHART_HEIGHT - 2}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={isCurrent ? '700' : '500'}
                    fill={labelColor}
                  >
                    {month.label}
                  </SvgText>
                </Svg>
              );
            })}
          </Svg>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.costBreakdown}</Text>
        {breakdown.map(subscription => (
          <View
            key={subscription.id}
            style={[styles.rowCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <View style={styles.rowTop}>
              <Text style={[styles.rowName, { color: theme.text }]}>{subscription.name}</Text>
              <Text style={[styles.rowValue, { color: theme.text }]}>
                {currency.symbol}{getMonthlyEquivalent(subscription).toFixed(2)}{t.perMonthShort}
              </Text>
            </View>
            <Text style={[styles.rowMeta, { color: theme.subtext }]}>
              {currency.symbol}{subscription.price.toFixed(2)} · {cycleLabels[subscription.billingCycle]}
            </Text>
            <Text style={[styles.rowMeta, { color: theme.subtext }]}>
              {t.totalSpent}: {currency.symbol}{getSubscriptionAccruedSpent(subscription).toFixed(2)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    minWidth: 72,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  backButtonText: { fontSize: 13, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSpacer: { width: 72 },
  content: { padding: 20, paddingBottom: 120 },
  summaryGrid: { gap: 10, marginBottom: 24 },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  summaryLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  summaryValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  trendCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },
  rowCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 6 },
  rowName: { fontSize: 15, fontWeight: '700', flex: 1 },
  rowValue: { fontSize: 14, fontWeight: '700' },
  rowMeta: { fontSize: 12, lineHeight: 18 },
});
