import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { FeedScreen } from './screens/FeedScreen';
import { StoryDetailScreen } from './screens/StoryDetailScreen';
import { BookmarksScreen } from './screens/BookmarksScreen';
import { OfflineStory } from './services/storage';
import { mobileApi } from './services/api';

export default function MobileApp() {
  const [activeTab, setActiveTab] = useState<'feed' | 'bookmarks'>('feed');
  const [selectedStory, setSelectedStory] = useState<OfflineStory | null>(null);
  const [stories, setStories] = useState<OfflineStory[]>([]);
  const [_isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const { width } = useWindowDimensions();

  useEffect(() => {
    let isMounted = true;
    async function loadLiveStories() {
      try {
        const res = await mobileApi.fetchStories();
        if (isMounted) {
          setStories(res.stories || []);
          setIsLiveConnected(res.isOnline);
        }
      } catch {
        // Fallback silently to offline cache
      }
    }
    loadLiveStories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Tablet breakpoint (e.g. iPad, Android tablets)
  const isTablet = width >= 768;
  const tabletStory = selectedStory || stories[0] || null;

  // Tablet Dual-Pane Mode
  if (isTablet) {
    return (
      <SafeAreaView style={styles.tabletRoot}>
        <StatusBar barStyle="light-content" />
        <View style={styles.tabletContainer}>
          {/* Left Master Pane: Navigation & List */}
          <View style={styles.tabletMasterPane}>
            {/* Top Navigation Tabs */}
            <View style={styles.tabletTabBar}>
              <TouchableOpacity
                onPress={() => setActiveTab('feed')}
                style={[styles.tabletTabBtn, activeTab === 'feed' && styles.tabletTabBtnActive]}
              >
                <Text
                  style={[styles.tabletTabText, activeTab === 'feed' && styles.tabletTabTextActive]}
                >
                  📰 Dispatches
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('bookmarks')}
                style={[
                  styles.tabletTabBtn,
                  activeTab === 'bookmarks' && styles.tabletTabBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabletTabText,
                    activeTab === 'bookmarks' && styles.tabletTabTextActive,
                  ]}
                >
                  🔖 Offline Cache
                </Text>
              </TouchableOpacity>
            </View>

            {/* List */}
            <View style={styles.tabletListWrapper}>
              {activeTab === 'feed' ? (
                <FeedScreen
                  stories={stories}
                  onSelectStory={(s) => setSelectedStory(s)}
                  selectedStoryId={selectedStory?.id}
                />
              ) : (
                <BookmarksScreen
                  onSelectStory={(s) => setSelectedStory(s)}
                  selectedStoryId={selectedStory?.id}
                />
              )}
            </View>
          </View>

          {/* Right Detail Pane */}
          <View style={styles.tabletDetailPane}>
            {tabletStory ? (
              <StoryDetailScreen story={tabletStory} isTabletSplit />
            ) : (
              <View style={styles.tabletPlaceholder}>
                <Text style={styles.tabletPlaceholderIcon}>📰</Text>
                <Text style={styles.tabletPlaceholderText}>
                  Select a dispatch to read in high resolution.
                </Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Phone Stack Navigation Mode
  if (selectedStory && activeTab === 'feed') {
    return (
      <SafeAreaView style={styles.phoneRoot}>
        <StatusBar barStyle="light-content" />
        <StoryDetailScreen story={selectedStory} onBack={() => setSelectedStory(null)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.phoneRoot}>
      <StatusBar barStyle="light-content" />
      <View style={styles.phoneContainer}>
        {/* Main Screen Body */}
        <View style={styles.phoneScreenContent}>
          {activeTab === 'feed' ? (
            <FeedScreen stories={stories} onSelectStory={(s) => setSelectedStory(s)} />
          ) : (
            <BookmarksScreen onSelectStory={(s) => setSelectedStory(s)} />
          )}
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.bottomTabBar}>
          <TouchableOpacity
            onPress={() => {
              setActiveTab('feed');
              setSelectedStory(null);
            }}
            style={styles.tabBarItem}
          >
            <Text style={styles.tabBarIcon}>📰</Text>
            <Text style={[styles.tabBarLabel, activeTab === 'feed' && styles.tabBarLabelActive]}>
              Feed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActiveTab('bookmarks');
              setSelectedStory(null);
            }}
            style={styles.tabBarItem}
          >
            <Text style={styles.tabBarIcon}>🔖</Text>
            <Text
              style={[styles.tabBarLabel, activeTab === 'bookmarks' && styles.tabBarLabelActive]}
            >
              Saved
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Tablet Layout Styles
  tabletRoot: {
    flex: 1,
    backgroundColor: '#030712',
  },
  tabletContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  tabletMasterPane: {
    width: 360,
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
    backgroundColor: '#060911',
  },
  tabletTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0b0f19',
    padding: 6,
    gap: 6,
  },
  tabletTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabletTabBtnActive: {
    backgroundColor: '#1e293b',
  },
  tabletTabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabletTabTextActive: {
    color: '#38bdf8',
  },
  tabletListWrapper: {
    flex: 1,
  },
  tabletDetailPane: {
    flex: 1,
    backgroundColor: '#060911',
  },
  tabletPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  tabletPlaceholderIcon: {
    fontSize: 48,
  },
  tabletPlaceholderText: {
    color: '#64748b',
    fontSize: 15,
  },

  // Phone Layout Styles
  phoneRoot: {
    flex: 1,
    backgroundColor: '#060911',
  },
  phoneContainer: {
    flex: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#060911',
  },
  phoneScreenContent: {
    flex: 1,
  },
  bottomTabBar: {
    height: 56,
    backgroundColor: '#090d16',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  tabBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 20,
  },
  tabBarIcon: {
    fontSize: 18,
  },
  tabBarLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  tabBarLabelActive: {
    color: '#38bdf8',
  },
});
