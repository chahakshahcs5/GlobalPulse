export type JobType =
  | 'media.process_variant'
  | 'search.index_story'
  | 'audio.generate_briefing'
  | 'export.generate_pdf'
  | 'cache.purge';

export type JobStatus = 'queued' | 'active' | 'completed' | 'failed';

export interface MediaProcessingPayload {
  mediaId: string;
  sourceUrl: string;
  formats: ('webp' | 'avif' | 'jpeg')[];
  dimensions: Array<{ width: number; height: number; suffix: string }>;
}

export interface SearchIndexingPayload {
  storyId: string;
  versionNumber: number;
  title: string;
  summary: string;
  textContent: string;
  topicIds?: string[];
  entityIds?: string[];
}

export interface AudioBriefingPayload {
  storyId: string;
  voice: 'news_anchor_m' | 'news_anchor_f' | 'conversational';
  scriptText: string;
  durationEstimateSeconds?: number;
}

export interface PdfExportPayload {
  storyId: string;
  versionNumber: number;
  layout: 'a4' | 'letter';
  includeVisuals: boolean;
}

export interface JobRecord<T = unknown> {
  id: string;
  type: JobType;
  payload: T;
  status: JobStatus;
  progress: number; // 0 - 100
  result?: unknown;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export type JobHandler<T = any, R = any> = (
  job: JobRecord<T>,
  updateProgress: (pct: number) => void
) => Promise<R>;
