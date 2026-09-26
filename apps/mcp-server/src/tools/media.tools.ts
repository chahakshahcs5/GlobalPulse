import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { StoryService } from '@ai-news/stories';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { generateId } from '@ai-news/shared';

// Registry for media assets and variants
const mediaRegistry = new Map<
  string,
  {
    id: string;
    mediaType: string;
    title: string;
    url: string;
    metadata: Record<string, unknown>;
    variants: Array<{ format: string; width: number; height: number; url: string }>;
    createdAt: string;
  }
>();

export function registerMediaTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const storyService = new StoryService(db);

  server.tool(
    'get_media',
    '[READ-ONLY] Retrieve metadata and processed responsive variants for a registered media asset.',
    {
      mediaId: z.string().min(1).describe('Media asset ID'),
    },
    async ({ mediaId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const media = mediaRegistry.get(mediaId);
      if (!media) {
        throw new Error(`Media asset "${mediaId}" not found`);
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(media, null, 2) }],
      };
    }
  );

  server.tool(
    'create_chart',
    '[WRITE] Create a structured programmatic D3 chart specification (line, bar, stacked_bar, area, scatter, donut, waterfall, kpi) and optionally append it to a story.',
    {
      storyId: z.string().optional().describe('Story ID to append chart to if desired'),
      chartType: z.enum([
        'line',
        'area',
        'bar',
        'stacked_bar',
        'grouped_bar',
        'scatter',
        'heatmap',
        'histogram',
        'waterfall',
        'donut',
        'kpi',
        'comparison',
        'slope',
      ]),
      title: z.string().min(1).describe('Chart title'),
      subtitle: z.string().optional(),
      xAxis: z.object({
        key: z.string(),
        label: z.string(),
        type: z.enum(['category', 'time', 'linear']).default('category'),
      }),
      yAxis: z.object({
        label: z.string(),
        unit: z.string().optional(),
        format: z.string().optional(),
      }),
      series: z.array(z.object({ name: z.string(), key: z.string(), color: z.string().optional() })),
      values: z.array(z.record(z.unknown())).min(1).describe('Array of data points'),
      sourceAttribution: z.string().optional(),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:media');

      const chartBlock = {
        id: generateId('blk_chart'),
        blockType: 'chart' as const,
        sortOrder: 0,
        data: {
          chartType: params.chartType,
          title: params.title,
          subtitle: params.subtitle,
          xAxis: params.xAxis,
          yAxis: params.yAxis,
          series: params.series,
          values: params.values,
          sourceAttribution: params.sourceAttribution,
        },
      };

      if (params.storyId) {
        await storyService.addBlock(params.storyId, chartBlock, {
          organizationId: principal.organizationId,
          authorId: principal.id,
          clientType: principal.clientType,
          createdVia: 'mcp',
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ message: 'Chart block created.', block: chartBlock }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'create_map',
    '[WRITE] Create an interactive MapLibre map block with geographic coordinates, markers, or GeoJSON layers.',
    {
      storyId: z.string().optional().describe('Story ID to append map to'),
      title: z.string().optional(),
      center: z.tuple([z.number(), z.number()]).describe('Center coordinates [longitude, latitude]'),
      zoom: z.number().min(0).max(22).default(3),
      style: z.enum(['dark', 'light', 'satellite', 'streets']).default('dark'),
      markers: z
        .array(
          z.object({
            coordinates: z.tuple([z.number(), z.number()]),
            title: z.string(),
            description: z.string().optional(),
          })
        )
        .optional(),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:media');

      const mapBlock = {
        id: generateId('blk_map'),
        blockType: 'map' as const,
        sortOrder: 0,
        data: {
          title: params.title,
          center: params.center,
          zoom: params.zoom,
          style: params.style,
          markers: params.markers,
        },
      };

      if (params.storyId) {
        await storyService.addBlock(params.storyId, mapBlock, {
          organizationId: principal.organizationId,
          authorId: principal.id,
          clientType: principal.clientType,
          createdVia: 'mcp',
        });
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({ message: 'Map block created.', block: mapBlock }, null, 2) }],
      };
    }
  );

  server.tool(
    'create_timeline',
    '[WRITE] Create a responsive chronological timeline block with milestones and source references.',
    {
      storyId: z.string().optional().describe('Story ID to append timeline to'),
      title: z.string().optional().describe('Timeline title'),
      items: z.array(
        z.object({
          date: z.string().describe('ISO date or formatted label (e.g. "2026-09-26" or "10:30 AM")'),
          headline: z.string(),
          body: z.string(),
          entityIds: z.array(z.string()).optional(),
          sourceIds: z.array(z.string()).optional(),
        })
      ),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:media');

      const timelineBlock = {
        id: generateId('blk_tl'),
        blockType: 'timeline' as const,
        sortOrder: 0,
        data: {
          title: params.title,
          items: params.items,
        },
      };

      if (params.storyId) {
        await storyService.addBlock(params.storyId, timelineBlock, {
          organizationId: principal.organizationId,
          authorId: principal.id,
          clientType: principal.clientType,
          createdVia: 'mcp',
        });
      }

      return {
        content: [
          { type: 'text', text: JSON.stringify({ message: 'Timeline block created.', block: timelineBlock }, null, 2) },
        ],
      };
    }
  );

  server.tool(
    'create_diagram',
    '[WRITE] Create a structured diagram block using Mermaid notation or declarative flowchart syntax.',
    {
      storyId: z.string().optional().describe('Story ID to append diagram to'),
      title: z.string().optional(),
      definition: z.string().min(1).describe('Mermaid or graph diagram definition text'),
      caption: z.string().optional(),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:media');

      const diagramBlock = {
        id: generateId('blk_diag'),
        blockType: 'diagram' as const,
        sortOrder: 0,
        data: {
          title: params.title,
          format: 'mermaid' as const,
          definition: params.definition,
          caption: params.caption,
        },
      };

      if (params.storyId) {
        await storyService.addBlock(params.storyId, diagramBlock, {
          organizationId: principal.organizationId,
          authorId: principal.id,
          clientType: principal.clientType,
          createdVia: 'mcp',
        });
      }

      return {
        content: [
          { type: 'text', text: JSON.stringify({ message: 'Diagram block created.', block: diagramBlock }, null, 2) },
        ],
      };
    }
  );

  server.tool(
    'attach_media',
    '[WRITE] Attach a hero image or media asset URL to an existing story.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      heroImageUrl: z.string().url().describe('Direct URL to the image asset'),
    },
    async ({ storyId, heroImageUrl }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:media');

      await storyService.updateStory(
        storyId,
        { heroImageUrl },
        {
          organizationId: principal.organizationId,
          authorId: principal.id,
          clientType: principal.clientType,
          createdVia: 'mcp',
        }
      );

      return {
        content: [{ type: 'text', text: JSON.stringify({ message: 'Media attached to story hero.', heroImageUrl }) }],
      };
    }
  );

  server.tool(
    'upload_media',
    '[WRITE] Register an external or generated media asset (image, video, audio, chart) in the media registry.',
    {
      mediaType: z.enum(['image', 'video', 'audio', 'chart', 'document']).describe('Media MIME or category type'),
      title: z.string().min(1).describe('Asset title or label'),
      url: z.string().url().describe('Public or storage URL'),
      metadata: z.record(z.unknown()).optional().describe('Resolution, duration, bitrate, prompt, or provenance info'),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:media');

      const mediaId = generateId('med');
      const record = {
        id: mediaId,
        mediaType: params.mediaType,
        title: params.title,
        url: params.url,
        metadata: params.metadata || {},
        variants: [],
        createdAt: new Date().toISOString(),
      };
      mediaRegistry.set(mediaId, record);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ message: 'Media asset registered.', mediaId, asset: record }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'create_media_variant',
    '[WRITE] Register a processed derivative/variant for an existing media asset (e.g. thumbnail, 720p, WebP).',
    {
      mediaId: z.string().min(1).describe('Parent media ID'),
      format: z.string().min(1).describe('File format (e.g. webp, avif, mp4)'),
      width: z.number().int().positive().describe('Width in pixels'),
      height: z.number().int().positive().describe('Height in pixels'),
      url: z.string().url().describe('Direct derivative URL'),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:media');

      const media = mediaRegistry.get(params.mediaId);
      if (!media) {
        throw new Error(`Media asset "${params.mediaId}" not found`);
      }

      const variant = {
        format: params.format,
        width: params.width,
        height: params.height,
        url: params.url,
      };
      media.variants.push(variant);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ message: 'Media variant registered.', mediaId: params.mediaId, variant }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'remove_media',
    '[WRITE] Remove media attachment from a story hero or detach an asset.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      removeHeroImage: z.boolean().default(true).describe('Whether to clear the story heroImageUrl'),
    },
    async ({ storyId, removeHeroImage }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:media');

      if (removeHeroImage) {
        await storyService.updateStory(
          storyId,
          { heroImageUrl: undefined },
          {
            organizationId: principal.organizationId,
            authorId: principal.id,
            clientType: principal.clientType,
            createdVia: 'mcp',
          }
        );
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({ message: 'Media removed from story.', storyId }) }],
      };
    }
  );
}
