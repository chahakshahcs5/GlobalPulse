import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';

/**
 * The newsroom's saved block variants, over the REST API.
 *
 * A variant is a named, ready-made payload for a block type. The studio
 * ships a set of them; a newsroom keeps its own on the server, so that
 * everybody editing a story is offered the same treatments.
 *
 * A variant's payload is checked against the block type's own schema
 * before it is stored, because a variant that did not validate would
 * preview a block the platform would refuse to publish.
 */
describe('Block variants (API)', () => {
  let app: FastifyInstance;

  const admin = { authorization: 'Bearer dev-admin' };

  /** A chart payload the platform accepts. */
  const chartPayload = {
    chartType: 'bar',
    title: 'Reported cases by year',
    xAxis: { key: 'year', label: 'Year' },
    yAxis: { label: 'Cases' },
    series: [{ name: 'Cases', key: 'cases' }],
    values: [{ year: '2026', cases: 42 }],
  };

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('saves a variant and lists it', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/block-variants',
      headers: admin,
      payload: {
        blockType: 'chart',
        label: 'Bars, with the axis labelled',
        description: 'The treatment the data desk agreed on.',
        data: chartPayload,
      },
    });

    expect(created.statusCode).toBe(201);
    const variant = JSON.parse(created.body);
    expect(variant.blockType).toBe('chart');
    expect(variant.label).toBe('Bars, with the axis labelled');
    expect(variant.data.chartType).toBe('bar');
    expect(variant.id).toBeTruthy();

    const listed = await app.inject({
      method: 'GET',
      url: '/api/block-variants?blockType=chart',
      headers: admin,
    });

    expect(listed.statusCode).toBe(200);
    const variants = JSON.parse(listed.body);
    expect(variants.some((candidate: { id: string }) => candidate.id === variant.id)).toBe(true);
  });

  it('refuses a variant the block type would reject', async () => {
    const rejected = await app.inject({
      method: 'POST',
      url: '/api/block-variants',
      headers: admin,
      payload: {
        blockType: 'chart',
        label: 'Broken',
        data: { ...chartPayload, chartType: 'not_a_chart_type' },
      },
    });

    expect(rejected.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('refuses a variant of a block type that does not exist', async () => {
    const rejected = await app.inject({
      method: 'POST',
      url: '/api/block-variants',
      headers: admin,
      payload: {
        blockType: 'not_a_block_type',
        label: 'Imaginary',
        data: {},
      },
    });

    expect(rejected.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('refuses a variant with no name', async () => {
    const rejected = await app.inject({
      method: 'POST',
      url: '/api/block-variants',
      headers: admin,
      payload: { blockType: 'chart', label: '', data: chartPayload },
    });

    expect(rejected.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('updates a variant', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/block-variants',
      headers: admin,
      payload: { blockType: 'chart', label: 'To be renamed', data: chartPayload },
    });
    const variant = JSON.parse(created.body);

    const updated = await app.inject({
      method: 'PUT',
      url: `/api/block-variants/${variant.id}`,
      headers: admin,
      payload: { label: 'Renamed', description: 'Now with a note.' },
    });

    expect(updated.statusCode).toBe(200);
    const body = JSON.parse(updated.body);
    expect(body.label).toBe('Renamed');
    expect(body.description).toBe('Now with a note.');
    // The payload is untouched by a change of name.
    expect(body.data.chartType).toBe('bar');
  });

  it('refuses an update that would break the payload', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/block-variants',
      headers: admin,
      payload: { blockType: 'chart', label: 'To be broken', data: chartPayload },
    });
    const variant = JSON.parse(created.body);

    const rejected = await app.inject({
      method: 'PUT',
      url: `/api/block-variants/${variant.id}`,
      headers: admin,
      payload: { data: { ...chartPayload, chartType: 'not_a_chart_type' } },
    });

    expect(rejected.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('removes a variant', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/block-variants',
      headers: admin,
      payload: { blockType: 'chart', label: 'Temporary', data: chartPayload },
    });
    const variant = JSON.parse(created.body);

    const removed = await app.inject({
      method: 'DELETE',
      url: `/api/block-variants/${variant.id}`,
      headers: admin,
    });

    expect(removed.statusCode).toBe(204);

    const listed = await app.inject({
      method: 'GET',
      url: '/api/block-variants?blockType=chart',
      headers: admin,
    });
    const variants = JSON.parse(listed.body);
    expect(variants.some((candidate: { id: string }) => candidate.id === variant.id)).toBe(false);
  });

  it('only lists the variants of the block type asked for', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/block-variants',
      headers: admin,
      payload: {
        blockType: 'image',
        label: 'A picture',
        data: { url: 'https://example.com/a.png', altText: 'A picture of something.' },
      },
    });

    const listed = await app.inject({
      method: 'GET',
      url: '/api/block-variants?blockType=image',
      headers: admin,
    });

    const variants = JSON.parse(listed.body);
    expect(variants.length).toBeGreaterThan(0);
    expect(variants.every((variant: { blockType: string }) => variant.blockType === 'image')).toBe(
      true
    );
  });
});
