import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { ServiceLogo } from '../ServiceLogo';
import { SERVICE_CATEGORIES, SERVICE_PRESETS, ServiceCategory, ServicePreset } from '../../constants/services';
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

  const grouped = SERVICE_CATEGORIES.map(cat => ({
    ...cat,
    items: SERVICE_PRESETS.filter(p => (p.category ?? 'other') === cat.id && p.name !== 'Diğer'),
  })).filter(g => g.items.length > 0);

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

      {/* Arama sonuçları */}
      {showPresets && query.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {suggestions.length === 0 ? (
            <Text style={[styles.noResult, { color: theme.subtext }]}>Sonuç bulunamadı</Text>
          ) : suggestions.slice(0, 8).map((preset, i) => (
            <TouchableOpacity
              key={preset.name}
              style={[
                styles.dropdownItem,
                i < suggestions.slice(0, 8).length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
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

      {/* Kategorili liste */}
      {showPresets && query.length === 0 && (
        <ScrollView
          style={styles.categoryScroll}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {grouped.map(cat => (
            <View key={cat.id} style={styles.categoryGroup}>
              <Text style={[styles.categoryLabel, { color: theme.subtext }]}>{cat.label}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.hStrip}
              >
                {/* Çift satırlı sütunlar: her sütunda en fazla 2 item */}
                {Array.from({ length: Math.ceil(cat.items.length / 2) }).map((_, colIdx) => {
                  const top = cat.items[colIdx * 2];
                  const bottom = cat.items[colIdx * 2 + 1];
                  return (
                    <View key={colIdx} style={styles.hCol}>
                      {[top, bottom].map((preset, rowIdx) => {
                        if (!preset) return <View key={rowIdx} style={styles.gridItemEmpty} />;
                        const selected = name === preset.name;
                        return (
                          <TouchableOpacity
                            key={preset.name}
                            style={[
                              styles.gridItem,
                              { backgroundColor: theme.card, borderColor: theme.border },
                              selected && { backgroundColor: `${preset.color}18`, borderColor: preset.color },
                            ]}
                            onPress={() => handleSelect(preset)}
                            activeOpacity={0.7}
                          >
                            <ServiceLogo logoUrl={preset.logoUrl} icon={preset.icon} color={preset.color} size={26} serviceName={preset.name} />
                            <Text style={[styles.gridName, { color: theme.text }]} numberOfLines={1}>{preset.name}</Text>
                            {selected && <Text style={{ color: preset.color, fontSize: 12 }}>✓</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
                {/* Peek: sağda yarım boşluk */}
                <View style={styles.peekSpacer} />
              </ScrollView>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.customBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => handleSelect({ name: 'Diğer', color: '#6C6C6C', icon: '⊕' })}
            activeOpacity={0.7}
          >
            <Text style={[styles.customBtnIcon, { color: theme.subtext }]}>⊕</Text>
            <Text style={[styles.customBtnText, { color: theme.text }]}>Diğer — Kendin ekle</Text>
          </TouchableOpacity>
          <View style={{ height: 20 }} />
        </ScrollView>
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
    marginBottom: 8,
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
  noResult: { padding: 16, textAlign: 'center', fontSize: 14 },
  categoryScroll: { maxHeight: 400, marginBottom: 8, marginTop: 32 },
  categoryGroup: { marginBottom: 16 },
  categoryLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6, paddingHorizontal: 2 },
  hStrip: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  hCol: { flexDirection: 'column', gap: 8, width: 160 },
  gridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: 160,
  },
  gridItemEmpty: { width: 160, height: 0 },
  peekSpacer: { width: 24 },
  customBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  customBtnIcon: { fontSize: 18 },
  customBtnText: { fontSize: 14, fontWeight: '500' },
  gridName: { fontSize: 13, fontWeight: '500', flex: 1 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  input: { borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12, borderWidth: 1 },
});
