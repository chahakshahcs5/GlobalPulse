import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { generateId } from '@ai-news/shared';
import type { AddBlockHelper } from './block-tool-helpers';

/**
 * Media expansion tools: video galleries, podcasts, waveforms, transcripts and
 * published datasets.
 *
 * These complement the existing single-media tools so an external AI agent can
 * author a complete multimedia story (video series, podcast episodes, audio
 * briefs with cue points, transcripts, and the datasets behind a chart).
 */
export function registerMediaExpansionTools(server: McpServer, helperAdd: AddBlockHelper) {
  const chapterShape = {
    startSeconds: z.number().nonnegative(),
    title: z.string().min(1),
    description: z.string().optional(),
  };

  const transcriptSegmentShape = {
    startSeconds: z.number().nonnegative(),
    endSeconds: z.number().nonnegative().optional(),
    speaker: z.string().optional(),
    text: z.string().min(1),
  };

  server.tool(
    'add_video_gallery_block',
    '[WRITE] Add a video gallery: several videos in one block, each with poster art, chapters, and optional transcript segments.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      title: z.string().max(300).optional().describe('Gallery title'),
      description: z.string().max(2000).optional().describe('Gallery description'),
      videos: z
        .array(
          z.object({
            url: z.string().min(1).describe('Video URL or path'),
            title: z.string().min(1),
            posterUrl: z.string().optional(),
            durationSeconds: z.number().positive().optional(),
            caption: z.string().max(2000).optional(),
            credit: z.string().max(300).optional(),
            chapters: z.array(z.object(chapterShape)).optional(),
            transcriptSegments: z.array(z.object(transcriptSegmentShape)).optional(),
          })
        )
        .min(1)
        .max(24),
      sourceAttribution: z.string().optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_vgal'),
        blockType: 'video_gallery',
        sortOrder: 0,
        data,
      })
  );

  server.tool(
    'add_podcast_block',
    '[WRITE] Add a podcast block with one or more episodes (episode numbers, artwork, transcripts, chapters, speakers).',
    {
      storyId: z.string().min(1).describe('Story ID'),
      title: z.string().min(1).max(300),
      description: z.string().max(5000).optional(),
      episodes: z
        .array(
          z.object({
            showTitle: z.string().min(1),
            episodeTitle: z.string().min(1),
            episodeNumber: z.number().int().positive().optional(),
            seasonNumber: z.number().int().nonnegative().optional(),
            description: z.string().max(5000).optional(),
            audioUrl: z.string().min(1),
            artworkUrl: z.string().url().optional(),
            episodeUrl: z.string().url().optional(),
            durationSeconds: z.number().positive().optional(),
            publishedAt: z.string().optional(),
            transcript: z.string().optional(),
            chapters: z.array(z.object(chapterShape)).optional(),
            speakers: z
              .array(
                z.object({
                  id: z.string().min(1),
                  name: z.string().min(1),
                  role: z.string().optional(),
                })
              )
              .optional(),
            explicit: z.boolean().optional(),
            sourceAttribution: z.string().optional(),
          })
        )
        .min(1)
        .max(50),
      sourceAttribution: z.string().optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_pod'),
        blockType: 'podcast',
        sortOrder: 0,
        data,
      })
  );

  server.tool(
    'add_waveform_block',
    '[WRITE] Add an audio/video waveform block with amplitude peaks and segments that can reference other story blocks (cue points).',
    {
      storyId: z.string().min(1).describe('Story ID'),
      title: z.string().max(300).optional(),
      mediaUrl: z.string().min(1).describe('Audio or video URL/path'),
      mediaType: z.enum(['audio', 'video']).default('audio'),
      durationSeconds: z.number().positive().optional(),
      peaks: z
        .array(z.number().min(0).max(1))
        .min(2)
        .describe('Normalized amplitude samples (0-1) used to draw the waveform'),
      segments: z
        .array(
          z.object({
            startSeconds: z.number().nonnegative(),
            endSeconds: z.number().nonnegative().optional(),
            label: z.string().min(1),
            blockRefId: z.string().optional(),
          })
        )
        .optional(),
      sourceAttribution: z.string().optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_wave'),
        blockType: 'waveform',
        sortOrder: 0,
        data,
      })
  );

  server.tool(
    'add_transcript_block',
    '[WRITE] Add a timestamped transcript with speaker attribution, optionally linked to the audio or video it belongs to.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      title: z.string().max(300).optional(),
      mediaType: z.enum(['audio', 'video']).default('audio'),
      mediaUrl: z.string().optional().describe('URL of the media this transcript belongs to'),
      language: z.string().default('en'),
      segments: z
        .array(
          z.object({
            startSeconds: z.number().nonnegative(),
            endSeconds: z.number().nonnegative().optional(),
            speaker: z.string().optional(),
            text: z.string().min(1),
            confidence: z.number().min(0).max(1).optional(),
          })
        )
        .min(1),
      speakers: z
        .array(
          z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            role: z.string().optional(),
          })
        )
        .optional(),
      sourceAttribution: z.string().optional(),
      methodology: z.string().max(4000).optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_tr'),
        blockType: 'transcript',
        sortOrder: 0,
        data,
      })
  );

  server.tool(
    'add_dataset_block',
    '[WRITE] Add a published dataset block: column definitions, a preview table, download formats, license, and methodology.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      title: z.string().min(1).max(300),
      description: z.string().max(4000).optional(),
      downloadUrl: z.string().url().optional(),
      formats: z.array(z.enum(['csv', 'json', 'xlsx'])).default(['csv']),
      columns: z
        .array(
          z.object({
            key: z.string().min(1),
            label: z.string().min(1),
            type: z.enum(['string', 'number', 'boolean', 'date']).default('string'),
          })
        )
        .optional(),
      previewRows: z
        .array(z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])))
        .optional(),
      license: z.string().max(500).optional(),
      methodology: z.string().max(4000).optional(),
      lastUpdated: z.string().optional(),
      sourceAttribution: z.string().optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_data'),
        blockType: 'dataset',
        sortOrder: 0,
        data,
      })
  );
}
