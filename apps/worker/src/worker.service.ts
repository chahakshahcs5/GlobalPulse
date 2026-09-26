import {
  QueueManager,
  MediaProcessingPayload,
  SearchIndexingPayload,
  AudioBriefingPayload,
  PdfExportPayload,
} from '@ai-news/jobs';
import { logger } from '@ai-news/observability';

export class WorkerService {
  private queue: QueueManager;

  constructor(queue: QueueManager) {
    this.queue = queue;
    this.registerAllHandlers();
  }

  private registerAllHandlers(): void {
    // 1. Media Variant Processing
    this.queue.registerHandler<MediaProcessingPayload, any>(
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
    this.queue.registerHandler<SearchIndexingPayload, any>(
      'search.index_story',
      async (job, updateProgress) => {
        const { storyId, versionNumber, title, summary, textContent } = job.payload;
        logger.info(`Indexing story [${storyId}] (v${versionNumber}) for hybrid search`);
        
        updateProgress(30);
        // Tokenize and extract keywords
        const tokens = `${title} ${summary} ${textContent}`
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(Boolean);

        updateProgress(70);
        // 1536-dimensional mock embedding vector
        const embedding = Array.from({ length: 16 }, (_, i) => Math.sin(i + tokens.length));

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

    // 3. Audio Briefing Generation
    this.queue.registerHandler<AudioBriefingPayload, any>(
      'audio.generate_briefing',
      async (job, updateProgress) => {
        const { storyId, voice, scriptText } = job.payload;
        logger.info(`Generating audio briefing for story [${storyId}] with voice [${voice}]`);

        updateProgress(25);
        const words = scriptText.split(/\s+/).length;
        // Approx 150 words per minute
        const estimatedSeconds = Math.max(10, Math.round((words / 150) * 60));

        updateProgress(75);
        const audioUrl = `https://cdn.globalpulse.news/audio/${storyId}_briefing_${voice}.mp3`;

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

    // 4. PDF Archive Export
    this.queue.registerHandler<PdfExportPayload, any>(
      'export.generate_pdf',
      async (job, updateProgress) => {
        const { storyId, versionNumber, layout } = job.payload;
        logger.info(`Generating PDF archive export for story [${storyId}] v${versionNumber}`);

        updateProgress(50);
        const pdfUrl = `https://cdn.globalpulse.news/archive/${storyId}_v${versionNumber}_${layout}.pdf`;

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
