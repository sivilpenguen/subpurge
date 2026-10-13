import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rakuappdigital.subpurge',
  appName: 'Subpurge',
  webDir: 'dist',
  backgroundColor: '#0E0E0C',
  ios: {
    contentInset: 'never',
    backgroundColor: '#0E0E0C',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0E0E0C',
      showSpinner: false,
    },
    LocalNotifications: {
      presentationOptions: ['banner', 'list', 'sound'],
    },
  },
};

export default config;
