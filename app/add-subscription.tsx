import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatePickerModal } from '../components/form/DatePickerModal';
import { PlanSelector } from '../components/form/PlanSelector';
import { SegmentControl } from '../components/form/SegmentControl';
import { ServicePicker } from '../components/form/ServicePicker';
import { ThemedAlert } from '../components/ThemedAlert';
import { BillingCycle, SERVICE_PRESETS, ServicePreset, ServicePlanTemplate } from '../constants/services';
import { getTheme } from '../constants/theme';
import { useAlertState } from '../hooks/useAlertState';
import { TrackingType, useStore } from '../store/useSubscriptionStore';
import { syncSubscriptionNotificationsAsync } from '../utils/subscriptionNotifications';
import { addBillingCycleToDate, addMonthsToDateValue, compareDateValues, formatDateInput, isCalendarDate, parseDateValue } from '../utils/subscriptionDates';

const CYCLE_KEYS: BillingCycle[] = ['weekly', 'monthly', 'yearly'];
const TRACKING_TYPE_KEYS: TrackingType[] = ['renewal', 'expiry'];
type DatePickerField = 'startDate' | 'trackedDate' | 'reviewReminderDate';

function normalizeExternalUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidExternalUrl(value: string): boolean {
  return /^https?:\/\/[^\s]+\.[^\s]+/i.test(value);
}

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { subscriptions, locale, addSubscription, updateSubscription, toggleActive, themeMode, t } = useStore();
  const theme = getTheme(themeMode);

  const existing = id ? subscriptions.find(s => s.id === id) : null;
  const isEdit = !!existing;
  const today = formatDateInput(new Date());
  const defaultStartDate = existing?.startDate ?? today;
  const defaultCycle = existing?.billingCycle ?? 'monthly';
  const defaultTrackingType = existing?.trackingType ?? 'renewal';
  const matchingPreset = SERVICE_PRESETS.find(service => service.name === existing?.name);
  const presetNames = useMemo(() => new Set(SERVICE_PRESETS.map(s => s.name)), []);

  const [name, setName] = useState(existing?.name ?? '');
  const [price, setPrice] = useState(existing?.price?.toString() ?? '');
  const [cycle, setCycle] = useState<BillingCycle>(defaultCycle);
  const [icon, setIcon] = useState(existing?.icon ?? '◈');
  const [color, setColor] = useState(existing?.color ?? '#6C6C6C');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(existing?.logoUrl);
  const [manageDeepLink, setManageDeepLink] = useState(existing?.manageDeepLink ?? matchingPreset?.manageDeepLink);
  const [purpose, setPurpose] = useState(existing?.purpose ?? '');
  const [quickCancelUrl, setQuickCancelUrl] = useState(existing?.quickCancelUrl ?? matchingPreset?.quickCancelUrl ?? '');
  const [reviewReminderDate, setReviewReminderDate] = useState(existing?.reviewReminderDate ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [trackingType, setTrackingType] = useState<TrackingType>(defaultTrackingType);
  const [nextBillingDate, setNextBillingDate] = useState(
    existing?.nextBillingDate ?? addBillingCycleToDate(defaultStartDate, defaultCycle),
  );
  const [expiryDate, setExpiryDate] = useState(
    existing?.expiryDate ?? addBillingCycleToDate(defaultStartDate, defaultCycle),
  );
  const [showPresets, setShowPresets] = useState(!existing);

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showPresets) { setShowPresets(false); return true; }
      return false;
    });
    return () => handler.remove();
  }, [showPresets]);
  const [targetDateTouched, setTargetDateTouched] = useState(Boolean(existing?.nextBillingDate || existing?.expiryDate));
  const [isCustomService, setIsCustomService] = useState(!!existing && !presetNames.has(existing.name));
  const [quickCancelUrlError, setQuickCancelUrlError] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(() => {
    if (!matchingPreset?.plans?.length || !existing) return null;
    if (existing.planTemplateId) return existing.planTemplateId;
    return matchingPreset.plans.find(p =>
      p.billingCycle === existing.billingCycle && p.price.toFixed(2) === existing.price.toFixed(2),
    )?.id ?? null;
  });
  const [pickerField, setPickerField] = useState<DatePickerField | null>(null);
  const [pickerInitialValue, setPickerInitialValue] = useState(new Date());

  const { alertConfig, closeAlert, showAlert } = useAlertState();

  const selectedPreset = useMemo(() => SERVICE_PRESETS.find(s => s.name === name), [name]);
  const trackedDate = trackingType === 'renewal' ? nextBillingDate : expiryDate;
  const suggestedTrackedDate = isCalendarDate(startDate) ? addBillingCycleToDate(startDate, cycle) : '';
  const suggestedReviewDate = isCalendarDate(trackedDate ?? '') ? addMonthsToDateValue(trackedDate!, 3) : addMonthsToDateValue(today, 3);
  const suggestedReviewDateSoon = isCalendarDate(trackedDate ?? '') ? addMonthsToDateValue(trackedDate!, 1) : addMonthsToDateValue(today, 1);
  const serviceSelected = name.trim().length > 0;

  const cycleOptions = CYCLE_KEYS.map(k => ({ value: k, label: { weekly: t.weekly, monthly: t.monthly2, yearly: t.yearly2 }[k] }));
  const cycleLabels: Record<BillingCycle, string> = { weekly: t.weekly, monthly: t.monthly2, yearly: t.yearly2 };
  const trackingOptions = TRACKING_TYPE_KEYS.map(k => ({ value: k, label: { renewal: t.autoRenewing, expiry: t.fixedTerm }[k] }));

  useEffect(() => {
    if (!isCalendarDate(startDate) || targetDateTouched) return;
    const suggested = addBillingCycleToDate(startDate, cycle);
    if (trackingType === 'renewal') setNextBillingDate(suggested);
    else setExpiryDate(suggested);
  }, [cycle, startDate, targetDateTouched, trackingType]);

  const applyPlanTemplate = (plan: ServicePlanTemplate) => {
    setSelectedPlanId(plan.id);
    setCycle(plan.billingCycle);
    setPrice(plan.price.toString());
  };

  const handlePresetSelect = (preset: ServicePreset) => {
    if (preset.name === 'Diğer') {
      setIsCustomService(true);
      setName('');
      setIcon(preset.icon);
      setColor(preset.color);
      setLogoUrl(undefined);
      setManageDeepLink(undefined);
      setQuickCancelUrl('');
      setSelectedPlanId(null);
    } else {
      setIsCustomService(false);
      setName(preset.name);
      setIcon(preset.icon);
      setColor(preset.color);
      setLogoUrl(preset.logoUrl);
      setManageDeepLink(preset.manageDeepLink);
      setQuickCancelUrl(preset.quickCancelUrl ?? '');
      if (preset.plans?.[0]) applyPlanTemplate(preset.plans[0]);
      else setSelectedPlanId(null);
    }
    setShowPresets(false);
  };

  const openDatePicker = (field: DatePickerField) => {
    const current = field === 'startDate' ? startDate : field === 'trackedDate' ? (trackedDate ?? '') : reviewReminderDate;
    const fallback = field === 'trackedDate' ? (isCalendarDate(startDate) ? startDate : today) : today;
    setPickerField(field);
    setPickerInitialValue(parseDateValue(isCalendarDate(current) ? current : fallback));
  };

  const handleDatePicked = (field: DatePickerField, date: Date) => {
    const value = formatDateInput(date);
    if (field === 'startDate') { setStartDate(value); return; }
    if (field === 'trackedDate') {
      setTargetDateTouched(true);
      if (trackingType === 'renewal') setNextBillingDate(value);
      else setExpiryDate(value);
      return;
    }
    setReviewReminderDate(value);
  };

  const handleSave = () => {
    if (!name.trim()) {
      return showAlert({ message: t.errorNameRequired, actions: [{ label: t.ok, variant: 'primary' }] });
    }

    const parsed = parseFloat(price.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed <= 0) {
      return showAlert({ message: t.errorInvalidPrice, actions: [{ label: t.ok, variant: 'primary' }] });
    }

    if (!isCalendarDate(startDate)) {
      return showAlert({ message: `${t.startDate} ${t.errorInvalidDate}`, actions: [{ label: t.ok, variant: 'primary' }] });
    }

    if (trackingType === 'expiry') {
      if (!trackedDate || !isCalendarDate(trackedDate)) {
        return showAlert({
          message: `${t.endDate} ${t.errorInvalidDate}`,
          actions: [{ label: t.ok, variant: 'primary' }],
        });
      }
      if (compareDateValues(trackedDate, startDate) < 0) {
        return showAlert({ message: t.errorTrackedDateBeforeStart, actions: [{ label: t.ok, variant: 'primary' }] });
      }
    }

    const normalizedQuickCancelUrl = normalizeExternalUrl(quickCancelUrl);
    if (normalizedQuickCancelUrl && !isValidExternalUrl(normalizedQuickCancelUrl)) {
      return showAlert({ message: t.errorInvalidUrl, actions: [{ label: t.ok, variant: 'primary' }] });
    }

    if (reviewReminderDate && !isCalendarDate(reviewReminderDate)) {
      return showAlert({ message: `${t.reviewReminderDate} ${t.errorInvalidDate}`, actions: [{ label: t.ok, variant: 'primary' }] });
    }

    const startDateChanged = existing?.startDate !== startDate;
    const data = {
      name: name.trim(),
      price: parsed,
      billingCycle: cycle,
      icon,
      color,
      logoUrl,
      manageDeepLink,
      planTemplateId: selectedPlanId,
      trackingType,
      nextBillingDate: trackingType === 'renewal' ? trackedDate : null,
      expiryDate: trackingType === 'expiry' ? trackedDate : null,
      currentPeriodStart: startDateChanged ? startDate : existing?.currentPeriodStart ?? startDate,
      completedCyclesCarry: startDateChanged ? 0 : existing?.completedCyclesCarry ?? 0,
      accruedSpentCarry: startDateChanged ? 0 : existing?.accruedSpentCarry ?? 0,
      isActive: existing?.isActive ?? true,
      startDate,
      endedAt: existing?.endedAt ?? null,
      purpose: purpose.trim(),
      quickCancelUrl: normalizedQuickCancelUrl,
      reviewReminderDate: reviewReminderDate || null,
      lastUsedAt: existing?.lastUsedAt ?? today,
      notes: notes.trim(),
    };

    const executeSave = () => {
      if (isEdit) updateSubscription(id!, data);
      else {
        addSubscription(data);
        // İlk abonelik ekleniyorsa bildirim izni iste
        if (subscriptions.length === 0) {
          void syncSubscriptionNotificationsAsync([{ ...data, id: 'temp' } as any], locale, { requestPermissions: true });
        }
      }
      showAlert({
        title: t.saveSuccessTitle,
        message: t.saveSuccessMessage,
        actions: [{ label: t.ok, variant: 'primary', onPress: () => router.back() }],
      });
    };

    if (isEdit) {
      return showAlert({
        title: t.saveConfirmTitle,
        message: t.saveConfirmMessage,
        actions: [{ label: t.cancel }, { label: t.save, variant: 'primary', onPress: executeSave }],
      });
    }

    executeSave();
  };

  const handleDelete = () => {
    showAlert({
      title: t.deleteConfirmTitle,
      message: t.terminateConfirmMessage(name.trim() || existing?.name || ''),
      accent: 'destructive',
      actions: [
        { label: t.cancel },
        { label: t.terminate, variant: 'destructive', onPress: () => { toggleActive(id!); router.back(); } },
      ],
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity style={[styles.backBtn, { borderColor: theme.headerButtonBorder, backgroundColor: theme.headerButtonBg }]} onPress={() => router.back()}>
            <Text style={[styles.backBtnText, { color: theme.headerButtonText }]}>{t.cancelBtn}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{isEdit ? t.editSubscription : t.newSubscription}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ServicePicker
            name={name}
            icon={icon}
            color={color}
            logoUrl={logoUrl}
            isEdit={isEdit}
            isCustomService={isCustomService}
            showPresets={showPresets}
            selectServiceLabel={t.selectService}
            subscriptionNameLabel={t.subscriptionName}
            subscriptionNamePlaceholder={t.subscriptionNamePlaceholder}
            theme={theme}
            onTogglePresets={() => setShowPresets(v => !v)}
            onPresetSelect={handlePresetSelect}
            onCustomNameChange={setName}
          />

          {!showPresets && serviceSelected && (
            <>
              <Text style={[styles.label, { color: theme.subtext }]}>{t.billingCycle}</Text>
              <SegmentControl
                options={cycleOptions}
                value={cycle}
                onChange={v => {
                  setCycle(v);
                  const matchingPlan = selectedPreset?.plans?.find(p => p.billingCycle === v);
                  if (matchingPlan) {
                    setSelectedPlanId(matchingPlan.id);
                    setPrice(matchingPlan.price.toString());
                  } else {
                    setSelectedPlanId(null);
                  }
                }}
                theme={theme}
              />

              {!!selectedPreset?.plans?.length && (
                <PlanSelector
                  plans={selectedPreset.plans.filter(p => p.billingCycle === cycle)}
                  selectedPlanId={selectedPlanId}
                  cycleLabels={cycleLabels}
                  theme={theme}
                  onSelect={applyPlanTemplate}
                  onClearPlan={() => setSelectedPlanId(null)}
                  label={t.planTemplates}
                  customLabel={t.customPrice}
                />
              )}

              <Text style={[styles.label, { color: theme.subtext }]}>{t.trackingType}</Text>
              <SegmentControl
                options={trackingOptions}
                value={trackingType}
                onChange={v => { setTrackingType(v); setTargetDateTouched(false); }}
                theme={theme}
              />

              <Text style={[styles.label, { color: theme.subtext }]}>{t.price}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                value={price}
                onChangeText={v => { setSelectedPlanId(null); setPrice(v); }}
                placeholder={t.pricePlaceholder}
                placeholderTextColor={theme.subtext}
                keyboardType="decimal-pad"
                selectionColor={theme.text}
              />

              <Text style={[styles.label, { color: theme.subtext }]}>{t.startDate}</Text>
              <TouchableOpacity style={[styles.dateField, { backgroundColor: theme.input, borderColor: theme.border }]} onPress={() => openDatePicker('startDate')}>
                <Text style={[styles.dateFieldText, { color: theme.text }]}>{startDate || t.dateFormatHint}</Text>
                <Text style={[styles.dateFieldIcon, { color: theme.subtext }]}>📅</Text>
              </TouchableOpacity>
              <View style={styles.helperRow}>
                <TouchableOpacity style={[styles.helperChip, { borderColor: theme.border, backgroundColor: theme.card }]} onPress={() => setStartDate(today)}>
                  <Text style={[styles.helperChipText, { color: theme.text }]}>{t.today}</Text>
                </TouchableOpacity>
                <Text style={[styles.helperText, { color: theme.subtext }]}>{t.dateFormatHint}</Text>
              </View>

              {trackingType === 'expiry' && (
                <>
                  <Text style={[styles.label, { color: theme.subtext }]}>{t.endDate}</Text>
                  <TouchableOpacity style={[styles.dateField, { backgroundColor: theme.input, borderColor: theme.border }]} onPress={() => openDatePicker('trackedDate')}>
                    <Text style={[styles.dateFieldText, { color: theme.text }]}>{trackedDate || t.dateFormatHint}</Text>
                    <Text style={[styles.dateFieldIcon, { color: theme.subtext }]}>📅</Text>
                  </TouchableOpacity>
                  <View style={styles.helperRow}>
                    <TouchableOpacity style={[styles.helperChip, { borderColor: theme.border, backgroundColor: theme.card }]} onPress={() => {
                      if (!suggestedTrackedDate) return;
                      setTargetDateTouched(true);
                      setExpiryDate(suggestedTrackedDate);
                    }}>
                      <Text style={[styles.helperChipText, { color: theme.text }]}>{t.suggestedDate}</Text>
                    </TouchableOpacity>
                    {!!suggestedTrackedDate && <Text style={[styles.helperText, { color: theme.subtext }]}>{suggestedTrackedDate}</Text>}
                  </View>
                </>
              )}

              {isEdit && (
                <>
                  <Text style={[styles.label, { color: theme.subtext }]}>{t.whyPaying}</Text>
                  <TextInput
                    style={[styles.input, styles.multilineInput, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                    value={purpose}
                    onChangeText={setPurpose}
                    placeholder={t.whyPayingPlaceholder}
                    placeholderTextColor={theme.subtext}
                    multiline
                    selectionColor={theme.text}
                  />

                  <Text style={[styles.label, { color: theme.subtext }]}>{t.quickCancelUrl}</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.input,
                        borderColor: quickCancelUrlError ? theme.destructive : theme.border,
                        color: theme.text,
                      },
                    ]}
                    value={quickCancelUrl}
                    onChangeText={v => { setQuickCancelUrl(v); if (quickCancelUrlError) setQuickCancelUrlError(''); }}
                    onBlur={() => {
                      const normalized = normalizeExternalUrl(quickCancelUrl);
                      if (normalized && !isValidExternalUrl(normalized)) {
                        setQuickCancelUrlError(t.errorInvalidUrl);
                      } else {
                        setQuickCancelUrlError('');
                      }
                    }}
                    placeholder={t.quickCancelUrlPlaceholder}
                    placeholderTextColor={theme.subtext}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    selectionColor={theme.text}
                  />
                  {!!quickCancelUrlError && (
                    <Text style={[styles.fieldError, { color: theme.destructive }]}>{quickCancelUrlError}</Text>
                  )}

                  <Text style={[styles.label, { color: theme.subtext }]}>{t.reviewReminderDate}</Text>
                  <TouchableOpacity style={[styles.dateField, { backgroundColor: theme.input, borderColor: theme.border }]} onPress={() => openDatePicker('reviewReminderDate')}>
                    <Text style={[styles.dateFieldText, { color: theme.text }]}>{reviewReminderDate || t.dateFormatHint}</Text>
                    <Text style={[styles.dateFieldIcon, { color: theme.subtext }]}>📅</Text>
                  </TouchableOpacity>
                  <View style={styles.helperRow}>
                    <TouchableOpacity style={[styles.helperChip, { borderColor: theme.border, backgroundColor: theme.card }]} onPress={() => setReviewReminderDate(suggestedReviewDateSoon)}>
                      <Text style={[styles.helperChipText, { color: theme.text }]}>{t.remindMeIn1Month}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.helperChip, { borderColor: theme.border, backgroundColor: theme.card }]} onPress={() => setReviewReminderDate(suggestedReviewDate)}>
                      <Text style={[styles.helperChipText, { color: theme.text }]}>{t.remindMeIn3Months}</Text>
                    </TouchableOpacity>
                    {!!suggestedReviewDate && <Text style={[styles.helperText, { color: theme.subtext }]}>{suggestedReviewDate}</Text>}
                  </View>

                  <Text style={[styles.label, { color: theme.subtext }]}>{t.notes}</Text>
                  <TextInput
                    style={[styles.input, styles.multilineInput, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder={t.notesPlaceholder}
                    placeholderTextColor={theme.subtext}
                    multiline
                    selectionColor={theme.text}
                  />
                </>
              )}

              <View style={styles.btnRow}>
                {isEdit && (
                  <TouchableOpacity style={[styles.deleteBtn, { borderColor: theme.destructive }]} onPress={handleDelete}>
                    <Text style={[styles.deleteBtnText, { color: theme.destructive }]}>{t.terminate}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.saveBtn, { borderColor: theme.text, backgroundColor: theme.headerButtonBg }]} onPress={handleSave}>
                  <Text style={[styles.saveBtnText, { color: theme.headerButtonText }]}>{t.save}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <ThemedAlert
        visible={!!alertConfig}
        title={alertConfig?.title}
        message={alertConfig?.message}
        actions={alertConfig?.actions ?? []}
        accent={alertConfig?.accent}
        onClose={closeAlert}
      />

      <DatePickerModal
        visible={!!pickerField}
        value={pickerInitialValue}
        minimumDate={pickerField === 'trackedDate' && isCalendarDate(startDate) ? parseDateValue(startDate) : undefined}
        cancelLabel={t.cancel}
        okLabel={t.ok}
        theme={theme}
        onChange={date => {
          if (pickerField) handleDatePicked(pickerField, date);
        }}
        onDismiss={() => setPickerField(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  headerSpacer: { width: 40 },
  backBtn: { minWidth: 52, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.1 },
  content: { padding: 20, paddingBottom: 48 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  input: { borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12, borderWidth: 1 },
  multilineInput: { height: 80, textAlignVertical: 'top' },
  dateField: { minHeight: 52, borderRadius: 12, paddingHorizontal: 14, marginBottom: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateFieldText: { fontSize: 15, fontWeight: '500' },
  dateFieldIcon: { fontSize: 16 },
  helperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -4, marginBottom: 20, gap: 12 },
  helperChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1 },
  helperChipText: { fontSize: 12, fontWeight: '600' },
  helperText: { fontSize: 12, flex: 1, textAlign: 'right' },
  fieldError: { fontSize: 12, fontWeight: '500', marginTop: -8, marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 40, marginBottom: 10 },
  deleteBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { fontSize: 13, fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
});
