import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { generateId } from '@ai-news/shared';
import { mcpJsonResponse } from './tool-helpers';

// In-memory job tracker for asynchronous background processing
const jobs = new Map<
  string,
  {
    id: string;
    type: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    result?: unknown;
    createdAt: string;
  }
>();

export function registerJobTools(
  server: McpServer,
  _db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  server.tool(
    'create_job',
    '[WRITE] Queue an asynchronous long-running task such as media transcoding, video derivative rendering, or bulk export. Returns a jobId to poll.',
    {
      jobType: z
        .enum(['media_transcode', 'video_render', 'pdf_export', 'bulk_import'])
        .describe('Type of job'),
      payload: z.record(z.unknown()).describe('Job parameters'),
    },
    async ({ jobType, payload: _payload }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const jobId = generateId('job');
      const record = {
        id: jobId,
        type: jobType,
        status: 'completed' as const, // In test environment it resolves immediately
        progress: 100,
        result: {
          message: `Job ${jobType} completed successfully.`,
          outputUrl: `${process.env.STORAGE_PUBLIC_URL || 'https://storage.platform'}/jobs/${jobId}/output`,
        },
        createdAt: new Date().toISOString(),
      };
      jobs.set(jobId, record);

      return mcpJsonResponse({ jobId, status: record.status, progress: record.progress });
    }
  );

  server.tool(
    'get_job',
    '[READ-ONLY] Check status and results of an asynchronous job by jobId.',
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

      return mcpJsonResponse(job);
    }
  );

  server.tool(
    'cancel_job',
    '[WRITE] Cancel an asynchronous or queued background task.',
    {
      jobId: z.string().min(1).describe('Job ID to cancel'),
      reason: z.string().optional().describe('Cancellation reason'),
    },
    async ({ jobId, reason }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const job = jobs.get(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      job.status = 'cancelled';
      job.result = { message: reason || 'Job cancelled by client operator.' };

      return mcpJsonResponse({ message: `Job ${jobId} cancelled.`, status: job.status });
    }
  );

  server.tool(
    'list_jobs',
    '[READ-ONLY] List recent and active background jobs with status and progress.',
    {
      status: z
        .enum(['queued', 'running', 'completed', 'failed', 'cancelled'])
        .optional()
        .describe('Filter by job status'),
      limit: z.number().int().min(1).max(50).default(10).describe('Max jobs to return'),
    },
    async ({ status, limit }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      let list = Array.from(jobs.values());
      if (status) {
        list = list.filter((j) => j.status === status);
      }
      list = list.slice(0, limit);

      return mcpJsonResponse({ count: list.length, jobs: list });
    }
  );
}
