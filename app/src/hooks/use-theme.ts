/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { usePreferences } from '@/hooks/usePreferences';

export function useTheme() {
  const { activeTheme } = usePreferences();
  return Colors[activeTheme];
}
