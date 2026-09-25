import { useState, useEffect } from 'react';
import { StyleSheet, SectionList, RefreshControl, Linking, TouchableOpacity, ActivityIndicator, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const Notifications = isExpoGo ? null : require('expo-notifications');

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

import { useRouter } from 'expo-router';
import { usePreferences } from '@/hooks/usePreferences';

type Challenge = {
  id: number;
  title: string;
  description: string;
  dateInterval: string;
  qualifyingActivities: string;
  url: string;
  imageUrl?: string;
  detectedAt: string;
};

function parseDateSafe(str: string): Date {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  let m = -1, d = 1, y = new Date().getFullYear();
  
  const monthMatch = str.match(/[a-zA-Z]+/);
  if (monthMatch) {
    m = months.findIndex(x => monthMatch[0].toLowerCase().startsWith(x));
  }
  
  const numbers = str.match(/\d+/g);
  if (numbers) {
    if (numbers.length >= 2) {
      d = parseInt(numbers[0]);
      y = parseInt(numbers[1]);
    } else if (numbers.length === 1) {
      const num = parseInt(numbers[0]);
      if (num > 1000) y = num;
      else d = num;
    }
  }
  
  if (m === -1) return new Date(str);
  return new Date(y, m, d);
}

function isChallengeActive(dateInterval: string): boolean {
  if (!dateInterval) return false;

  const now = new Date();
  
  let parts = dateInterval.split(/\s+-\s+|\s+to\s+/i);
  if (parts.length === 2) {
    const endDate = parseDateSafe(parts[1]);
    if (!isNaN(endDate.getTime())) {
      endDate.setHours(23, 59, 59, 999);
      return now.getTime() <= endDate.getTime();
    }
  }
  
  const date = parseDateSafe(dateInterval);
  if (!isNaN(date.getTime())) {
     if (date.getFullYear() > now.getFullYear()) return true;
     if (date.getFullYear() === now.getFullYear() && date.getMonth() >= now.getMonth()) return true;
     return false;
  }

  return false;
}

export default function HomeScreen() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set());
  
  const lastNotificationResponse = isExpoGo ? null : Notifications.useLastNotificationResponse();
  const router = useRouter();
  const { activeOnly } = usePreferences();

  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.notification.request.content.data?.type === 'new_challenges'
    ) {
      const ids = lastNotificationResponse.notification.request.content.data.ids;
      if (Array.isArray(ids)) {
        setHighlightedIds(new Set(ids));
        fetchChallenges(0, true);
        setTimeout(() => setHighlightedIds(new Set()), 3000);
      }
    }
  }, [lastNotificationResponse]);

  const fetchChallenges = async (pageNum = 0, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoadingMore(true);

      const res = await fetch(`https://strava-scout.nmanjuonline.workers.dev/api/challenges?page=${pageNum}`);
      const data = await res.json();
      const newChallenges = data.challenges || [];

      if (newChallenges.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (isRefresh || pageNum === 0) {
        setChallenges(newChallenges);
      } else {
        setChallenges(prev => [...prev, ...newChallenges]);
      }
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch challenges:", error);
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchChallenges(0, true);
  }, []);

  const openUrl = (url: string) => {
    Linking.openURL(url);
  };

  // Group challenges by the local date string of detectedAt
  const visibleChallenges = activeOnly ? challenges.filter(c => isChallengeActive(c.dateInterval)) : challenges;
  
  const sectionsMap = new Map<string, Challenge[]>();
  visibleChallenges.forEach(challenge => {
    const dateObj = new Date(challenge.detectedAt);
    const dateStr = dateObj.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const title = Number.isNaN(dateObj.getTime()) ? 'Unknown Date' : dateStr;
    if (!sectionsMap.has(title)) sectionsMap.set(title, []);
    sectionsMap.get(title)!.push(challenge);
  });

  const sections = Array.from(sectionsMap.entries()).map(([title, data]) => ({ title, data }));

  const renderItem = ({ item }: { item: Challenge }) => (
    <ThemedView type="backgroundElement" style={[styles.card, highlightedIds.has(item.id) && styles.cardHighlighted]}>
      <View style={styles.cardMainRow}>
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImageSmall} resizeMode="cover" />
        )}
        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleContainer}>
              <ThemedText type="small" style={styles.idBadge}>#{item.id}</ThemedText>
              <ThemedText type="subtitle" style={styles.cardTitle} numberOfLines={1}>{item.title}</ThemedText>
            </View>
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => openUrl(item.url)}
            >
              <ThemedText style={styles.joinButtonText}>JOIN</ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.cardDescription} numberOfLines={2}>{item.description}</ThemedText>
        </View>
      </View>

      <View style={styles.cardFooterRow}>
        <View style={styles.footerDateContainer}>
          <ThemedText type="small" style={styles.cardDate}>{item.dateInterval}</ThemedText>
          <ThemedText type="small" style={styles.cardTime}>• {new Date(item.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</ThemedText>
        </View>
        <ThemedText type="small" style={styles.cardActivities} numberOfLines={1}>{item.qualifyingActivities}</ThemedText>
      </View>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <Image source={require('../../assets/images/logo.jpg')} style={styles.headerLogo} resizeMode="contain" />
          <ThemedText type="title" style={styles.header}>Strava Scout</ThemedText>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsButton}>
            <ThemedText style={{ fontSize: 24, lineHeight: 28, paddingHorizontal: 4 }}>⚙️</ThemedText>
          </TouchableOpacity>
        </View>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => (
            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={styles.sectionHeaderText}>{title}</ThemedText>
            </ThemedView>
          )}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchChallenges(0, true)} tintColor="#fc5200" />
          }
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              {refreshing ? 'Loading challenges...' : 'No challenges found yet.'}
            </ThemedText>
          }
          ListFooterComponent={
            <View style={styles.listFooterWrapper}>
              {hasMore && challenges.length > 0 ? (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={() => fetchChallenges(page + 1)}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator color="#fc5200" />
                  ) : (
                    <ThemedText style={styles.loadMoreText}>Load More</ThemedText>
                  )}
                </TouchableOpacity>
              ) : null}
              {challenges.length > 0 && (
                <ThemedText style={styles.creditText}>Crafted with ❤️ by Manju Narasimha</ThemedText>
              )}
            </View>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  header: {
    color: '#fc5200',
    fontSize: 22,
  },
  settingsButton: {
    padding: Spacing.one,
  },
  listContainer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  sectionHeader: {
    backgroundColor: 'transparent',
    paddingVertical: Spacing.two,
    marginTop: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252, 82, 0, 0.2)',
  },
  sectionHeaderText: {
    fontWeight: 'bold',
    color: '#fc5200',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: 'rgba(252, 82, 0, 0.15)',
    marginTop: Spacing.two,
  },
  cardHighlighted: {
    borderColor: 'rgba(252, 82, 0, 0.8)',
    backgroundColor: 'rgba(252, 82, 0, 0.15)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.one,
  },
  idBadge: {
    backgroundColor: 'rgba(252, 82, 0, 0.1)',
    color: '#fc5200',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: 'bold',
    fontSize: 10,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  joinButton: {
    backgroundColor: '#fc5200',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  cardContent: {
    flex: 1,
    gap: Spacing.one,
  },
  cardDescription: {
    fontSize: 13,
    opacity: 0.8,
    marginVertical: 2,
    lineHeight: 18,
  },
  cardImageSmall: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
    gap: Spacing.two,
  },
  footerDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardDate: {
    color: '#fc5200',
    fontWeight: '600',
    fontSize: 11,
  },
  cardTime: {
    color: '#fc5200',
    opacity: 0.7,
    fontSize: 11,
  },
  cardActivities: {
    opacity: 0.5,
    fontStyle: 'italic',
    fontSize: 11,
    flex: 1,
    textAlign: 'right',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.six,
    opacity: 0.6,
  },
  loadMoreButton: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(252, 82, 0, 0.3)',
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(252, 82, 0, 0.05)',
  },
  loadMoreText: {
    color: '#fc5200',
    fontWeight: '600',
  },
  listFooterWrapper: {
    paddingBottom: Spacing.four,
  },
  creditText: {
    textAlign: 'center',
    marginTop: Spacing.four,
    opacity: 0.5,
    fontSize: 12,
  },
});
