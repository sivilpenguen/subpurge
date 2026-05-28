import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTheme } from '../../constants/theme';

interface Props {
  visible: boolean;
  value: Date;
  minimumDate?: Date;
  cancelLabel: string;
  okLabel: string;
  theme: AppTheme;
  onChange: (date: Date) => void;
  onDismiss: () => void;
}

export function DatePickerModal({ visible, value, minimumDate, cancelLabel, okLabel, theme, onChange, onDismiss }: Props) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const handleNativeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      onDismiss();
      if (event.type === 'set' && selectedDate) onChange(selectedDate);
    } else if (selectedDate) {
      setDraft(selectedDate);
    }
  };

  if (!visible) return null;

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={draft}
        mode="date"
        display="default"
        onChange={handleNativeChange}
        minimumDate={minimumDate}
      />
    );
  }

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onDismiss}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: theme.modalBg, borderColor: theme.border }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onDismiss}>
              <Text style={[styles.headerBtn, { color: theme.subtext }]}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onChange(draft); onDismiss(); }}>
              <Text style={[styles.headerBtn, { color: theme.accent }]}>{okLabel}</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={draft}
            mode="date"
            display="spinner"
            onChange={handleNativeChange}
            minimumDate={minimumDate}
            themeVariant={theme.mode}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  headerBtn: { fontSize: 16, fontWeight: '600', paddingVertical: 8 },
});
