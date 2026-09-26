import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { OfflineStory } from '../services/storage';

interface FeedScreenProps {
  stories: OfflineStory[];
  onSelectStory: (story: OfflineStory) => void;
  selectedStoryId?: string;
}

export function FeedScreen({ stories, onSelectStory, selectedStoryId }: FeedScreenProps) {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const categories = ['ALL', 'BREAKING', 'ANALYSIS', 'INVESTIGATION', 'EXPLAINER'];

  const filtered = activeCategory === 'ALL'
    ? stories
    : stories.filter((s) => s.articleType.toUpperCase() === activeCategory);

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>N</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>GLOBALPULSE</Text>
            <View style={styles.liveBadgeRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>AI INGESTION ACTIVE</Text>
            </View>
          </View>
        </View>
        <Text style={styles.platformBadge}>MOBILE EDITION</Text>
      </View>

      {/* Categories Horizontal Carousel */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Story List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: story }) => {
          const isSelected = selectedStoryId === story.id;
          return (
            <TouchableOpacity
              onPress={() => onSelectStory(story)}
              style={[styles.storyCard, isSelected && styles.storyCardSelected]}
              activeOpacity={0.8}
            >
              <View style={styles.storyCardHeader}>
                <View style={styles.storyTypeBadge}>
                  <Text style={styles.storyTypeText}>
                    {story.articleType.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.versionBadge}>{`v${story.currentVersionNumber}`}</Text>
              </View>

              <Text style={styles.storyTitle} numberOfLines={2}>
                {story.title}
              </Text>

              <Text style={styles.storySummary} numberOfLines={2}>
                {story.summary}
              </Text>

              <View style={styles.storyCardFooter}>
                <Text style={styles.timestampText}>
                  {new Date(story.savedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.readMoreText}>Read Dispatch →</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Stories Found</Text>
            <Text style={styles.emptySubtext}>
              No articles found under category "{activeCategory}".
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060911',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#34d399',
  },
  liveBadgeText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  platformBadge: {
    color: '#64748b',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  categoriesWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  categoryPillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  categoryText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  storyCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  storyCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(30, 58, 138, 0.2)',
  },
  storyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyTypeBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  storyTypeText: {
    color: '#60a5fa',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  versionBadge: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  storyTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  storySummary: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
  },
  storyCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  timestampText: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  readMoreText: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 12,
  },
});
