import { StoryBlockSchema, type StoryBlock } from '@ai-news/schemas';
import { ValidationError } from '@ai-news/shared';

export function validateBlock(raw: unknown): StoryBlock {
  const result = StoryBlockSchema.safeParse(raw);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new ValidationError(`Invalid block data: ${errorDetails}`, result.error.errors);
  }
  return result.data;
}

export function validateBlocks(rawBlocks: unknown[]): StoryBlock[] {
  if (!Array.isArray(rawBlocks)) {
    throw new ValidationError('Blocks must be an array');
  }
  return rawBlocks.map((b, idx) => {
    const block = validateBlock(b);
    return { ...block, sortOrder: block.sortOrder ?? idx };
  });
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  return (
    text
      // Strip dangerous tags: <script>, <iframe>, <object>, <embed>, <base>, <meta>, <style>, <link>
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<\/?(?:iframe|object|embed|base|meta|style|link)\b[^>]*>/gi, '')
      // Strip inline event handler attributes like onerror=, onload=, onclick=
      .replace(/\bon[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      // Strip javascript: pseudo-protocols
      .replace(/(?:href|src)\s*=\s*['"]?\s*javascript:[^'"]*['"]?/gi, '')
  );
}

export function sanitizeBlock(block: StoryBlock): StoryBlock {
  const cloned = JSON.parse(JSON.stringify(block)) as StoryBlock;
  if ('text' in cloned.data && typeof cloned.data.text === 'string') {
    cloned.data.text = sanitizeText(cloned.data.text);
  }
  return cloned;
}

export function extractTextContent(blocks: StoryBlock[]): string {
  const fragments: string[] = [];
  for (const block of blocks) {
    switch (block.blockType) {
      case 'heading':
        fragments.push(block.data.text);
        if (block.data.subtext) fragments.push(block.data.subtext);
        break;
      case 'paragraph':
        fragments.push(block.data.text);
        break;
      case 'summary':
        fragments.push(block.data.headline);
        fragments.push(...block.data.bulletPoints);
        break;
      case 'quote':
        fragments.push(block.data.quote, block.data.attribution);
        break;
      case 'chart':
        fragments.push(block.data.title);
        if (block.data.subtitle) fragments.push(block.data.subtitle);
        break;
      case 'timeline':
        if (block.data.title) fragments.push(block.data.title);
        for (const item of block.data.items) {
          fragments.push(item.headline, item.body);
        }
        break;
      case 'statistic':
        fragments.push(block.data.label, block.data.value);
        if (block.data.context) fragments.push(block.data.context);
        break;
      case 'what_changed':
        for (const item of block.data.items) {
          fragments.push(item.description);
        }
        break;
      case 'image_diff':
        if (block.data.caption) fragments.push(block.data.caption);
        fragments.push(block.data.beforeLabel, block.data.afterLabel);
        break;
      case 'live_ticker':
        if (block.data.title) fragments.push(block.data.title);
        for (const it of block.data.items) {
          fragments.push(it.label, it.symbol);
        }
        break;
      case 'poll':
        fragments.push(block.data.question);
        for (const opt of block.data.options) {
          fragments.push(opt.text);
        }
        break;
      case 'document_viewer':
        fragments.push(block.data.title);
        if (block.data.description) fragments.push(block.data.description);
        for (const hl of block.data.highlights) {
          fragments.push(hl.excerpt);
          if (hl.note) fragments.push(hl.note);
        }
        break;
      default:
        break;
    }
  }
  return fragments.join(' ');
}
