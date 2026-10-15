import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ultramagnus.umps',
  appName: 'PipMint',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    backgroundColor: '#0a0c0e',
  },
  server: {
    androidScheme: 'https',
  },
}

export default config
