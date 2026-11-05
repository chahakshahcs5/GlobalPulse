/**
 * Content-sniffing for uploaded media.
 *
 * A declared MIME type is attacker-controlled. Before an upload is accepted,
 * its leading bytes must match one of the signatures we actually serve.
 */

export interface DetectedMediaType {
  mimeType: string;
  extension: string;
  kind: 'image' | 'video' | 'audio' | 'document';
}

function startsWith(buffer: Buffer, bytes: number[]): boolean {
  if (buffer.length < bytes.length) return false;
  return bytes.every((byte, index) => buffer[index] === byte);
}

function asciiAt(buffer: Buffer, offset: number, text: string): boolean {
  if (buffer.length < offset + text.length) return false;
  return buffer.subarray(offset, offset + text.length).toString('ascii') === text;
}

export function detectMediaType(buffer: Buffer): DetectedMediaType | null {
  if (!buffer || buffer.length < 4) return null;

  // PNG
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mimeType: 'image/png', extension: 'png', kind: 'image' };
  }
  // JPEG
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    return { mimeType: 'image/jpeg', extension: 'jpg', kind: 'image' };
  }
  // GIF87a / GIF89a
  if (asciiAt(buffer, 0, 'GIF87a') || asciiAt(buffer, 0, 'GIF89a')) {
    return { mimeType: 'image/gif', extension: 'gif', kind: 'image' };
  }
  // WebP: RIFF....WEBP
  if (asciiAt(buffer, 0, 'RIFF') && asciiAt(buffer, 8, 'WEBP')) {
    return { mimeType: 'image/webp', extension: 'webp', kind: 'image' };
  }
  // AVIF / HEIF: ....ftypavif or ....ftypheic
  if (asciiAt(buffer, 4, 'ftyp') && (asciiAt(buffer, 8, 'avif') || asciiAt(buffer, 8, 'avis'))) {
    return { mimeType: 'image/avif', extension: 'avif', kind: 'image' };
  }
  // MP4 / M4A: ....ftyp
  if (asciiAt(buffer, 4, 'ftyp')) {
    if (asciiAt(buffer, 8, 'M4A ')) {
      return { mimeType: 'audio/mp4', extension: 'm4a', kind: 'audio' };
    }
    return { mimeType: 'video/mp4', extension: 'mp4', kind: 'video' };
  }
  // MP3 with ID3 tag or MPEG frame sync
  if (asciiAt(buffer, 0, 'ID3') || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)) {
    return { mimeType: 'audio/mpeg', extension: 'mp3', kind: 'audio' };
  }
  // WAV: RIFF....WAVE
  if (asciiAt(buffer, 0, 'RIFF') && asciiAt(buffer, 8, 'WAVE')) {
    return { mimeType: 'audio/wav', extension: 'wav', kind: 'audio' };
  }
  // PDF
  if (asciiAt(buffer, 0, '%PDF-')) {
    return { mimeType: 'application/pdf', extension: 'pdf', kind: 'document' };
  }

  return null;
}

export interface MediaValidationResult {
  valid: boolean;
  detected?: DetectedMediaType;
  reason?: string;
}

/**
 * Validate an upload against its declared MIME type.
 *
 * `application/octet-stream` is treated as "sniff only" so generic clients can
 * upload without lying about the type; the detected type is still returned.
 */
export function validateMediaUpload(
  buffer: Buffer,
  declaredMimeType: string
): MediaValidationResult {
  const detected = detectMediaType(buffer);
  if (!detected) {
    return { valid: false, reason: 'Unrecognized or unsupported file signature.' };
  }

  const declared = (declaredMimeType || '').toLowerCase().split(';')[0].trim();
  if (!declared || declared === 'application/octet-stream') {
    return { valid: true, detected };
  }

  if (declared !== detected.mimeType) {
    // JPEG is commonly declared as image/jpg.
    const normalizedDeclared = declared === 'image/jpg' ? 'image/jpeg' : declared;
    if (normalizedDeclared !== detected.mimeType) {
      return {
        valid: false,
        detected,
        reason: `Declared content type "${declaredMimeType}" does not match the file signature (${detected.mimeType}).`,
      };
    }
  }

  return { valid: true, detected };
}
