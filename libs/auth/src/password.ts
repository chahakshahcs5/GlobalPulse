import crypto from 'crypto';

/**
 * Enterprise-grade cryptographic password hasher using scrypt with random salt.
 */
export class PasswordHasher {
  /**
   * Hashes a plain password with a cryptographically secure 16-byte salt.
   * Format: `${salt}:${derivedKeyHex}`
   */
  static hash(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Timing-safe verification of a candidate password against stored hash.
   */
  static verify(password: string, combinedHash?: string): boolean {
    if (!combinedHash || typeof combinedHash !== 'string') return false;

    const parts = combinedHash.split(':');
    if (parts.length !== 2) return false;

    const [salt, key] = parts;
    if (!salt || !key) return false;

    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const derivedKey = crypto.scryptSync(password, salt, 64);
      return crypto.timingSafeEqual(keyBuffer, derivedKey);
    } catch {
      return false;
    }
  }
}
