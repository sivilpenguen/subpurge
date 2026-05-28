import { Tabs, usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useStore } from '../../store/useSubscriptionStore';
import { getTheme } from '../../constants/theme';

function CustomTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const { t, themeMode } = useStore();
  const theme = getTheme(themeMode);

  const TABS = [
    { name: 'index', label: t.tabSubscriptions, icon: 'creditcard.fill' as const, route: '/' },
    { name: 'explore', label: t.purgeMode, icon: 'flame.fill' as const, route: '/explore' },
    { name: 'settings', label: t.tabSettings, icon: 'gearshape.fill' as const, route: '/settings' },
  ];

  return (
    <View style={[styles.outer, { paddingBottom: insets.bottom || 16 }]}>
      <View style={[styles.pill, { backgroundColor: theme.tabBarBg, borderColor: theme.tabBarBorder }]}>
        {TABS.map(tab => {
          const active = pathname === tab.route || (tab.route === '/' && pathname === '/index');
          return (
            <Pressable
              key={tab.name}
              style={[styles.tabItem, active && styles.tabItemActive, active && { backgroundColor: theme.tabBarActive }]}
              onPress={() => router.navigate(tab.route as any)}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <IconSymbol size={20} name={tab.icon} color={active ? theme.tabLabelActive : theme.tabLabel} />
              <Text style={[styles.label, { color: theme.tabLabel }, active && styles.labelActive, active && { color: theme.tabLabelActive }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={() => <CustomTabBar />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute', bottom: -6, left: 0, right: 0,
    alignItems: 'center', paddingTop: 10, backgroundColor: 'transparent',
  },
  pill: {
    flexDirection: 'row',
    borderRadius: 40,
    borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 8, gap: 4, alignItems: 'center',
  },
  tabItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 32, opacity: 1,
  },
  tabItemActive: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '500', letterSpacing: -0.1 },
  labelActive: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', letterSpacing: -0.2 },
});
