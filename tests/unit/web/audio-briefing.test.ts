import { describe, it, expect } from 'vitest';
import { AudioBlockSchema } from '@ai-news/schemas';

describe('Audio Briefing & Player Unit Tests', () => {
  it('validates a properly structured AudioBlock with local audio url and cue points', () => {
    const rawBlock = {
      id: 'blk_quantum_audio_test',
      blockType: 'audio',
      sortOrder: 1,
      data: {
        url: 'https://news.platform/audio/dispatches/quantum-topological-qubits-briefing.mp3',
        title: 'GlobalPulse Deep Dive: Inside the Majorana Topological Qubit Breakthrough',
        narrator: 'Elena Rostova & David Chen',
        durationSeconds: 245,
        transcript:
          'Welcome to this GlobalPulse Special Report. Today, we break down how topological braid protection neutralizes environmental decoherence.',
        language: 'en',
        cuePoints: [
          { timeMs: 0, text: 'Welcome to this GlobalPulse Special Report.' },
          {
            timeMs: 4000,
            text: 'Today, we break down how topological braid protection neutralizes decoherence.',
          },
        ],
      },
    };

    const parsed = AudioBlockSchema.safeParse(rawBlock);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.blockType).toBe('audio');
      expect(parsed.data.data.durationSeconds).toBe(245);
      expect(parsed.data.data.cuePoints).toHaveLength(2);
      expect(parsed.data.data.cuePoints?.[1].timeMs).toBe(4000);
    }
  });

  it('correctly maps fictitious or broken news.platform audio URLs to playable local static assets', () => {
    function resolveAudioUrl(rawUrl?: string, title?: string): string {
      if (!rawUrl) return '/audio/sample-briefing.mp3';
      const raw = rawUrl.toLowerCase();
      const lowerTitle = (title || '').toLowerCase();
      if (
        raw.includes('quantum-topological-qubits') ||
        raw.includes('quantum') ||
        lowerTitle.includes('quantum') ||
        lowerTitle.includes('topological')
      ) {
        return '/audio/quantum-topological-qubits-briefing.mp3';
      }
      if (raw.includes('news.platform')) {
        return '/audio/sample-briefing.mp3';
      }
      return rawUrl;
    }

    // Fictitious news.platform quantum URL
    expect(
      resolveAudioUrl(
        'https://news.platform/audio/dispatches/quantum-topological-qubits-briefing.mp3',
        'GlobalPulse Deep Dive: Inside the Majorana Topological Qubit Breakthrough'
      )
    ).toBe('/audio/quantum-topological-qubits-briefing.mp3');

    // Generic fictitious news.platform URL
    expect(
      resolveAudioUrl('https://news.platform/audio/dispatches/daily-recap.mp3', 'Daily Recap')
    ).toBe('/audio/sample-briefing.mp3');

    // Undefined URL fallback
    expect(resolveAudioUrl(undefined, 'Any Title')).toBe('/audio/sample-briefing.mp3');

    // Direct local static route
    expect(resolveAudioUrl('/audio/quantum-topological-qubits-briefing.mp3', 'Quantum Story')).toBe(
      '/audio/quantum-topological-qubits-briefing.mp3'
    );

    // External valid CDN link
    expect(resolveAudioUrl('https://cdn.example.com/audio/podcast.mp3', 'Valid Link')).toBe(
      'https://cdn.example.com/audio/podcast.mp3'
    );
  });

  it('formats audio playback time correctly', () => {
    const formatTime = (secs: number) => {
      if (isNaN(secs) || secs < 0) return '0:00';
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(45)).toBe('0:45');
    expect(formatTime(245)).toBe('4:05');
    expect(formatTime(3600)).toBe('60:00');
    expect(formatTime(-10)).toBe('0:00');
  });
});
