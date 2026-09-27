import { useState } from 'react';
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

export const SAMPLE_MOBILE_STORIES: OfflineStory[] = [
  {
    id: 'sty_brics_mobile',
    slug: 'brics-expansion-2026-global-economic-realignment',
    title: 'BRICS Expansion 2026: Historic Geoeconomic Shift',
    summary: 'Four new member nations formally inducted into BRICS during the landmark New Delhi summit.',
    articleType: 'breaking',
    currentVersionNumber: 2,
    savedAt: new Date().toISOString(),
    readStatus: false,
    blocks: [
      {
        id: 'h1',
        blockType: 'heading',
        sortOrder: 0,
        data: { text: 'New Multilateral Financial Architecture', level: 2 },
      },
      {
        id: 'p1',
        blockType: 'paragraph',
        sortOrder: 1,
        data: {
          text: 'Leaders from member nations ratified an updated currency settlement framework designed to facilitate cross-border trade without intermediary dollar clearing houses.',
          format: 'markdown',
        },
      },
      {
        id: 'sum1',
        blockType: 'summary',
        sortOrder: 2,
        data: {
          headline: 'Key Summit Takeaways',
          bulletPoints: [
            'Direct central bank liquidity swap lines established',
            'Mutual recognition of digital trade documentation protocols',
            'Joint development fund capitalized at $100B',
          ],
        },
      },
      {
        id: 'quote1',
        blockType: 'quote',
        sortOrder: 3,
        data: {
          quote: 'This accord represents the most significant recalibration of sovereign financial plumbing in fifty years.',
          attribution: 'Chief Economic Envoy',
          title: 'Summit Delegation',
        },
      },
      {
        id: 'stat1',
        blockType: 'statistic',
        sortOrder: 4,
        data: {
          label: 'Total Induced GDP ($ Trillion PPP)',
          value: '41.2',
          trend: 'up',
          trendValue: '+28%',
          context: 'Combined output of member bloc vs G7',
        },
      },
      {
        id: 'chart1',
        blockType: 'chart',
        sortOrder: 5,
        data: {
          chartType: 'bar',
          title: 'Combined Economic Output ($ Trillion PPP)',
          xAxis: { key: 'year', label: 'Year' },
          yAxis: { label: 'GDP ($T)' },
          series: [{ key: 'val', name: 'GDP' }],
          values: [
            { year: '2024', val: 32 },
            { year: '2026', val: 41 },
          ],
          sourceAttribution: 'World Bank & IMF 2026 Outlook',
        },
      },
    ],
  },
  {
    id: 'sty_chips_mobile',
    slug: 'next-gen-photonic-semiconductor-fabrication',
    title: 'Breakthrough Photonic Lithography Unveiled',
    summary: 'Research alliance demonstrates first commercially viable optical chip interconnects operating at sub-picosecond latency.',
    articleType: 'analysis',
    currentVersionNumber: 1,
    savedAt: new Date(Date.now() - 3600000).toISOString(),
    readStatus: false,
    blocks: [
      {
        id: 'h2',
        blockType: 'heading',
        sortOrder: 0,
        data: { text: 'Overcoming Copper Interconnect Bottlenecks', level: 2 },
      },
      {
        id: 'p2',
        blockType: 'paragraph',
        sortOrder: 1,
        data: {
          text: 'By replacing copper micro-traces with microscopic on-die waveguides, memory bus bandwidth is scaled by a factor of 12 while cutting thermal dissipation by 65%.',
          format: 'markdown',
        },
      },
    ],
  },
];

export default function MobileApp() {
  const [activeTab, setActiveTab] = useState<'feed' | 'bookmarks'>('feed');
  const [selectedStory, setSelectedStory] = useState<OfflineStory | null>(null);
  const { width } = useWindowDimensions();

  // Tablet breakpoint (e.g. iPad, Android tablets)
  const isTablet = width >= 768;
  const tabletStory = selectedStory || SAMPLE_MOBILE_STORIES[0];

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
                <Text style={[styles.tabletTabText, activeTab === 'feed' && styles.tabletTabTextActive]}>
                  📰 Dispatches
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('bookmarks')}
                style={[styles.tabletTabBtn, activeTab === 'bookmarks' && styles.tabletTabBtnActive]}
              >
                <Text style={[styles.tabletTabText, activeTab === 'bookmarks' && styles.tabletTabTextActive]}>
                  🔖 Offline Cache
                </Text>
              </TouchableOpacity>
            </View>

            {/* List */}
            <View style={styles.tabletListWrapper}>
              {activeTab === 'feed' ? (
                <FeedScreen
                  stories={SAMPLE_MOBILE_STORIES}
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
                <Text style={styles.tabletPlaceholderText}>Select a dispatch to read in high resolution.</Text>
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
            <FeedScreen
              stories={SAMPLE_MOBILE_STORIES}
              onSelectStory={(s) => setSelectedStory(s)}
            />
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
            <Text
              style={[styles.tabBarLabel, activeTab === 'feed' && styles.tabBarLabelActive]}
            >
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
