const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats a date deterministically using UTC to guarantee 100% SSR-client hydration parity.
 * Output example: "Sep 27, 2026"
 */
export function formatDeterministicDate(
  dateInput: string | number | Date | null | undefined
): string {
  if (!dateInput) return 'Recent';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Recent';
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/**
 * Formats date and time deterministically using UTC.
 * Output example: "Sep 27, 2026 14:30 UTC"
 */
export function formatDeterministicDateTime(
  dateInput: string | number | Date | null | undefined
): string {
  if (!dateInput) return 'Recent';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Recent';
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()} ${hours}:${minutes} UTC`;
}
