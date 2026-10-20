/**
 * Safely serializes a JSON-LD object for embedding in a <script> tag.
 *
 * Raw JSON.stringify output can break out of the script element when the
 * payload contains "</script>" (or U+2028/U+2029 line separators), enabling
 * script injection through free-text fields such as story titles. Escaping
 * the angle brackets as unicode escapes keeps the JSON valid while making
 * it impossible to terminate the script element early.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
