const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats a date using the user's local timezone.
 * Output example: "Sep 30, 2026"
 */
export function formatLocalDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return 'Recent';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Recent';

  try {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
}

/**
 * Formats date and time using the user's local timezone.
 * Output example: "Sep 30, 2026, 2:45 PM"
 */
export function formatLocalDateTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return 'Recent';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Recent';

  try {
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}, ${displayHours}:${minutes} ${ampm}`;
  }
}

/**
 * Formats time only using the user's local timezone.
 * Output example: "2:45 PM"
 */
export function formatLocalTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  try {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  }
}

/**
 * Backward compatibility alias: formats date using user's local timezone.
 */
export function formatDeterministicDate(
  dateInput: string | number | Date | null | undefined
): string {
  return formatLocalDate(dateInput);
}

/**
 * Backward compatibility alias: formats date and time using user's local timezone.
 */
export function formatDeterministicDateTime(
  dateInput: string | number | Date | null | undefined
): string {
  return formatLocalDateTime(dateInput);
}
