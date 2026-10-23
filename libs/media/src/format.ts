/**
 * How a number is written.
 *
 * A figure is part of the story, so it has to read the same way every time
 * it is drawn — in a chart, in a table, on a phone, in the studio, and in
 * the markup the server sends and the browser then takes over.
 *
 * `toLocaleString()` with no locale does not do that. It uses whichever
 * locale the runtime happens to be set to, so a server running in one
 * place and a reader in another write the same figure differently —
 * `1,840,000,000` here and `1,84,00,00,000` there. The page is then
 * rendered twice and React reports a mismatch between the two.
 *
 * So every number is written in one locale, the one the platform's charts
 * already use.
 */

/** The locale every figure in the platform is written in. */
export const NUMBER_LOCALE = 'en-GB';

/**
 * Write a number the way the platform writes it.
 *
 * The locale is fixed, so the server and the browser agree.
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

/**
 * Write a number to a fixed number of decimal places.
 *
 * A figure that is written one way in a chart and another way in the
 * table beside it reads as two different figures.
 */
export function formatNumberFixed(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—';

  return formatNumber(value, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
