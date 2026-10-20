import { describe, it, expect } from 'vitest';
import {
  VideoGalleryBlockSchema,
  PodcastBlockSchema,
  WaveformBlockSchema,
  TranscriptBlockSchema,
  DatasetBlockSchema,
  StoryBlockSchema,
  getBlockDefinition,
  listBlockTypes,
  zodToJsonSchema,
} from '@ai-news/schemas';

const base = { id: 'blk_test', sortOrder: 0 };

describe('Media expansion blocks', () => {
  it('validates a video gallery with chapters and transcripts', () => {
    const block = VideoGalleryBlockSchema.parse({
      ...base,
      blockType: 'video_gallery',
      data: {
        title: 'Field reports',
        videos: [
          {
            id: 'v1',
            url: 'https://media.example.com/one.mp4',
            title: 'Day one',
            posterUrl: 'https://media.example.com/one.jpg',
            durationSeconds: 120,
            chapters: [{ startSeconds: 0, title: 'Intro' }],
            transcriptSegments: [{ startSeconds: 0, text: 'We are on the ground.' }],
          },
        ],
      },
    });

    expect(block.data.videos).toHaveLength(1);
    expect(block.data.videos[0].chapters?.[0].title).toBe('Intro');
  });

  it('rejects a video gallery without videos', () => {
    expect(() =>
      VideoGalleryBlockSchema.parse({ ...base, blockType: 'video_gallery', data: { videos: [] } })
    ).toThrow();
  });

  it('validates a podcast block with episode metadata', () => {
    const block = PodcastBlockSchema.parse({
      ...base,
      blockType: 'podcast',
      data: {
        title: 'The Daily Briefing',
        episodes: [
          {
            showTitle: 'The Daily Briefing',
            episodeTitle: 'Rate decision special',
            episodeNumber: 42,
            seasonNumber: 3,
            audioUrl: 'https://media.example.com/ep42.mp3',
            durationSeconds: 1800,
            speakers: [{ id: 'sp1', name: 'Alex Reporter', role: 'Economics' }],
            chapters: [{ startSeconds: 0, title: 'Cold open' }],
            explicit: false,
          },
        ],
      },
    });

    expect(block.data.episodes[0].episodeNumber).toBe(42);
    expect(block.data.episodes[0].speakers?.[0].name).toBe('Alex Reporter');
  });

  it('validates a waveform block with amplitude peaks', () => {
    const block = WaveformBlockSchema.parse({
      ...base,
      blockType: 'waveform',
      data: {
        mediaUrl: 'https://media.example.com/briefing.mp3',
        mediaType: 'audio',
        durationSeconds: 60,
        peaks: [0.1, 0.9, 0.4],
        segments: [{ startSeconds: 12, label: 'Key number', blockRefId: 'blk_kpi' }],
      },
    });

    expect(block.data.peaks).toHaveLength(3);
    expect(block.data.segments[0].blockRefId).toBe('blk_kpi');
  });

  it('rejects waveform peaks outside the normalized range', () => {
    expect(() =>
      WaveformBlockSchema.parse({
        ...base,
        blockType: 'waveform',
        data: { mediaUrl: 'https://media.example.com/a.mp3', peaks: [0.2, 1.4] },
      })
    ).toThrow();
  });

  it('validates a transcript block with speaker attribution', () => {
    const block = TranscriptBlockSchema.parse({
      ...base,
      blockType: 'transcript',
      data: {
        title: 'Interview transcript',
        mediaType: 'video',
        mediaUrl: 'https://media.example.com/interview.mp4',
        language: 'en',
        segments: [
          {
            startSeconds: 0,
            endSeconds: 4,
            speaker: 'Reporter',
            text: 'What happened?',
            confidence: 0.97,
          },
        ],
        speakers: [{ id: 'sp1', name: 'Reporter' }],
      },
    });

    expect(block.data.segments[0].confidence).toBe(0.97);
    expect(block.data.speakers[0].name).toBe('Reporter');
  });

  it('rejects a transcript without segments', () => {
    expect(() =>
      TranscriptBlockSchema.parse({
        ...base,
        blockType: 'transcript',
        data: { segments: [] },
      })
    ).toThrow();
  });

  it('validates a dataset block with columns, preview and license', () => {
    const block = DatasetBlockSchema.parse({
      ...base,
      blockType: 'dataset',
      data: {
        title: 'Global GDP series',
        downloadUrl: 'https://data.example.com/gdp.csv',
        formats: ['csv', 'json'],
        columns: [{ key: 'year', label: 'Year', type: 'number' }],
        previewRows: [{ year: 2025, gdp: 3.9 }],
        license: 'CC BY 4.0',
        methodology: 'Constant 2015 USD.',
      },
    });

    expect(block.data.formats).toContain('csv');
    expect(block.data.columns[0].type).toBe('number');
  });

  it('is part of the discriminated story block union', () => {
    const parsed = StoryBlockSchema.parse({
      ...base,
      blockType: 'transcript',
      data: { segments: [{ startSeconds: 0, text: 'Hello' }] },
    });
    expect(parsed.blockType).toBe('transcript');
  });

  it('registers every media expansion block with a JSON schema', () => {
    for (const type of ['video_gallery', 'podcast', 'waveform', 'transcript', 'dataset']) {
      const definition = getBlockDefinition(type);
      expect(definition).toBeDefined();
      expect(definition?.category).toBeTruthy();
      expect(zodToJsonSchema(definition!.schema).type).toBe('object');
      expect(listBlockTypes()).toContain(type);
    }
  });
});
