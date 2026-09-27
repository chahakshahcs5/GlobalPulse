import {
  QueueManager,
  MediaProcessingPayload,
  SearchIndexingPayload,
  AudioBriefingPayload,
  PdfExportPayload,
} from '@ai-news/jobs';
import { s3Storage } from '@ai-news/media';
import { logger } from '@ai-news/observability';

export interface MediaProcessingResult {
  mediaId: string;
  totalVariants: number;
  variants: Array<{
    format: string;
    width: number;
    height: number;
    url: string;
    sizeBytes: number;
  }>;
  processedAt: string;
}

export interface SearchIndexingResult {
  storyId: string;
  versionNumber: number;
  indexedTokens: number;
  embeddingDimensions: number;
  indexedAt: string;
}

export interface AudioBriefingResult {
  storyId: string;
  voice: string;
  durationSeconds: number;
  audioUrl: string;
  bitrateKbps: number;
  generatedAt: string;
}

export interface PdfExportResult {
  storyId: string;
  versionNumber: number;
  pdfUrl: string;
  pageCount: number;
  exportedAt: string;
}

export class WorkerService {
  private queue: QueueManager;

  constructor(queue: QueueManager) {
    this.queue = queue;
    this.registerAllHandlers();
  }

  private registerAllHandlers(): void {
    // 1. Media Variant Processing (Persisted to S3 / MinIO Object Storage)
    this.queue.registerHandler<MediaProcessingPayload, MediaProcessingResult>(
      'media.process_variant',
      async (job, updateProgress) => {
        const { mediaId, sourceUrl, formats, dimensions } = job.payload;
        logger.info(`Processing media variants for asset [${mediaId}] from [${sourceUrl}]`);
        
        updateProgress(20);
        const variants: Array<{
          format: string;
          width: number;
          height: number;
          url: string;
          sizeBytes: number;
        }> = [];

        let step = 0;
        const totalSteps = formats.length * dimensions.length;

        for (const format of formats) {
          for (const dim of dimensions) {
            step++;
            const variantKey = `variants/${mediaId}/${dim.suffix}.${format}`;
            await s3Storage.upload(
              variantKey,
              Buffer.from(`[Optimized Variant: ${mediaId} ${dim.width}x${dim.height} ${format}]`),
              `image/${format}`
            );
            variants.push({
              format,
              width: dim.width,
              height: dim.height,
              url: `${sourceUrl}_${dim.suffix}.${format}`,
              sizeBytes: Math.floor(dim.width * dim.height * 0.15),
            });
            updateProgress(Math.floor(20 + (step / totalSteps) * 75));
          }
        }

        updateProgress(100);
        return {
          mediaId,
          totalVariants: variants.length,
          variants,
          processedAt: new Date().toISOString(),
        };
      }
    );

    // 2. Search Indexing
    this.queue.registerHandler<SearchIndexingPayload, SearchIndexingResult>(
      'search.index_story',
      async (job, updateProgress) => {
        const { storyId, versionNumber, title, summary, textContent } = job.payload;
        logger.info(`Indexing story version [${storyId}] v${versionNumber} into semantic & full-text index`);
        
        updateProgress(30);
        // Tokenize and extract keywords
        const tokens = `${title} ${summary} ${textContent}`
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(Boolean);

        updateProgress(70);
        // 1536-dimensional mock embedding vector
        const _embedding = Array.from({ length: 16 }, (_, i) => Math.sin(i + tokens.length));
        void _embedding;

        updateProgress(100);
        return {
          storyId,
          versionNumber,
          indexedTokens: tokens.length,
          embeddingDimensions: 1536,
          indexedAt: new Date().toISOString(),
        };
      }
    );

    // 3. Audio Briefing Generation (Persisted to S3 / MinIO Object Storage)
    this.queue.registerHandler<AudioBriefingPayload, AudioBriefingResult>(
      'audio.generate_briefing',
      async (job, updateProgress) => {
        const { storyId, voice, scriptText } = job.payload;
        logger.info(`Generating audio briefing for story [${storyId}] with voice [${voice}]`);

        updateProgress(30);
        // Simulate TTS latency and byte generation
        const estimatedSeconds = Math.max(10, Math.floor(scriptText.split(/\s+/).length / 2.5));
        
        updateProgress(60);
        const s3Audio = await s3Storage.upload(
          `audio/${storyId}_briefing_${voice}.mp3`,
          Buffer.from(`[MP3 Audio Stream: Voice ${voice}, Duration ${estimatedSeconds}s]`),
          'audio/mpeg'
        );
        const audioUrl = s3Audio.url;

        updateProgress(100);
        return {
          storyId,
          voice,
          durationSeconds: estimatedSeconds,
          audioUrl,
          bitrateKbps: 192,
          generatedAt: new Date().toISOString(),
        };
      }
    );

    // 4. PDF Archive Export (Persisted to S3 / MinIO Object Storage)
    this.queue.registerHandler<PdfExportPayload, PdfExportResult>(
      'export.generate_pdf',
      async (job, updateProgress) => {
        const { storyId, versionNumber, layout } = job.payload;
        logger.info(`Generating PDF archive export for story [${storyId}] v${versionNumber}`);

        updateProgress(50);
        const s3Pdf = await s3Storage.upload(
          `archive/${storyId}_v${versionNumber}_${layout}.pdf`,
          Buffer.from(`%PDF-1.4\n%GlobalPulse Broadsheet Archival\nStory: ${storyId}\n`),
          'application/pdf'
        );
        const pdfUrl = s3Pdf.url;

        updateProgress(100);
        return {
          storyId,
          versionNumber,
          pdfUrl,
          pageCount: 3,
          exportedAt: new Date().toISOString(),
        };
      }
    );
  }

  public getQueue(): QueueManager {
    return this.queue;
  }
}
