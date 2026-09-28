import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { offlineStorage, OfflineStory } from '../services/storage';
import { MobileBlockRenderer } from '../components/MobileBlockRenderer';

interface StoryDetailScreenProps {
  story: OfflineStory;
  onBack?: () => void;
  isTabletSplit?: boolean;
}

export function StoryDetailScreen({ story, onBack, isTabletSplit }: StoryDetailScreenProps) {
  const [isSaved, setIsSaved] = useState<boolean>(offlineStorage.isBookmarked(story.id));
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [story.id]);

  const handleAudioToggle = () => {
    if (isPlayingAudio) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const textToSpeak = `${story.title}. ${story.summary}`;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      } else {
        setIsPlayingAudio(true);
        setTimeout(() => setIsPlayingAudio(false), 4000);
      }
    }
  };

  const handleBookmarkToggle = () => {
    const saved = offlineStorage.toggleBookmark(story.id);
    if (saved) {
      offlineStorage.saveStory(story);
    }
    setIsSaved(saved);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Action Bar */}
      <View style={styles.topBar}>
        {onBack && !isTabletSplit ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Feed</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.tabletReaderBadge}>
            <Text style={styles.tabletReaderText}>DISPATCH READER</Text>
          </View>
        )}

        <View style={styles.actionButtonGroup}>
          <TouchableOpacity
            onPress={handleAudioToggle}
            style={[styles.actionBtn, isPlayingAudio && styles.actionBtnActiveAudio]}
          >
            <Text style={[styles.actionBtnText, isPlayingAudio && styles.actionBtnTextActive]}>
              {isPlayingAudio ? '■ Stop' : '▶ Audio'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBookmarkToggle}
            style={[styles.actionBtn, isSaved && styles.actionBtnActiveSaved]}
          >
            <Text style={[styles.actionBtnText, isSaved && styles.actionBtnTextActive]}>
              {isSaved ? '★ Saved' : '☆ Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Story Header */}
      <View style={styles.storyHeader}>
        <View style={styles.metaRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{story.articleType.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <Text style={styles.versionText}>{`Version ${story.currentVersionNumber}`}</Text>
          <Text style={styles.bulletSeparator}>•</Text>
          <Text style={styles.dateText}>
            {new Date(story.savedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>

        <Text style={styles.title}>{story.title}</Text>
        <Text style={styles.summary}>{story.summary}</Text>

        {isPlayingAudio && (
          <View style={styles.audioPlayerBanner}>
            <View style={styles.audioPlayerRow}>
              <View style={styles.audioPulseDot} />
              <Text style={styles.audioPlayerTitle}>Synthesizing Audio Dispatch (Anchor F)</Text>
            </View>
            <Text style={styles.audioDurationText}>02:15</Text>
          </View>
        )}
      </View>

      {/* Content Blocks */}
      <View style={styles.blocksWrapper}>
        <MobileBlockRenderer blocks={story.blocks} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060911',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  backButtonText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  tabletReaderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 6,
  },
  tabletReaderText: {
    color: '#60a5fa',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionBtnActiveAudio: {
    backgroundColor: '#e11d48',
    borderColor: '#f43f5e',
  },
  actionBtnActiveSaved: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  actionBtnText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  actionBtnTextActive: {
    color: '#ffffff',
  },
  storyHeader: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    color: '#60a5fa',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  versionText: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  bulletSeparator: {
    color: '#475569',
    fontSize: 12,
  },
  dateText: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  title: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  summary: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
  },
  audioPlayerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  audioPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fb7185',
  },
  audioPlayerTitle: {
    color: '#fda4af',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  audioDurationText: {
    color: '#fda4af',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  blocksWrapper: {
    paddingVertical: 18,
  },
});
