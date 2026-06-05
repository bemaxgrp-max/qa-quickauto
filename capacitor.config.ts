import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quickauto.app',
  appName: 'QUICK AUTO',
  webDir: 'dist',
  ios: {
    swipeNavigationEnabled: true
  }
};

export default config;
