import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cantinamaster.app',
  appName: 'Cantina Master',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
