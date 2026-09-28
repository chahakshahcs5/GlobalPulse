import { describe, it, expect } from 'vitest';
import {
  generateValidPng,
  generateValidMp3,
  generateValidPdf,
  generateSemanticEmbedding,
} from '../../../apps/worker/src/generators';

describe('Worker Asset & Media Generators Unit Tests', () => {
  describe('PNG Image Generator', () => {
    it('produces a valid binary PNG with correct magic header, IHDR, and IEND chunks', () => {
      const width = 800;
      const height = 450;
      const pngBuf = generateValidPng(width, height, [37, 99, 235]);

      expect(pngBuf).toBeInstanceOf(Buffer);
      expect(pngBuf.length).toBeGreaterThan(100);

      // Check 8-byte PNG signature: 89 50 4E 47 0D 0A 1A 0A
      const signature = pngBuf.subarray(0, 8);
      expect(signature).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

      // Check IHDR chunk
      const ihdrChunkType = pngBuf.subarray(12, 16).toString('ascii');
      expect(ihdrChunkType).toBe('IHDR');

      // Verify encoded width and height in IHDR
      const parsedWidth = pngBuf.readUInt32BE(16);
      const parsedHeight = pngBuf.readUInt32BE(20);
      expect(parsedWidth).toBe(width);
      expect(parsedHeight).toBe(height);

      // Check IEND chunk at end
      const iendStr = pngBuf.subarray(pngBuf.length - 8, pngBuf.length - 4).toString('ascii');
      expect(iendStr).toBe('IEND');
    });
  });

  describe('MP3 Audio Generator', () => {
    it('produces a valid binary MP3 with ID3v2 header and MPEG audio frame sync', () => {
      const mp3Buf = generateValidMp3('sty_audio_test_1', 'news_anchor_m', 30);

      expect(mp3Buf).toBeInstanceOf(Buffer);
      expect(mp3Buf.length).toBeGreaterThan(500);

      // Check ID3v2 tag identifier
      const id3Magic = mp3Buf.subarray(0, 3).toString('ascii');
      expect(id3Magic).toBe('ID3');

      // Verify presence of MPEG-1 Layer 3 frame sync header: 0xFF 0xFB
      let foundSync = false;
      for (let i = 10; i < mp3Buf.length - 1; i++) {
        if (mp3Buf[i] === 0xff && (mp3Buf[i + 1] & 0xe0) === 0xe0) {
          foundSync = true;
          break;
        }
      }
      expect(foundSync).toBe(true);
    });
  });

  describe('PDF Archive Generator', () => {
    it('produces a valid PDF 1.4 document tree with xref and trailer', () => {
      const pdfBuf = generateValidPdf(
        'sty_pdf_test_1',
        2,
        'broadsheet',
        'Quantum supremacy verified by international committee.'
      );

      expect(pdfBuf).toBeInstanceOf(Buffer);
      const pdfText = pdfBuf.toString('utf-8');

      // PDF Version
      expect(pdfText.startsWith('%PDF-1.4')).toBe(true);

      // PDF Structural Objects
      expect(pdfText).toContain('/Type /Catalog');
      expect(pdfText).toContain('/Type /Pages');
      expect(pdfText).toContain('/Type /Page');
      expect(pdfText).toContain('/MediaBox [0 0 612 792]');
      expect(pdfText).toContain('/Type /Font');
      expect(pdfText).toContain('GLOBALPULSE BROADSHEET ARCHIVE');
      expect(pdfText).toContain('Quantum supremacy verified');

      // Cross-reference table and EOF
      expect(pdfText).toContain('xref');
      expect(pdfText).toContain('trailer');
      expect(pdfText.trim().endsWith('%%EOF')).toBe(true);
    });
  });

  describe('Semantic Embedding Projection', () => {
    it('computes 1536-dimensional L2-normalized embedding vector', () => {
      const tokens = ['artificial', 'intelligence', 'breakthrough', 'quantum', 'computing'];
      const vector = generateSemanticEmbedding(tokens, 1536);

      expect(vector).toHaveLength(1536);

      // Calculate L2 norm: sqrt(sum(x_i^2))
      let sumSq = 0;
      for (let i = 0; i < vector.length; i++) {
        sumSq += vector[i] * vector[i];
      }
      const norm = Math.sqrt(sumSq);

      // Norm should be close to 1.0 (within float precision margin)
      expect(norm).toBeGreaterThan(0.98);
      expect(norm).toBeLessThan(1.02);
    });
  });
});
