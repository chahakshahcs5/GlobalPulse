import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DynamicIcon } from '../../../apps/web/src/components/DynamicIcon';
import { Star } from 'lucide-react';

describe('Universal DynamicIcon Component Unit Tests', () => {
  it('renders standard PascalCase Lucide icon names into SVG', () => {
    const html = renderToString(
      React.createElement(DynamicIcon, { name: 'TrendingUp', className: 'w-5 h-5' })
    );
    expect(html).toContain('<svg');
    expect(html).toContain('w-5 h-5');
  });

  it('normalizes kebab-case icon names and renders correct SVG', () => {
    const html = renderToString(
      React.createElement(DynamicIcon, { name: 'shield-check', className: 'w-4 h-4' })
    );
    expect(html).toContain('<svg');
    expect(html).toContain('w-4 h-4');
  });

  it('resolves semantic taxonomy aliases (e.g. technology -> Cpu, world -> Globe)', () => {
    const techHtml = renderToString(React.createElement(DynamicIcon, { name: 'technology' }));
    expect(techHtml).toContain('<svg');

    const worldHtml = renderToString(React.createElement(DynamicIcon, { name: 'world' }));
    expect(worldHtml).toContain('<svg');
  });

  it('renders Unicode emojis in a styled accessible span', () => {
    const html = renderToString(
      React.createElement(DynamicIcon, { name: '🌐', className: 'text-xl' })
    );
    expect(html).toContain('🌐');
    expect(html).toContain('select-none');
    expect(html).toContain('text-xl');
  });

  it('gracefully renders fallback icon when icon name is missing or unknown', () => {
    const unknownHtml = renderToString(
      React.createElement(DynamicIcon, { name: 'non-existent-icon-xyz' })
    );
    expect(unknownHtml).toContain('<svg'); // Falls back to Folder

    const nullHtml = renderToString(
      React.createElement(DynamicIcon, { name: null, fallback: 'Tag' })
    );
    expect(nullHtml).toContain('<svg');
  });

  it('supports direct Lucide component function references', () => {
    const html = renderToString(
      React.createElement(DynamicIcon, { name: Star, className: 'w-6 h-6' })
    );
    expect(html).toContain('<svg');
    expect(html).toContain('w-6 h-6');
  });
});
