'use client';

import React from 'react';
import { ArrowDown, ArrowUp, Download, Search } from 'lucide-react';
import type { TableBlock } from '@ai-news/schemas';

/**
 * A data table.
 *
 * The block's schema promises sorting, filtering, searching, paging and a
 * CSV download, so the table implements all of them rather than rendering a
 * static grid. Every capability is opt-in through the payload: a table that
 * does not ask to be searchable does not grow a search box.
 */
export const TableBlockView: React.FC<{ data: TableBlock['data'] }> = ({ data }) => {
  const [sortColumn, setSortColumn] = React.useState<number | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [query, setQuery] = React.useState('');
  const [filters, setFilters] = React.useState<Record<number, string>>({});
  const [page, setPage] = React.useState(0);

  const headers = data.headers ?? [];
  const rawRows = data.rows ?? [];
  const pageSize = data.pageSize && data.pageSize > 0 ? data.pageSize : 0;

  const filteredRows = React.useMemo(() => {
    let rows = rawRows;

    if (data.searchable && query.trim().length > 0) {
      const needle = query.trim().toLowerCase();
      rows = rows.filter((row) => row.some((cell) => String(cell).toLowerCase().includes(needle)));
    }

    if (data.filterable) {
      rows = rows.filter((row) =>
        Object.entries(filters).every(([column, value]) => {
          if (!value || value.trim().length === 0) return true;
          return String(row[Number(column)] ?? '')
            .toLowerCase()
            .includes(value.trim().toLowerCase());
        })
      );
    }

    if (sortColumn !== null) {
      rows = [...rows].sort((a, b) => {
        const left = String(a[sortColumn] ?? '');
        const right = String(b[sortColumn] ?? '');
        const numeric = Number(left.replace(/[^0-9.-]/g, ''));
        const bothNumeric = Number.isFinite(numeric) && /\d/.test(left) && /\d/.test(right);
        const result = bothNumeric
          ? numeric - Number(right.replace(/[^0-9.-]/g, ''))
          : left.localeCompare(right, undefined, { numeric: true });
        return sortDirection === 'asc' ? result : -result;
      });
    }

    return rows;
  }, [rawRows, query, filters, sortColumn, sortDirection, data.searchable, data.filterable]);

  const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(filteredRows.length / pageSize)) : 1;
  const safePage = Math.min(page, pageCount - 1);
  const visibleRows =
    pageSize > 0
      ? filteredRows.slice(safePage * pageSize, safePage * pageSize + pageSize)
      : filteredRows;

  const toggleSort = (column: number) => {
    if (sortColumn === column) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortColumn(column);
    setSortDirection('asc');
  };

  const downloadCsv = () => {
    const escapeCell = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [
      headers.map(escapeCell).join(','),
      ...filteredRows.map((row) => row.map((cell) => escapeCell(String(cell))).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(data.title || 'table').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasToolbar = Boolean(data.searchable || data.filterable || data.downloadable);

  /*
   * How the table is drawn.
   *
   * A table can be a grid of rows, a grid with every line drawn, or a stack
   * of cards — one per row, each cell labelled by its column. The data is
   * the same; only the treatment changes.
   */
  const layout = data.layout ?? 'striped';

  if (layout === 'cards') {
    return (
      <figure className="my-6">
        {(data.title || data.caption) && (
          <figcaption className="mb-3">
            {data.title && (
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {data.title}
              </div>
            )}
            {data.caption && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{data.caption}</p>
            )}
          </figcaption>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleRows.map((row: string[], rIdx: number) => (
            <div
              key={rIdx}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 shadow-sm"
            >
              <dl className="space-y-2">
                {row.map((cell: string, cIdx: number) => (
                  <div key={cIdx} className="flex items-baseline justify-between gap-4">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {headers[cIdx]}
                    </dt>
                    <dd className="text-sm text-slate-800 dark:text-slate-200 text-right">
                      {cell}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
          {visibleRows.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500 col-span-full">
              No rows match the current filters.
            </p>
          )}
        </div>

        {(data.footer || data.sourceAttribution || data.methodology || data.lastUpdated) && (
          <div className="mt-3 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            {data.footer && <p className="italic">{data.footer}</p>}
            <p className="flex flex-wrap gap-x-4 gap-y-0.5">
              {data.sourceAttribution && <span>Source: {data.sourceAttribution}</span>}
              {data.lastUpdated && <span>Updated: {data.lastUpdated}</span>}
            </p>
            {data.methodology && <p>Methodology: {data.methodology}</p>}
          </div>
        )}
      </figure>
    );
  }

  const isBordered = layout === 'bordered';

  return (
    <figure className="my-6 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm">
      {(data.title || data.caption) && (
        <figcaption className="px-4 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          {data.title && (
            <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{data.title}</div>
          )}
          {data.caption && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{data.caption}</p>
          )}
        </figcaption>
      )}

      {hasToolbar && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
          {data.searchable && (
            <div className="relative flex-1 min-w-[180px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(0);
                }}
                placeholder="Search this table…"
                aria-label="Search the table"
                className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
            </div>
          )}
          {data.downloadable && (
            <button
              type="button"
              onClick={downloadCsv}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-white"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table
          className={`w-full text-left text-sm text-slate-700 dark:text-slate-300 ${
            isBordered ? 'border-collapse' : ''
          }`}
        >
          <thead
            className={`bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700 ${
              isBordered ? '[&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-700' : ''
            }`}
          >
            <tr>
              {headers.map((header: string, index: number) => (
                <th key={index} className="px-4 py-3 whitespace-nowrap">
                  {data.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(index)}
                      aria-label={`Sort by ${header}`}
                      className="inline-flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      {header}
                      {sortColumn === index &&
                        (sortDirection === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        ))}
                    </button>
                  ) : (
                    header
                  )}
                </th>
              ))}
            </tr>
            {data.filterable && (
              <tr className="bg-slate-50/70 dark:bg-slate-900/40 font-normal">
                {headers.map((header: string, index: number) => (
                  <th
                    key={index}
                    className={`px-2 py-1.5 ${
                      isBordered ? 'border border-slate-200 dark:border-slate-700' : ''
                    }`}
                  >
                    <input
                      type="text"
                      value={filters[index] ?? ''}
                      onChange={(event) => {
                        setFilters((current) => ({ ...current, [index]: event.target.value }));
                        setPage(0);
                      }}
                      placeholder={`Filter ${header}`}
                      aria-label={`Filter by ${header}`}
                      className="w-full rounded border border-slate-200 bg-white px-1.5 py-1 text-[11px] font-normal text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:placeholder:text-slate-500"
                    />
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody className={isBordered ? '' : 'divide-y divide-slate-200 dark:divide-slate-800'}>
            {visibleRows.map((row: string[], rIdx: number) => (
              <tr
                key={rIdx}
                className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                  isBordered
                    ? '[&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-700'
                    : ''
                }`}
              >
                {row.map((cell: string, cIdx: number) => (
                  <td key={cIdx} className="px-4 py-2.5">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td
                  colSpan={Math.max(1, headers.length)}
                  className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500"
                >
                  No rows match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageSize > 0 && pageCount > 1 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing {visibleRows.length ? safePage * pageSize + 1 : 0}–
            {safePage * pageSize + visibleRows.length} of {filteredRows.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={safePage === 0}
              className="rounded-md border border-slate-300 px-2 py-1 font-semibold disabled:opacity-40 dark:border-slate-700"
            >
              Previous
            </button>
            <span className="font-mono">
              {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
              disabled={safePage >= pageCount - 1}
              className="rounded-md border border-slate-300 px-2 py-1 font-semibold disabled:opacity-40 dark:border-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {(data.footer || data.sourceAttribution || data.methodology || data.lastUpdated) && (
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          {data.footer && <p className="italic">{data.footer}</p>}
          <p className="flex flex-wrap gap-x-4 gap-y-0.5">
            {data.sourceAttribution && <span>Source: {data.sourceAttribution}</span>}
            {data.lastUpdated && <span>Updated: {data.lastUpdated}</span>}
          </p>
          {data.methodology && <p>Methodology: {data.methodology}</p>}
        </div>
      )}
    </figure>
  );
};
