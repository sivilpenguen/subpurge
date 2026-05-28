import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTheme } from '../../constants/theme';

interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  theme: AppTheme;
}

export function SegmentControl<T extends string>({ options, value, onChange, theme }: Props<T>) {
  const activeStyle = theme.mode === 'light'
    ? { backgroundColor: 'rgba(255,69,58,0.12)', borderColor: 'rgba(255,69,58,0.28)' }
    : { backgroundColor: theme.text, borderColor: theme.text };
  const activeTextStyle = theme.mode === 'light'
    ? { color: theme.accent }
    : { color: theme.bg };

  return (
    <View style={styles.row}>
      {options.map(option => {
        const active = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.btn, { borderColor: theme.border, backgroundColor: theme.card }, active && activeStyle]}
            onPress={() => onChange(option.value)}
            accessibilityLabel={option.label}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.btnText, { color: theme.text }, active && activeTextStyle]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  btnText: { fontSize: 14, fontWeight: '500' },
});
