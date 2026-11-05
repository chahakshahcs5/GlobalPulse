import { describe, expect, it } from 'vitest';
import { detectMediaType, validateMediaUpload } from '@ai-news/media';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const PDF = Buffer.from('%PDF-1.4\n', 'ascii');

describe('Media magic-byte inspection', () => {
  it('detects common image and document signatures', () => {
    expect(detectMediaType(PNG)?.mimeType).toBe('image/png');
    expect(detectMediaType(JPEG)?.mimeType).toBe('image/jpeg');
    expect(detectMediaType(PDF)?.mimeType).toBe('application/pdf');
  });

  it('accepts a matching declared type', () => {
    expect(validateMediaUpload(PNG, 'image/png').valid).toBe(true);
    expect(validateMediaUpload(PNG, 'application/octet-stream').detected?.mimeType).toBe(
      'image/png'
    );
  });

  it('rejects a declared type that does not match the bytes', () => {
    const result = validateMediaUpload(PNG, 'image/jpeg');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('does not match');
  });

  it('rejects unrecognized content', () => {
    expect(validateMediaUpload(Buffer.from('not a media file'), 'image/png').valid).toBe(false);
  });
});
