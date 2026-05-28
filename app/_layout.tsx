import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-reanimated';
import { StoreContext, useStore, useSubscriptionStore } from '../store/useSubscriptionStore';
import { ThemeContext } from '../store/ThemeContext';
import { getTheme } from '../constants/theme';
import { syncSubscriptionNotificationsAsync } from '../utils/subscriptionNotifications';

function StoreProvider({ children }: { children: React.ReactNode }) {
  const store = useSubscriptionStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

function NotificationSync() {
  const { subscriptions, locale } = useStore();

  useEffect(() => {
    void syncSubscriptionNotificationsAsync(subscriptions, locale, { requestPermissions: false });
  }, [locale, subscriptions]);

  return null;
}

function OnboardingModal() {
  const { hasOnboarded, setOnboarded, loadDemoSubscriptions, t, themeMode } = useStore();
  const theme = getTheme(themeMode);

  if (hasOnboarded) return null;

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent>
      <View style={[onboardingStyles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[onboardingStyles.panel, { backgroundColor: theme.modalBg, borderColor: theme.border }]}>
          <Text style={[onboardingStyles.emoji]}>📋</Text>
          <Text style={[onboardingStyles.title, { color: theme.text }]}>{t.onboardingTitle}</Text>
          <Text style={[onboardingStyles.subtitle, { color: theme.subtext }]}>{t.onboardingSubtitle}</Text>
          <TouchableOpacity
            style={[onboardingStyles.ctaBtn, { borderColor: theme.text, backgroundColor: theme.headerButtonBg }]}
            onPress={setOnboarded}
            accessibilityRole="button"
          >
            <Text style={[onboardingStyles.ctaText, { color: theme.headerButtonText }]}>{t.onboardingCta}</Text>
          </TouchableOpacity>
          <Pressable
            style={onboardingStyles.demoBtn}
            onPress={() => { loadDemoSubscriptions(); setOnboarded(); }}
            accessibilityRole="button"
          >
            <Text style={[onboardingStyles.demoBtnText, { color: theme.subtext }]}>{t.onboardingDemoBtn}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function AppShell() {
  const { themeMode } = useStore();
  const theme = getTheme(themeMode);

  return (
    <ThemeContext.Provider value={themeMode}>
      <NotificationSync />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-subscription" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <OnboardingModal />
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
    </ThemeContext.Provider>
  );
}

const onboardingStyles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  panel: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 28,
    alignItems: 'center',
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 28 },
  ctaBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaText: { fontSize: 15, fontWeight: '700' },
  demoBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  demoBtnText: { fontSize: 13, fontWeight: '600' },
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
