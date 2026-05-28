import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ServicePlanTemplate } from '../../constants/services';
import { AppTheme } from '../../constants/theme';

interface Props {
  plans: ServicePlanTemplate[];
  selectedPlanId: string | null;
  cycleLabels: Record<string, string>;
  theme: AppTheme;
  onSelect: (plan: ServicePlanTemplate) => void;
  onClearPlan: () => void;
  label: string;
  customLabel: string;
}

export function PlanSelector({ plans, selectedPlanId, cycleLabels, theme, onSelect, onClearPlan, label, customLabel }: Props) {
  const isCustom = selectedPlanId === null;
  return (
    <>
      <Text style={[styles.label, { color: theme.subtext }]}>{label}</Text>
      <View style={styles.grid}>
        {plans.map(plan => {
          const active = selectedPlanId === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
                active && { borderColor: theme.text, backgroundColor: theme.cardStrong },
              ]}
              onPress={() => onSelect(plan)}
            >
              <Text style={[styles.planName, { color: theme.text }]}>{plan.name}</Text>
              <Text style={[styles.planMeta, { color: active ? theme.text : theme.subtext }]}>
                {plan.price.toFixed(2)} · {cycleLabels[plan.billingCycle]}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
            isCustom && { borderColor: theme.text, backgroundColor: theme.cardStrong },
          ]}
          onPress={onClearPlan}
        >
          <Text style={[styles.planName, { color: theme.text }]}>{customLabel}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  grid: { gap: 10, marginBottom: 20 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14 },
  planName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  planMeta: { fontSize: 12 },
});
