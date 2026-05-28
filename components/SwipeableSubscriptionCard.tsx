/**
 * SwipeableSubscriptionCard
 *
 * Wraps CompactSubscriptionCard content with react-native-gesture-handler
 * swipe actions:
 *   ← swipe left  → destructive action (Terminate / Delete)
 *   → swipe right → positive action (Mark used / Reactivate)
 */
import { Swipeable } from 'react-native-gesture-handler';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { AppTheme } from '../constants/theme';

interface Props {
  children: React.ReactNode;
  theme: AppTheme;
  isActive: boolean;
  /** swipe-right label & handler */
  rightActionLabel: string;
  onRightAction: () => void;
  /** swipe-left label & handler */
  leftActionLabel: string;
  onLeftAction: () => void;
}

export function SwipeableSubscriptionCard({
  children,
  theme,
  isActive,
  rightActionLabel,
  onRightAction,
  leftActionLabel,
  onLeftAction,
}: Props) {
  const renderRightActions = () => (
    <TouchableOpacity
      style={[
        styles.swipeAction,
        styles.swipeRight,
        { backgroundColor: isActive ? '#34C759' : '#007AFF' },
      ]}
      onPress={onRightAction}
      accessibilityRole="button"
      accessibilityLabel={rightActionLabel}
    >
      <Text style={styles.swipeActionText}>{rightActionLabel}</Text>
    </TouchableOpacity>
  );

  const renderLeftActions = () => (
    <TouchableOpacity
      style={[styles.swipeAction, styles.swipeLeft, { backgroundColor: theme.destructive }]}
      onPress={onLeftAction}
      accessibilityRole="button"
      accessibilityLabel={leftActionLabel}
    >
      <Text style={styles.swipeActionText}>{leftActionLabel}</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      overshootRight={false}
      overshootLeft={false}
      friction={2}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    borderRadius: 18,
    marginVertical: 0,
  },
  swipeRight: { marginRight: 4 },
  swipeLeft: { marginLeft: 4 },
  swipeActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
