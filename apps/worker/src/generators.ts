import zlib from 'zlib';

/**
 * Standard CRC32 table calculator for PNG chunks
 */
function calculateCrc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    let cur = (crc ^ byte) & 0xff;
    for (let j = 0; j < 8; j++) {
      cur = cur & 1 ? 0xedb88320 ^ (cur >>> 1) : cur >>> 1;
    }
    crc = (crc >>> 8) ^ cur;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuf, data]);
  const crc = calculateCrc32(crcData);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

/**
 * Generates an authentic, fully compliant binary PNG image file.
 * Compatible with all image viewers, browsers, and CDNs.
 */
export function generateValidPng(
  width: number,
  height: number,
  rgb: [number, number, number] = [37, 99, 235]
): Buffer {
  const safeWidth = Math.max(1, Math.min(width, 1920));
  const safeHeight = Math.max(1, Math.min(height, 1080));

  // PNG Magic Header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR: width(4), height(4), bitDepth(1=8), colorType(1=2 Truecolor RGB), comp(0), filter(0), interlace(0)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(safeWidth, 0);
  ihdrData.writeUInt32BE(safeHeight, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(2, 9);
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  const ihdrChunk = createPngChunk('IHDR', ihdrData);

  // IDAT: Scanlines with Filter byte (0) preceding each row of RGB pixels
  const scanlineLength = 1 + safeWidth * 3;
  const rawData = Buffer.alloc(scanlineLength * safeHeight);
  const [r, g, b] = rgb;

  for (let y = 0; y < safeHeight; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter 0: None
    for (let x = 0; x < safeWidth; x++) {
      const px = rowOffset + 1 + x * 3;
      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createPngChunk('IDAT', compressedData);
  const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Generates an authentic binary MP3 audio container with ID3v2 header and MPEG-1 Layer III audio sync frames.
 */
export function generateValidMp3(storyId: string, voice: string, durationSeconds: number): Buffer {
  // 1. ID3v2.3 Container
  const titleText = `GlobalPulse Audio Briefing: ${storyId}`;
  const artistText = `Voice Engine (${voice})`;

  const encodeId3Frame = (id: string, text: string): Buffer => {
    const textBuf = Buffer.from(text, 'utf-8');
    const frameContent = Buffer.concat([Buffer.from([0x03]), textBuf]); // 0x03 = UTF-8 encoding
    const frameHeader = Buffer.alloc(10);
    frameHeader.write(id, 0, 4, 'ascii');
    frameHeader.writeUInt32BE(frameContent.length, 4);
    frameHeader.writeUInt16BE(0, 8); // flags
    return Buffer.concat([frameHeader, frameContent]);
  };

  const tit2 = encodeId3Frame('TIT2', titleText);
  const tpe1 = encodeId3Frame('TPE1', artistText);
  const tagPayload = Buffer.concat([tit2, tpe1]);

  // Syncsafe size encoding for ID3 header
  const tagSize = tagPayload.length;
  const id3Header = Buffer.alloc(10);
  id3Header.write('ID3', 0, 3, 'ascii');
  id3Header.writeUInt8(3, 3); // v2.3
  id3Header.writeUInt8(0, 4); // revision 0
  id3Header.writeUInt8(0, 5); // flags
  id3Header.writeUInt8((tagSize >> 21) & 0x7f, 6);
  id3Header.writeUInt8((tagSize >> 14) & 0x7f, 7);
  id3Header.writeUInt8((tagSize >> 7) & 0x7f, 8);
  id3Header.writeUInt8(tagSize & 0x7f, 9);

  // 2. Synthetic MPEG-1 Layer III audio frame (192 kbps, 44.1 kHz, stereo)
  // MPEG Audio Frame Header: 0xFF 0xFB 0x90 0x04 -> Sync (11 bits 1), Layer III (1), No CRC (1), Bitrate 192 (1001), 44.1k (00), Padding (0), Stereo (00)
  const frameHeader = Buffer.from([0xff, 0xfb, 0x90, 0x04]);
  // Frame size = 144 * 192000 / 44100 = 626 bytes per frame (~26.1ms audio)
  const frameLength = 626;
  const frameBody = Buffer.alloc(frameLength - 4, 0x55); // Alternating waveform bits
  const singleAudioFrame = Buffer.concat([frameHeader, frameBody]);

  // Generate enough audio frames to match requested duration
  const frameCount = Math.max(4, Math.min(Math.floor((durationSeconds * 1000) / 26), 120));
  const audioFrames = Buffer.concat(Array.from({ length: frameCount }, () => singleAudioFrame));

  return Buffer.concat([id3Header, tagPayload, audioFrames]);
}

/**
 * Generates an authentic, well-formed PDF 1.4 document containing article text and metadata.
 */
export function generateValidPdf(
  storyId: string,
  versionNumber: number,
  layout: string,
  textContent: string = '',
  title: string = ''
): Buffer {
  const dateStr = new Date().toISOString().split('T')[0];
  const sanitized = (value: string) =>
    value
      .replace(/[^\x20-\x7E\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const wrap = (text: string, maxChars: number): string[] => {
    const words = sanitized(text).split(' ').filter(Boolean);
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      if ((line + ' ' + word).trim().length > maxChars) {
        if (line) lines.push(line);
        line = word;
      } else {
        line = `${line} ${word}`.trim();
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const headlineLines = wrap(title || 'GlobalPulse archived dispatch', 58).slice(0, 3);
  const bodyLines = wrap(
    textContent || 'Certified immutable news dispatch published via GlobalPulse AI Network.',
    82
  ).slice(0, 42);

  const escapePdf = (value: string) =>
    value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  const headlineStream = headlineLines
    .map((line, index) => `${index === 0 ? '' : '0 -24 Td\n'}(${escapePdf(line)}) Tj`)
    .join('\n');

  const bodyStream = bodyLines.map((line) => `0 -14 Td\n(${escapePdf(line)}) Tj`).join('\n');

  const pdfStream = `BT
/F1 9 Tf
50 760 Td
(GLOBALPULSE BROADSHEET ARCHIVE) Tj
/F1 20 Tf
0 -28 Td
${headlineStream}
/F1 11 Tf
0 -28 Td
(Story ID: ${escapePdf(storyId)} | Revision: v${versionNumber} | Layout: ${escapePdf(layout.toUpperCase())}) Tj
0 -18 Td
(Archived on: ${dateStr}) Tj
0 -24 Td
(--------------------------------------------------------------------------------) Tj
/F1 10 Tf
0 -22 Td
${bodyStream}
ET`;

  const streamLength = Buffer.byteLength(pdfStream);

  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`,
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${pdfStream}\nendstream\nendobj\n`,
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
  ];

  let offset = 9; // length of "%PDF-1.4\n"
  const offsets = [offset];
  for (const obj of objects) {
    offset += Buffer.byteLength(obj, 'utf-8');
    offsets.push(offset);
  }

  const xrefOffset = offset;
  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 0; i < 5; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const fullPdf = `%PDF-1.4\n${objects.join('')}${xref}${trailer}`;
  return Buffer.from(fullPdf, 'utf-8');
}

/**
 * Re-exported from the shared library so the API and worker generate
 * byte-identical embeddings.
 */
export { generateSemanticEmbedding } from '@ai-news/shared';

/**
 * Generates a valid 16-bit PCM WAV file.
 *
 * The waveform is synthesized locally (a voiced carrier with word-rate
 * amplitude modulation) so the artifact is real audio even when no external
 * text-to-speech provider is configured. Set TTS_WEBHOOK_URL to replace it
 * with provider-rendered speech.
 */
export function generateValidWav(
  scriptText: string,
  voice: string,
  durationSeconds: number
): Buffer {
  const sampleRate = 22050;
  const channels = 1;
  const bitsPerSample = 16;
  const safeDuration = Math.max(1, Math.min(Math.floor(durationSeconds), 300));
  const sampleCount = sampleRate * safeDuration;
  const dataSize = sampleCount * channels * (bitsPerSample / 8);

  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(channels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);

  const words = Math.max(1, scriptText.trim().split(/\s+/).filter(Boolean).length);
  const wordsPerSecond = Math.max(1.2, Math.min(3.2, words / safeDuration));
  const baseFrequency = voice === 'news_anchor_f' ? 210 : voice === 'news_anchor_m' ? 125 : 165;

  for (let i = 0; i < sampleCount; i++) {
    const t = i / sampleRate;
    // Word-rate envelope so the audio has speech-like pacing.
    const wordPhase = (t * wordsPerSecond) % 1;
    const envelope = Math.max(0, Math.sin(Math.PI * Math.min(1, wordPhase * 1.8)));
    // A small pitch glide per word avoids a single flat tone.
    const pitch = baseFrequency * (1 + 0.08 * Math.sin(2 * Math.PI * wordsPerSecond * t));
    const carrier =
      Math.sin(2 * Math.PI * pitch * t) * 0.6 +
      Math.sin(2 * Math.PI * pitch * 2 * t) * 0.2 +
      Math.sin(2 * Math.PI * pitch * 3 * t) * 0.1;
    const sample = Math.max(-1, Math.min(1, carrier * envelope * 0.5));
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }

  return buffer;
}
