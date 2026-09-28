/**
 * Reading metrics calculator for stories and multimedia blocks.
 * Standard speed: 200 words per minute for text, plus visual pause for media blocks.
 */

export interface WordCountAndReadingTime {
  wordCount: number;
  readingTimeMinutes: number;
}

/**
 * Recursively or directly extracts text from string or story blocks and calculates word count.
 */
export function calculateWordCount(content: string | unknown[]): number {
  if (!content) return 0;

  if (typeof content === 'string') {
    const words = content.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }

  if (Array.isArray(content)) {
    let total = 0;
    for (const item of content) {
      if (!item || typeof item !== 'object') continue;
      const block = item as Record<string, any>;
      const data = block.data || block;

      // Extract text based on block types
      if (typeof data.text === 'string') {
        total += calculateWordCount(data.text);
      }
      if (typeof data.content === 'string') {
        total += calculateWordCount(data.content);
      }
      if (typeof data.caption === 'string') {
        total += calculateWordCount(data.caption);
      }
      if (typeof data.quote === 'string') {
        total += calculateWordCount(data.quote);
      }
      if (Array.isArray(data.items)) {
        for (const listItem of data.items) {
          if (typeof listItem === 'string') {
            total += calculateWordCount(listItem);
          } else if (
            listItem &&
            typeof listItem === 'object' &&
            typeof listItem.text === 'string'
          ) {
            total += calculateWordCount(listItem.text);
          }
        }
      }
      if (Array.isArray(data.rows)) {
        for (const row of data.rows) {
          if (Array.isArray(row)) {
            for (const cell of row) {
              if (typeof cell === 'string') total += calculateWordCount(cell);
            }
          }
        }
      }
    }
    return total;
  }

  return 0;
}

/**
 * Calculates reading time in minutes based on word count and media blocks.
 * - Text: 200 WPM
 * - Visual Media (image, chart, video): ~12-15 seconds per media item
 */
export function calculateReadingTimeMinutes(
  wordCount: number,
  mediaBlockCount: number = 0,
  wordsPerMinute: number = 200
): number {
  if (wordCount <= 0 && mediaBlockCount <= 0) return 0;

  const textMinutes = wordCount / wordsPerMinute;
  const mediaMinutes = (mediaBlockCount * 12) / 60; // 12 seconds per image/graphic
  const total = textMinutes + mediaMinutes;

  return Math.max(1, Math.ceil(total));
}

/**
 * Utility to calculate both word count and reading time from story title, summary, and blocks.
 */
export function computeStoryReadingMetrics(story: {
  title?: string;
  summary?: string;
  blocks?: Array<{ blockType?: string; data?: any }>;
}): WordCountAndReadingTime {
  let wordCount = 0;
  if (story.title) wordCount += calculateWordCount(story.title);
  if (story.summary) wordCount += calculateWordCount(story.summary);

  let mediaCount = 0;
  if (Array.isArray(story.blocks)) {
    wordCount += calculateWordCount(story.blocks);
    for (const block of story.blocks) {
      const type = block.blockType || '';
      if (['image', 'video', 'chart', 'infographic', 'map', 'timeline'].includes(type)) {
        mediaCount++;
      }
    }
  }

  const readingTimeMinutes = calculateReadingTimeMinutes(wordCount, mediaCount);
  return { wordCount, readingTimeMinutes };
}
