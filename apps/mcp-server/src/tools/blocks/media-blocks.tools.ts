import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { generateId } from '@ai-news/shared';
import type { AddBlockHelper } from './block-tool-helpers';

export function registerMediaBlockTools(server: McpServer, helperAdd: AddBlockHelper) {
  // 6. add_image_block (§38)
  server.tool(
    'add_image_block',
    '[WRITE] Add an image with caption, credit, and responsive aspect ratio.',
    {
      storyId: z.string().min(1),
      url: z.string().url(),
      altText: z.string().min(1),
      caption: z.string().optional(),
      aspectRatio: z.enum(['16:9', '4:3', '1:1', '9:16', '21:9']).default('16:9'),
      credit: z.string().optional(),
    },
    async ({ storyId, url, altText, caption, aspectRatio, credit }) =>
      helperAdd(storyId, {
        id: generateId('blk_img'),
        blockType: 'image',
        sortOrder: 0,
        data: { url, altText, caption, aspectRatio, credit },
      })
  );

  // 7. add_gallery_block (§38)
  server.tool(
    'add_gallery_block',
    '[WRITE] Add a multi-image carousel or photo gallery.',
    {
      storyId: z.string().min(1),
      title: z.string().optional(),
      images: z
        .array(
          z.object({
            url: z.string().url(),
            altText: z.string().min(1),
            caption: z.string().optional(),
            credit: z.string().optional(),
          })
        )
        .min(2),
    },
    async ({ storyId, title, images }) =>
      helperAdd(storyId, {
        id: generateId('blk_gal'),
        blockType: 'gallery',
        sortOrder: 0,
        data: { title, images },
      })
  );

  // 12. add_video_block (§38)
  server.tool(
    'add_video_block',
    '[WRITE] Add a streaming video player block with aspect ratio and optional captions.',
    {
      storyId: z.string().min(1),
      url: z.string().url(),
      caption: z.string().optional(),
      posterUrl: z.string().url().optional(),
      aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
      durationSeconds: z.number().positive().optional(),
    },
    async ({ storyId, ...videoData }) =>
      helperAdd(storyId, {
        id: generateId('blk_vid'),
        blockType: 'video',
        sortOrder: 0,
        data: videoData,
      })
  );

  // 13. add_audio_block (§38)
  server.tool(
    'add_audio_block',
    '[WRITE] Add a narrated audio briefing or podcast segment block with optional synchronized cue points.',
    {
      storyId: z.string().min(1),
      url: z.string().url(),
      title: z.string().min(1),
      narrator: z.string().optional(),
      durationSeconds: z.number().positive().optional(),
      transcript: z.string().optional(),
      language: z.string().default('en'),
      cuePoints: z
        .array(
          z.object({
            timeMs: z.number().nonnegative().describe('Offset in milliseconds'),
            text: z.string().min(1).describe('Spoken sentence or phrase'),
            blockRefId: z.string().optional().describe('Referenced paragraph or block ID'),
          })
        )
        .optional()
        .describe('Synchronized read-along cue points for karaoke audio playback'),
    },
    async ({ storyId, ...audioData }) =>
      helperAdd(storyId, {
        id: generateId('blk_aud'),
        blockType: 'audio',
        sortOrder: 0,
        data: audioData,
      })
  );

  // 14. add_slide_deck_block (§38)
  server.tool(
    'add_slide_deck_block',
    '[WRITE] Add an interactive slide deck presentation block.',
    {
      storyId: z.string().min(1),
      title: z.string().min(1),
      slides: z
        .array(
          z.object({
            slideNumber: z.number().int(),
            title: z.string().min(1),
            bullets: z.array(z.string()).optional(),
            body: z.string().optional(),
            imageUrl: z.string().url().optional(),
          })
        )
        .min(2),
    },
    async ({ storyId, title, slides }) =>
      helperAdd(storyId, {
        id: generateId('blk_slide'),
        blockType: 'slide_deck',
        sortOrder: 0,
        data: { title, slides },
      })
  );

  // 25. add_image_diff_block
  server.tool(
    'add_image_diff_block',
    '[WRITE] Add an interactive before/after visual difference slider comparing two images (e.g. satellite imagery, urban change).',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      beforeUrl: z.string().url().describe('URL of before image'),
      afterUrl: z.string().url().describe('URL of after image'),
      beforeLabel: z.string().default('Before').describe('Label for before image'),
      afterLabel: z.string().default('After').describe('Label for after image'),
      caption: z.string().optional().describe('Editorial caption explaining the visual difference'),
      orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
      defaultSplitPercent: z.number().min(0).max(100).default(50),
      credit: z.string().optional().describe('Image copyright or attribution credit'),
    },
    async ({ storyId, ...diffData }) =>
      helperAdd(storyId, {
        id: generateId('blk_diff'),
        blockType: 'image_diff',
        sortOrder: 0,
        data: diffData,
      })
  );
}
