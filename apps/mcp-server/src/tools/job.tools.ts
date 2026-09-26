import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { generateId } from '@ai-news/shared';

// In-memory mock job tracker for async operations
const jobs = new Map<
  string,
  {
    id: string;
    type: string;
    status: 'queued' | 'running' | 'completed' | 'failed';
    progress: number;
    result?: unknown;
    createdAt: string;
  }
>();

export function registerJobTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  server.tool(
    'create_job',
    'Queue an asynchronous long-running task such as media transcoding, video derivative rendering, or bulk export. Returns a jobId to poll.',
    {
      jobType: z.enum(['media_transcode', 'video_render', 'pdf_export', 'bulk_import']).describe('Type of job'),
      payload: z.record(z.unknown()).describe('Job parameters'),
    },
    async ({ jobType, payload }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const jobId = generateId('job');
      const record = {
        id: jobId,
        type: jobType,
        status: 'completed' as const, // In test environment it resolves immediately
        progress: 100,
        result: { message: `Job ${jobType} completed successfully.`, outputUrl: `https://storage.platform/jobs/${jobId}/output` },
        createdAt: new Date().toISOString(),
      };
      jobs.set(jobId, record);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ jobId, status: record.status, progress: record.progress }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'get_job',
    'Check status and results of an asynchronous job by jobId.',
    {
      jobId: z.string().min(1),
    },
    async ({ jobId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const job = jobs.get(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(job, null, 2) }],
      };
    }
  );
}
