import { DarkTheme, DefaultTheme, ThemeProvider, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { PreferencesProviderWrapper, usePreferences } from '@/hooks/usePreferences';

SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const { activeTheme } = usePreferences();
  const { expoPushToken, notification } = usePushNotifications();
  
  useEffect(() => {
      if (expoPushToken) {
          console.log("Expo Push Token:", expoPushToken);
      }
  }, [expoPushToken]);

  return (
    <ThemeProvider value={activeTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Slot />
    </ThemeProvider>
  );
}

export default function TabLayout() {
  return (
    <PreferencesProviderWrapper>
      <RootLayoutInner />
    </PreferencesProviderWrapper>
  );
}
