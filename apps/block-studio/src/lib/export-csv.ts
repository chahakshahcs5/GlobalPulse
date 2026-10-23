import { formatCsv } from '@ai-news/shared';

/**
 * Extracts tabular rows from a block's payload if it represents data-rich content.
 * Returns null if the block is not tabular or has no extractable series/rows.
 */
export function extractBlockDataAsCsv(
  _blockType: string,
  data: Record<string, unknown>
): string | null {
  if (!data || typeof data !== 'object') return null;

  // 1. Explicit Table Blocks (columns & rows)
  if (Array.isArray(data.columns) && Array.isArray(data.rows)) {
    const headers = data.columns.map((c: unknown) =>
      typeof c === 'string'
        ? c
        : ((c as Record<string, unknown>)?.label ??
          (c as Record<string, unknown>)?.key ??
          String(c))
    );
    const rows = (data.rows as Array<Record<string, unknown> | Array<unknown>>).map((row) => {
      if (Array.isArray(row)) return row;
      return (data.columns as Array<unknown>).map((col) => {
        const key = typeof col === 'string' ? col : (col as Record<string, unknown>)?.key;
        return key && row[key as string] !== undefined ? row[key as string] : '';
      });
    });
    return formatCsv([headers, ...rows]);
  }

  // 2. Chart Blocks with Series & Categories / Points
  if (Array.isArray(data.series) && data.series.length > 0) {
    const categories: string[] = Array.isArray(data.categories)
      ? (data.categories as string[])
      : [];

    const seriesList = data.series as Array<{
      name?: string;
      data?: unknown[];
      values?: unknown[];
    }>;
    const seriesNames = seriesList.map((s, idx) => s.name || `Series ${idx + 1}`);

    if (categories.length > 0) {
      const headers = ['Category', ...seriesNames];
      const rows = categories.map((cat, rowIdx) => {
        const rowVals = seriesList.map((s) => {
          const list = s.data ?? s.values ?? [];
          return list[rowIdx] !== undefined ? list[rowIdx] : '';
        });
        return [cat, ...rowVals];
      });
      return formatCsv([headers, ...rows]);
    } else {
      // Scatter / Points or unindexed series
      const headers = ['Index', ...seriesNames];
      const maxLen = Math.max(...seriesList.map((s) => (s.data ?? s.values ?? []).length), 0);
      const rows = Array.from({ length: maxLen }, (_, rowIdx) => {
        const rowVals = seriesList.map((s) => {
          const list = s.data ?? s.values ?? [];
          return list[rowIdx] !== undefined ? list[rowIdx] : '';
        });
        return [rowIdx + 1, ...rowVals];
      });
      return formatCsv([headers, ...rows]);
    }
  }

  // 3. Poll Options / Survey Results
  if (Array.isArray(data.options)) {
    const headers = ['Option ID', 'Label', 'Votes', 'Percentage'];
    const rows = (data.options as Array<Record<string, unknown>>).map((opt) => [
      opt.id ?? '',
      opt.label ?? opt.text ?? '',
      opt.votes ?? '',
      opt.percentage ?? (opt.percent !== undefined ? `${opt.percent}%` : ''),
    ]);
    return formatCsv([headers, ...rows]);
  }

  // 4. Rankings / Leaderboards
  if (Array.isArray(data.items) || Array.isArray(data.rankings) || Array.isArray(data.entries)) {
    const list = (data.items || data.rankings || data.entries) as Array<Record<string, unknown>>;
    if (list.length > 0 && typeof list[0] === 'object') {
      const keys = Object.keys(list[0]).filter((k) => typeof list[0][k] !== 'object');
      const headers = keys;
      const rows = list.map((item) => keys.map((k) => item[k] ?? ''));
      return formatCsv([headers, ...rows]);
    }
  }

  return null;
}

/** Triggers a browser file download of CSV content */
export function downloadCsvFile(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
