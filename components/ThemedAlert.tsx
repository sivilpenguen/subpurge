import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getTheme } from '../constants/theme';
import { useThemeMode } from '../store/ThemeContext';

export interface ThemedAlertAction {
  label: string;
  onPress?: () => void;
  variant?: 'default' | 'primary' | 'destructive';
}

interface ThemedAlertProps {
  visible: boolean;
  title?: string;
  message?: string;
  actions: ThemedAlertAction[];
  onClose: () => void;
  accent?: 'neutral' | 'destructive';
}

export function ThemedAlert({
  visible,
  title,
  message,
  actions,
  onClose,
  accent = 'neutral',
}: ThemedAlertProps) {
  const themeMode = useThemeMode();
  const theme = getTheme(themeMode);
  const borderColor = accent === 'destructive' ? 'rgba(255,59,48,0.85)' : theme.border;
  const glowColor = accent === 'destructive' ? theme.destructive : theme.text;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <Pressable
          style={[
            styles.panel,
            {
              backgroundColor: theme.modalBg,
              borderColor,
              shadowColor: glowColor,
            },
          ]}
          onPress={() => {}}
        >
          {!!title && <Text style={[styles.title, { color: theme.text }]}>{title}</Text>}
          {!!message && <Text style={[styles.message, { color: theme.subtext }]}>{message}</Text>}

          <View style={styles.actions}>
            {actions.map((action, index) => {
              const variant = action.variant ?? 'default';
              const actionStyle = [
                styles.action,
                {
                  borderColor: theme.border,
                  backgroundColor: 'transparent',
                },
                variant === 'destructive' && styles.actionDestructive,
                variant === 'destructive' && { borderColor: 'rgba(255,59,48,0.85)', shadowColor: theme.destructive },
                variant === 'primary' && styles.actionPrimary,
                variant === 'primary' && { borderColor: theme.text, shadowColor: theme.text },
              ];
              const labelStyle = [
                styles.actionLabel,
                { color: theme.subtext },
                variant === 'destructive' && styles.actionLabelDestructive,
                variant === 'destructive' && { color: theme.destructive },
                variant === 'primary' && styles.actionLabelPrimary,
                variant === 'primary' && { color: theme.text },
              ];

              return (
                <TouchableOpacity
                  key={`${action.label}-${index}`}
                  style={actionStyle}
                  activeOpacity={0.8}
                  onPress={() => {
                    onClose();
                    action.onPress?.();
                  }}
                >
                  <Text style={labelStyle}>{action.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  panel: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  actions: {
    marginTop: 18,
    gap: 10,
  },
  action: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionPrimary: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  actionDestructive: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionLabelPrimary: {},
  actionLabelDestructive: {},
});
