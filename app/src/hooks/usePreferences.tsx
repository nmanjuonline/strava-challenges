import { useState, useEffect, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

type ThemePreference = 'system' | 'light' | 'dark';

type PreferencesContextType = {
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  activeTheme: 'light' | 'dark';
  activeOnly: boolean;
  setActiveOnly: (val: boolean) => void;
};

export const PreferencesContext = createContext<PreferencesContextType>({
  themePreference: 'system',
  setThemePreference: () => {},
  activeTheme: 'dark',
  activeOnly: false,
  setActiveOnly: () => {},
});

export function usePreferences() {
  return useContext(PreferencesContext);
}

export function PreferencesProviderWrapper({ children }: { children: React.ReactNode }) {
  const deviceTheme = useDeviceColorScheme() ?? 'dark';
  const [themePreference, setPref] = useState<ThemePreference>('system');
  const [activeOnly, setActive] = useState<boolean>(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('themePreference'),
      AsyncStorage.getItem('activeOnly')
    ]).then(([savedTheme, savedActiveOnly]) => {
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        setPref(savedTheme as ThemePreference);
      }
      if (savedActiveOnly === 'true') {
        setActive(true);
      }
      setIsReady(true);
    });
  }, []);

  const setThemePreference = (pref: ThemePreference) => {
    setPref(pref);
    AsyncStorage.setItem('themePreference', pref);
  };

  const setActiveOnly = (val: boolean) => {
    setActive(val);
    AsyncStorage.setItem('activeOnly', val ? 'true' : 'false');
  }

  const activeTheme = themePreference === 'system' ? deviceTheme : themePreference;

  if (!isReady) return null;

  return (
    <PreferencesContext.Provider value={{ themePreference, setThemePreference, activeTheme, activeOnly, setActiveOnly }}>
      {children}
    </PreferencesContext.Provider>
  );
}
