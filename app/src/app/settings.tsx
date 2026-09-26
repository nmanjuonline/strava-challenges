import { StyleSheet, View, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePreferences } from '@/hooks/usePreferences';

export default function SettingsScreen() {
  const router = useRouter();
  const { themePreference, setThemePreference, activeOnly, setActiveOnly } = usePreferences();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backText}>← Back</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Settings</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Feed Preferences</ThemedText>
          
          <View style={styles.row}>
            <ThemedText>Show Active Challenges Only</ThemedText>
            <Switch
              value={activeOnly}
              onValueChange={setActiveOnly}
              trackColor={{ true: '#fc5200', false: 'rgba(150, 150, 150, 0.5)' }}
              thumbColor={'#ffffff'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Theme</ThemedText>
          
          <TouchableOpacity 
            style={styles.row} 
            onPress={() => setThemePreference('system')}
          >
            <ThemedText>System Default</ThemedText>
            {themePreference === 'system' && <ThemedText style={styles.check}>✓</ThemedText>}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.row} 
            onPress={() => setThemePreference('light')}
          >
            <ThemedText>Light Mode</ThemedText>
            {themePreference === 'light' && <ThemedText style={styles.check}>✓</ThemedText>}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.row} 
            onPress={() => setThemePreference('dark')}
          >
            <ThemedText>Dark Mode</ThemedText>
            {themePreference === 'dark' && <ThemedText style={styles.check}>✓</ThemedText>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  backButton: {
    marginRight: Spacing.four,
  },
  backText: {
    color: '#fc5200',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
  },
  section: {
    padding: Spacing.four,
  },
  sectionTitle: {
    marginBottom: Spacing.three,
    color: '#fc5200',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  check: {
    color: '#fc5200',
    fontWeight: 'bold',
  },
});
