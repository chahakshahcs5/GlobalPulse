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
      .replace(/^\s*javascript:[^'"]*/gi, '')
  );
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeText(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const res: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      res[k] = sanitizeValue(v);
    }
    return res;
  }
  return value;
}

export function sanitizeBlock(block: StoryBlock): StoryBlock {
  const cloned = JSON.parse(JSON.stringify(block)) as StoryBlock;
  if (cloned.data && typeof cloned.data === 'object') {
    cloned.data = sanitizeValue(cloned.data) as typeof cloned.data;
  }
  if (cloned.accessibility && typeof cloned.accessibility === 'object') {
    cloned.accessibility = sanitizeValue(cloned.accessibility) as typeof cloned.accessibility;
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
        for (const annotation of block.data.annotations ?? []) {
          fragments.push(annotation.label, annotation.body);
        }
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
      case 'uncertainty':
        fragments.push(block.data.title);
        if (block.data.subtitle) fragments.push(block.data.subtitle);
        for (const point of block.data.points) {
          fragments.push(point.label);
          if (point.note) fragments.push(point.note);
        }
        break;
      case 'animated_map':
        fragments.push(block.data.title);
        if (block.data.description) fragments.push(block.data.description);
        for (const frame of block.data.frames) {
          if (frame.label) fragments.push(frame.label);
          for (const point of frame.points) {
            fragments.push(point.label);
          }
        }
        break;
      case 'knowledge_graph':
        fragments.push(block.data.title);
        if (block.data.description) fragments.push(block.data.description);
        for (const node of block.data.nodes) {
          fragments.push(node.label);
        }
        break;
      case 'quiz':
        fragments.push(block.data.title);
        if (block.data.description) fragments.push(block.data.description);
        for (const question of block.data.questions) {
          fragments.push(question.question);
          for (const option of question.options) {
            fragments.push(option.text);
          }
          if (question.explanation) fragments.push(question.explanation);
        }
        break;
      case 'correlation':
        fragments.push(block.data.title);
        if (block.data.subtitle) fragments.push(block.data.subtitle);
        for (const variable of block.data.variables) {
          fragments.push(variable.label);
        }
        break;
      case 'sensitivity':
        fragments.push(block.data.title);
        if (block.data.subtitle) fragments.push(block.data.subtitle);
        fragments.push(block.data.outputLabel);
        for (const input of block.data.inputs) {
          fragments.push(input.label);
          if (input.note) fragments.push(input.note);
        }
        break;
      case 'live_comments':
        fragments.push(block.data.title);
        if (block.data.description) fragments.push(block.data.description);
        break;
      case 'what_if':
        fragments.push(block.data.title);
        if (block.data.description) fragments.push(block.data.description);
        fragments.push(block.data.outcomeLabel);
        for (const input of block.data.inputs) {
          fragments.push(input.label);
          if (input.note) fragments.push(input.note);
        }
        for (const component of block.data.breakdown ?? []) {
          fragments.push(component.label);
        }
        break;
      case 'prediction_leaderboard':
        fragments.push(block.data.title);
        if (block.data.subtitle) fragments.push(block.data.subtitle);
        for (const prediction of block.data.predictions) {
          fragments.push(prediction.forecaster, prediction.claim);
          if (prediction.note) fragments.push(prediction.note);
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
      case 'sankey':
        if (block.data.title) fragments.push(block.data.title);
        if (block.data.subtitle) fragments.push(block.data.subtitle);
        if (block.data.caption) fragments.push(block.data.caption);
        for (const node of block.data.nodes) {
          fragments.push(node.label);
        }
        break;
      case 'treemap':
        if (block.data.title) fragments.push(block.data.title);
        if (block.data.subtitle) fragments.push(block.data.subtitle);
        if (block.data.caption) fragments.push(block.data.caption);
        for (const node of block.data.nodes) {
          fragments.push(node.label);
        }
        break;
      case 'network_graph':
        if (block.data.title) fragments.push(block.data.title);
        if (block.data.subtitle) fragments.push(block.data.subtitle);
        if (block.data.caption) fragments.push(block.data.caption);
        for (const node of block.data.nodes) {
          fragments.push(node.label);
          if (node.group) fragments.push(node.group);
        }
        break;
      case 'regression':
        if (block.data.title) fragments.push(block.data.title);
        if (block.data.subtitle) fragments.push(block.data.subtitle);
        if (block.data.caption) fragments.push(block.data.caption);
        if (block.data.xLabel) fragments.push(block.data.xLabel);
        if (block.data.yLabel) fragments.push(block.data.yLabel);
        break;
      case 'anomaly':
        if (block.data.title) fragments.push(block.data.title);
        if (block.data.subtitle) fragments.push(block.data.subtitle);
        if (block.data.caption) fragments.push(block.data.caption);
        break;
      case 'survey_results':
        if (block.data.title) fragments.push(block.data.title);
        if (block.data.subtitle) fragments.push(block.data.subtitle);
        if (block.data.caption) fragments.push(block.data.caption);
        fragments.push(block.data.question);
        for (const response of block.data.responses) {
          fragments.push(response.option);
        }
        for (const segment of block.data.segments ?? []) {
          fragments.push(segment.label);
        }
        break;
      case 'scrolly':
        if (block.data.title) fragments.push(block.data.title);
        if (block.data.caption) fragments.push(block.data.caption);
        for (const step of block.data.steps) {
          if (step.heading) fragments.push(step.heading);
          if (step.body) fragments.push(step.body);
          if (step.visual.kind === 'stat') {
            fragments.push(step.visual.value, step.visual.label);
            if (step.visual.delta) fragments.push(step.visual.delta);
          }
          if (step.visual.kind === 'text') fragments.push(step.visual.text);
          if (step.visual.kind === 'chart') fragments.push(step.visual.chart.title);
        }
        break;
      case 'motion_chart':
        if (block.data.title) fragments.push(block.data.title);
        if (block.data.subtitle) fragments.push(block.data.subtitle);
        if (block.data.caption) fragments.push(block.data.caption);
        fragments.push(block.data.chart.title);
        break;
      case 'sandbox':
        if (block.data.title) fragments.push(block.data.title);
        if (block.data.caption) fragments.push(block.data.caption);
        if (block.data.accessibilityText) fragments.push(block.data.accessibilityText);
        break;
      case 'scene_3d':
        if (block.data.title) fragments.push(block.data.title);
        if (block.data.subtitle) fragments.push(block.data.subtitle);
        if (block.data.caption) fragments.push(block.data.caption);
        if (block.data.alt) fragments.push(block.data.alt);
        break;
      case 'map':
        if (block.data.title) fragments.push(block.data.title);
        for (const marker of block.data.markers ?? []) {
          fragments.push(marker.title);
          if (marker.description) fragments.push(marker.description);
        }
        for (const route of block.data.routes ?? []) {
          fragments.push(route.name);
          if (route.description) fragments.push(route.description);
        }
        for (const region of block.data.comparisonRegionIds ?? []) {
          fragments.push(region);
        }
        break;
      case 'map_3d':
        if (block.data.title) fragments.push(block.data.title);
        if (block.data.subtitle) fragments.push(block.data.subtitle);
        if (block.data.caption) fragments.push(block.data.caption);
        for (const marker of block.data.markers ?? []) {
          fragments.push(marker.title);
          if (marker.description) fragments.push(marker.description);
        }
        break;
      default:
        break;
    }
  }
  return fragments.join(' ');
}
