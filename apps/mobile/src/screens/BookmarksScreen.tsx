import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { offlineStorage, OfflineStory } from '../services/storage';

interface BookmarksScreenProps {
  onSelectStory: (story: OfflineStory) => void;
  selectedStoryId?: string;
}

export function BookmarksScreen({ onSelectStory, selectedStoryId }: BookmarksScreenProps) {
  const savedStories = offlineStorage.getAllSavedStories();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offline Library</Text>
        <Text style={styles.headerSubtitle}>
          {`${savedStories.length} ${savedStories.length === 1 ? 'dispatch' : 'dispatches'} cached for offline reading`}
        </Text>
      </View>

      {/* Bookmarked Stories List */}
      <FlatList
        data={savedStories}
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
              <View style={styles.cardMetaRow}>
                <Text style={styles.dateText}>
                  {new Date(story.savedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <View style={styles.cachedBadge}>
                  <Text style={styles.cachedBadgeText}>CACHED OFFLINE</Text>
                </View>
              </View>

              <Text style={styles.title} numberOfLines={2}>
                {story.title}
              </Text>

              <Text style={styles.summary} numberOfLines={2}>
                {story.summary}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔖</Text>
            <Text style={styles.emptyTitle}>No Offline Articles Yet</Text>
            <Text style={styles.emptySubtext}>
              Tap "Save Offline" on any dispatch in the feed to cache stories for uninterrupted
              reading without internet.
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 4,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
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
    gap: 6,
  },
  storyCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(30, 58, 138, 0.2)',
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  cachedBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cachedBadgeText: {
    color: '#60a5fa',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  title: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  summary: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
  },
  emptyContainer: {
    paddingVertical: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  emptyTitle: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
