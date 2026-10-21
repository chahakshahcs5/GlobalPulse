import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  blockOf,
  buildBlockFormSections,
  hintFor,
  payloadOf,
  schemaForType,
  validateBlockPayload,
  type FormField,
  type FormSection,
} from '@ai-news/block-studio';

/**
 * The block, not just its content.
 *
 * A block is more than its words. It says how it is presented, how it is
 * described for readers who cannot see it, where it came from and what it
 * cites — and an editor who cannot see those cannot set them. These tests
 * make sure the studio carries all of it, and that a round trip through the
 * editor loses none of it.
 */
describe('Block Studio payload', () => {
  const chart = {
    id: 'blk_1',
    blockType: 'chart' as const,
    sortOrder: 3,
    data: {
      chartType: 'bar' as const,
      title: 'Reported cases',
      xAxis: { key: 'year', label: 'Year' },
      yAxis: { label: 'Cases' },
      series: [{ name: 'Cases', key: 'cases' }],
      values: [{ year: '2026', cases: 42 }],
    },
    presentation: { width: 'contained' as const, align: 'center' as const },
    accessibility: {
      title: 'Reported cases by year',
      textSummary: 'A bar chart of reported cases, rising from 2024 to 2026.',
    },
    provenance: {
      source: 'Ministry of Health',
      methodology: 'Figures as published on 1 October.',
      license: 'CC BY 4.0',
    },
    citationIds: ['src_1', 'src_2'],
    sourceIds: ['src_1'],
    metadata: { desk: 'health' },
  };

  it('reads the whole block off a block', () => {
    const payload = payloadOf(chart);

    expect(payload.data).toEqual(chart.data);
    expect(payload.presentation).toEqual(chart.presentation);
    expect(payload.accessibility?.textSummary).toBe(
      'A bar chart of reported cases, rising from 2024 to 2026.'
    );
    expect(payload.provenance?.license).toBe('CC BY 4.0');
    expect(payload.citationIds).toEqual(['src_1', 'src_2']);
    expect(payload.sourceIds).toEqual(['src_1']);
    expect(payload.metadata).toEqual({ desk: 'health' });
  });

  it('does not invent envelope fields the block does not have', () => {
    const payload = payloadOf({ data: { text: 'Hello' } });

    expect(payload.presentation).toBeUndefined();
    expect(payload.accessibility).toBeUndefined();
    expect(payload.provenance).toBeUndefined();
    expect(payload.citationIds).toBeUndefined();
  });

  it('carries the whole block through a round trip', () => {
    const payload = payloadOf(chart);
    const rebuilt = blockOf('chart', 'blk_1', 3, payload) as unknown as typeof chart;

    expect(rebuilt).toEqual(chart);
  });

  it('keeps the envelope when the content is replaced', () => {
    // Picking a variant replaces the content. What the block says about
    // itself belongs to the block, so it must survive.
    const payload = payloadOf(chart);
    const swapped = { ...payload, data: { ...payload.data, title: 'A different title' } };

    expect(swapped.accessibility).toEqual(chart.accessibility);
    expect(swapped.provenance).toEqual(chart.provenance);
    expect(swapped.presentation).toEqual(chart.presentation);
  });

  it('validates the envelope, not just the content', () => {
    const result = validateBlockPayload('chart', {
      data: chart.data,
      presentation: { width: 'enormous' as never },
    });

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.path)).toContain('presentation.width');
  });

  it('reports content problems against the content path', () => {
    const result = validateBlockPayload('chart', {
      data: { ...chart.data, chartType: 'not_a_chart_type' as never },
    });

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.path)).toContain('data.chartType');
  });

  it('accepts a block with a presentation and no content problems', () => {
    const result = validateBlockPayload('chart', payloadOf(chart));

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });
});

/**
 * The form, section by section.
 *
 * The inspector used to be one flat list of the block's content. It is now
 * the block's anatomy — content, presentation, accessibility, provenance,
 * citations — and the hints decide how each field is edited.
 */
