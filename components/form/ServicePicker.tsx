import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
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
  const [query, setQuery] = useState('');
  const serviceSelected = name.trim().length > 0;

  const suggestions = query.trim().length > 0
    ? SERVICE_PRESETS.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleSelect = (preset: ServicePreset) => {
    setQuery('');
    onPresetSelect(preset);
    if (showPresets) onTogglePresets();
  };

  if (isEdit) {
    return (
      <View style={[styles.selectedRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <ServiceLogo logoUrl={logoUrl} icon={icon} color={color} size={32} serviceName={name} />
        <Text style={[styles.selectedName, { color: theme.text }]}>{name}</Text>
      </View>
    );
  }

  return (
    <>
      {serviceSelected && !showPresets && !isCustomService ? (
        <TouchableOpacity
          style={[styles.selectedRow, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={onTogglePresets}
          activeOpacity={0.7}
        >
          <ServiceLogo logoUrl={logoUrl} icon={icon} color={color} size={32} serviceName={name} />
          <Text style={[styles.selectedName, { color: theme.text }]}>{name}</Text>
          <Text style={[styles.changeBtn, { color: theme.subtext }]}>↺</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.searchWrap}>
          <Text style={[styles.searchIcon, { color: theme.subtext }]}>⌕</Text>
          <TextInput
            style={[styles.searchInput, { backgroundColor: theme.card, borderColor: showPresets ? theme.text : theme.border, color: theme.text }]}
            value={query}
            onChangeText={setQuery}
            onFocus={() => { if (!showPresets) onTogglePresets(); }}
            placeholder={selectServiceLabel}
            placeholderTextColor={theme.subtext}
            selectionColor={theme.text}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => setQuery('')}>
              <Text style={{ color: theme.subtext, fontSize: 16 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {showPresets && !serviceSelected && suggestions.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {suggestions.slice(0, 6).map((preset, i) => (
            <TouchableOpacity
              key={preset.name}
              style={[
                styles.dropdownItem,
                i < suggestions.slice(0, 6).length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
              ]}
              onPress={() => handleSelect(preset)}
              activeOpacity={0.7}
            >
              <ServiceLogo logoUrl={preset.logoUrl} icon={preset.icon} color={preset.color} size={28} serviceName={preset.name} />
              <Text style={[styles.dropdownName, { color: theme.text }]}>{preset.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showPresets && !serviceSelected && query.length === 0 && (
        <View style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {SERVICE_PRESETS.slice(0, 8).map((preset, i) => (
            <TouchableOpacity
              key={preset.name}
              style={[
                styles.dropdownItem,
                i < Math.min(SERVICE_PRESETS.length, 8) - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
              ]}
              onPress={() => handleSelect(preset)}
              activeOpacity={0.7}
            >
              <ServiceLogo logoUrl={preset.logoUrl} icon={preset.icon} color={preset.color} size={28} serviceName={preset.name} />
              <Text style={[styles.dropdownName, { color: theme.text }]}>{preset.name}</Text>
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
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  selectedName: { fontSize: 15, fontWeight: '600', flex: 1 },
  changeBtn: { fontSize: 20 },
  searchWrap: { position: 'relative', marginBottom: 8 },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    textAlignVertical: 'center',
    fontSize: 18,
    zIndex: 1,
    lineHeight: 52,
  },
  searchInput: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 15,
    borderWidth: 1,
  },
  clearBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  dropdown: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dropdownName: { fontSize: 15, fontWeight: '500' },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  input: { borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12, borderWidth: 1 },
});
