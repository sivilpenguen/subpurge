import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ServiceLogo } from '../ServiceLogo';
import { SERVICE_PRESETS, ServicePreset } from '../../constants/services';
import { AppTheme } from '../../constants/theme';

interface Props {
  name: string;
  icon: string;
  color: string;
  logoUrl?: string;
  isEdit: boolean;
  isCustomService: boolean;
  showPresets: boolean;
  selectServiceLabel: string;
  subscriptionNameLabel: string;
  subscriptionNamePlaceholder: string;
  theme: AppTheme;
  onTogglePresets: () => void;
  onPresetSelect: (preset: ServicePreset) => void;
  onCustomNameChange: (name: string) => void;
}

export function ServicePicker({
  name,
  icon,
  color,
  logoUrl,
  isEdit,
  isCustomService,
  showPresets,
  selectServiceLabel,
  subscriptionNameLabel,
  subscriptionNamePlaceholder,
  theme,
  onTogglePresets,
  onPresetSelect,
  onCustomNameChange,
}: Props) {
  const serviceSelected = name.trim().length > 0;

  return (
    <>
      <TouchableOpacity
        style={[styles.toggle, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => !isEdit && onTogglePresets()}
        activeOpacity={isEdit ? 1 : 0.7}
      >
        <ServiceLogo logoUrl={logoUrl} icon={icon} color={color} size={36} serviceName={name} />
        <Text style={[styles.toggleText, { color: theme.text }]}>{serviceSelected ? name : selectServiceLabel}</Text>
        {!isEdit && <Text style={[styles.chevron, { color: theme.subtext }]}>{showPresets ? '▲' : '▼'}</Text>}
      </TouchableOpacity>

      {showPresets && !isEdit && (
        <View style={styles.grid}>
          {SERVICE_PRESETS.map(preset => (
            <TouchableOpacity
              key={preset.name}
              style={[
                styles.gridItem,
                { backgroundColor: theme.card, borderColor: theme.border },
                name === preset.name && { borderColor: preset.color, borderWidth: 2 },
              ]}
              onPress={() => onPresetSelect(preset)}
            >
              <ServiceLogo logoUrl={preset.logoUrl} icon={preset.icon} color={preset.color} size={38} serviceName={preset.name} />
              <Text style={[styles.presetName, { color: theme.subtext }]} numberOfLines={1}>{preset.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isCustomService && (
        <>
          <Text style={[styles.label, { color: theme.subtext }]}>{subscriptionNameLabel}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
            value={name}
            onChangeText={onCustomNameChange}
            placeholder={subscriptionNamePlaceholder}
            placeholderTextColor={theme.subtext}
            selectionColor={theme.text}
          />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
  },
  toggleText: { fontSize: 14, flex: 1, fontWeight: '500' },
  chevron: { fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  gridItem: {
    width: '22%',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  presetName: { fontSize: 9, textAlign: 'center' },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  input: { borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12, borderWidth: 1 },
});
