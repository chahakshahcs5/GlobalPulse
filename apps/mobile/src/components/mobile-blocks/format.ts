/**
 * How a number is written.
 *
 * A figure is part of the story, so it has to read the same way every time
 * it is drawn — in a chart, in a table, on a phone, in the studio, and in
 * the markup the server sends and the browser then takes over.
 *
 * `toLocaleString()` with no locale does not do that. It uses whichever
 * locale the runtime happens to be set to, so the same figure is written
 * differently in different places — `1,840,000,000` here and
 * `1,84,00,00,000` there.
 *
 * So every number is written in one locale, the one the platform's charts
 * already use.
 */

/** The locale every figure in the platform is written in. */
export const NUMBER_LOCALE = 'en-GB';

/**
 * Write a number the way the platform writes it.
 */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  if (!Number.isFinite(value)) return '—';

  try {
    return value.toLocaleString(NUMBER_LOCALE, options);
  } catch {
    // An engine without the locale, or with a broken ICU build.
    return String(value);
  }
}