describe('Block Studio form sections', () => {
  const sections = buildBlockFormSections('chart', schemaForType('chart')!);

  const section = (id: string): FormSection | undefined =>
    sections.find((candidate) => candidate.id === id);

  /** Every field of a section, whatever group it is in. */
  const fieldsOf = (id: string): FormField[] =>
    (section(id)?.groups ?? []).flatMap((group) => group.fields);

  const field = (id: string, key: string): FormField | undefined =>
    fieldsOf(id).find((candidate) => candidate.key === key);

  it('splits a block into its parts', () => {
    expect(sections.map((candidate) => candidate.id)).toEqual([
      'content',
      'presentation',
      'accessibility',
      'provenance',
      'citations',
    ]);
  });

  it('leaves out a section the schema does not declare', () => {
    // A block type whose schema carries no envelope at all gets only its
    // content — the inspector never shows an empty section.
    const bare = z.object({
      id: z.string(),
      blockType: z.string(),
      sortOrder: z.number(),
      data: z.object({ text: z.string() }),
    });

    const plain = buildBlockFormSections('bare', bare);

    expect(plain.map((candidate) => candidate.id)).toEqual(['content']);
  });

  it('exposes the presentation options', () => {
    const keys = fieldsOf('presentation').map((candidate) => candidate.key);

    expect(keys).toEqual(['width', 'align', 'theme']);
  });

  it('exposes the accessibility and provenance fields', () => {
    expect(fieldsOf('accessibility').map((candidate) => candidate.key)).toEqual([
      'title',
      'description',
      'textSummary',
    ]);
    expect(fieldsOf('provenance').map((candidate) => candidate.key)).toContain('methodology');
    expect(fieldsOf('provenance').map((candidate) => candidate.key)).toContain('license');
  });

  it('exposes the citation lists', () => {
    expect(fieldsOf('citations').map((candidate) => candidate.key)).toEqual([
      'citationIds',
      'sourceIds',
    ]);
  });

  it('groups the fields of a section', () => {
    const groups = section('content')?.groups ?? [];
    const ids = groups.map((group) => group.id);

    expect(ids).toContain('Chart');
    expect(ids).toContain('Headline');
    expect(ids).toContain('Axes');
    expect(ids).toContain('Data');
  });

  it('orders the fields within a group', () => {
    const headline = section('content')?.groups.find((group) => group.id === 'Headline');
    const keys = (headline?.fields ?? []).map((candidate) => candidate.key);

    expect(keys).toEqual(['title', 'subtitle', 'caption']);
  });

  it('gives a colour a swatch picker', () => {
    const series = field('content', 'series');
    const colour = series?.item?.fields?.find((candidate) => candidate.key === 'color');

    expect(colour?.control).toBe('color');
  });

  it('gives a short list of options a row of buttons', () => {
    expect(field('content', 'chartType')?.control).toBeUndefined();
    expect(field('content', 'legend')?.fields?.find((c) => c.key === 'position')?.control).toBe(
      'segment'
    );
  });

  it('says when a field only applies in some circumstances', () => {
    expect(field('content', 'facetField')?.visibleWhen).toEqual({
      field: 'data.chartType',
      equals: 'small_multiples',
    });
  });

  it('carries the guidance a hint attached to a field', () => {
    expect(field('content', 'altText')?.help).toBeUndefined();
    expect(field('content', 'chartType')?.help).toBeTruthy();
  });
});

/**
 * The hints themselves.
 */
describe('Block Studio hints', () => {
  it('matches a field inside a list whatever its index', () => {
    expect(hintFor('chart', 'data.series[].color')?.control).toBe('color');
    expect(hintFor('chart', 'data.series.0.color')?.control).toBe('color');
    expect(hintFor('chart', 'data.series.12.color')?.control).toBe('color');
  });

  it('has no hint for a field it does not describe', () => {
    expect(hintFor('chart', 'data.chartType')?.control).toBeUndefined();
    expect(hintFor('not_a_block_type', 'data.anything')).toBeUndefined();
  });
});
