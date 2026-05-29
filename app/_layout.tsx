import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-reanimated';
import { StoreContext, useStore, useSubscriptionStore } from '../store/useSubscriptionStore';
import { ThemeContext } from '../store/ThemeContext';
import { getTheme } from '../constants/theme';
import { syncSubscriptionNotificationsAsync } from '../utils/subscriptionNotifications';
import { CoachMarksProvider, useCoachMarks } from '../components/CoachMarks';

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

const SCREEN_WIDTH = Dimensions.get('window').width;

const SLIDES = [
  {
    icon: '⧗',
    title: 'Aboneliklerini takip et',
    subtitle: 'Tüm aboneliklerini tek bir yerde gör. Yenileme tarihlerini, ödeme tutarlarını ve döngüleri takip et.',
  },
  {
    icon: '⊘',
    title: 'Gereksizleri keşfet',
    subtitle: 'Kullanmadığın, zamlanmış ya da süresi dolmak üzere olan abonelikleri Purge Mode ile bul.',
  },
  {
    icon: '◎',
    title: 'Kontrolü geri al',
    subtitle: 'Aylık harcamanı net gör, aksiyon al ve gereksiz ödemelerden kurtul.',
  },
];

function OnboardingModal() {
  const { hasOnboarded, setOnboarded, loadDemoSubscriptions, themeMode } = useStore();
  const { startTour } = useCoachMarks();
  const theme = getTheme(themeMode);
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  if (hasOnboarded) return null;

  const isLast = index === SLIDES.length - 1;

  const goNext = () => {
    if (isLast) { setOnboarded(); return; }
    const next = index + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  };

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={[onboardingStyles.screen, { backgroundColor: theme.bg }]}>
        {/* Logo */}
        <View style={onboardingStyles.logoWrap}>
          <Image source={require('../assets/images/icon.png')} style={onboardingStyles.logo} resizeMode="contain" />
        </View>

        {/* Slides */}
        <FlatList
          ref={listRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={[onboardingStyles.slide, { width: SCREEN_WIDTH }]}>
              <Text style={onboardingStyles.slideIcon}>{item.icon}</Text>
              <Text style={[onboardingStyles.slideTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[onboardingStyles.slideSubtitle, { color: theme.subtext }]}>{item.subtitle}</Text>
            </View>
          )}
        />

        {/* Dots */}
        <View style={onboardingStyles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[onboardingStyles.dot, { backgroundColor: i === index ? theme.text : theme.border }]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={onboardingStyles.bottom}>
          {isLast ? (
            <>
              <TouchableOpacity
                style={[onboardingStyles.ctaBtn, { backgroundColor: theme.text }]}
                onPress={() => { setOnboarded(); setTimeout(startTour, 400); }}
                accessibilityRole="button"
              >
                <Text style={[onboardingStyles.ctaText, { color: theme.bg }]}>Başla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[onboardingStyles.demoBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => { loadDemoSubscriptions(); setOnboarded(); setTimeout(startTour, 400); }}
                accessibilityRole="button"
              >
                <Text style={[onboardingStyles.demoBtnIcon]}>⬡</Text>
                <Text style={[onboardingStyles.demoBtnText, { color: theme.text }]}>Demo verisi ile dene</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[onboardingStyles.ctaBtn, { backgroundColor: theme.text }]}
              onPress={goNext}
              accessibilityRole="button"
            >
              <Text style={[onboardingStyles.ctaText, { color: theme.bg }]}>Devam</Text>
            </TouchableOpacity>
          )}
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
      <CoachMarksProvider>
        <NotificationSync />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add-subscription" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
        <OnboardingModal />
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      </CoachMarksProvider>
    </ThemeContext.Provider>
  );
}

const onboardingStyles = StyleSheet.create({
  screen: { flex: 1, paddingBottom: 50 },
  logoWrap: { alignItems: 'center', paddingTop: 80, paddingBottom: 20 },
  logo: { width: 80, height: 80 },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 14 },
  slideIcon: { fontSize: 48 },
  slideTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  slideSubtitle: { fontSize: 15, lineHeight: 24, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 24 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  bottom: { paddingHorizontal: 32, gap: 14, alignItems: 'center' },
  ctaBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  ctaText: { fontSize: 16, fontWeight: '700' },
  demoBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 16,
    borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  demoBtnIcon: { fontSize: 18 },
  demoBtnText: { fontSize: 15, fontWeight: '600' },
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
