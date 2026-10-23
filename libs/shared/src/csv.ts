/**
 * Neutralizes CSV/Spreadsheet formula injection (CWE-1236)
 * and properly encodes cells according to RFC 4180.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }
  let str = String(value);

  // If cell begins with a formula trigger character, prefix with a single quote to neutralize
  if (/^[\s]*[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // RFC 4180 escaping: double any embedded double quotes and wrap in quotes
  return `"${str.replace(/"/g, '""')}"`;
}

export function formatCsv(rows: Array<Array<unknown>>): string {
  return rows.map((row) => row.map(sanitizeCsvCell).join(',')).join('\r\n');
}
