'use client';

import React, { useState } from 'react';
import type {
  AnnotatedImageBlock,
  VideoGalleryBlock,
  PodcastBlock,
  WaveformBlock,
  TranscriptBlock,
  DatasetBlock,
} from '@ai-news/schemas';
import { formatTimestamp } from './IntelligenceBlockViews';

/**
 * Renderers for the media expansion blocks: annotated imagery, video
 * galleries, podcasts, waveforms, transcripts, and published datasets.
 *
 * Accessibility rules applied here:
 * - Every media element carries a text alternative.
 * - Transcripts are always reachable from the media they belong to.
 * - Waveforms and galleries expose their values as text.
 */

export const AnnotatedImageBlockView: React.FC<{ data: AnnotatedImageBlock['data'] }> = ({
  data,
}) => {
  const [active, setActive] = useState<string | undefined>(undefined);

  return (
    <figure className="my-8">
      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <img src={data.url} alt={data.altText} className="w-full" loading="lazy" />
        {data.annotations.map((annotation) => {
          const isActive = active === annotation.id;
          return (
            <button
              key={annotation.id}
              type="button"
              onClick={() => setActive(isActive ? undefined : annotation.id)}
              aria-label={annotation.label}
              className={`absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all ${
                isActive
                  ? 'bg-indigo-500 border-white scale-125'
                  : 'bg-white/80 border-indigo-500 hover:scale-110'
              }`}
              style={{ left: `${annotation.xPercent}%`, top: `${annotation.yPercent}%` }}
            />
          );
        })}
      </div>

      {data.annotations.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {data.annotations.map((annotation) => (
            <li
              key={annotation.id}
              className={`text-sm rounded-lg px-2 py-1.5 ${
                active === annotation.id
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-200'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <button
                type="button"
                onClick={() => setActive(annotation.id)}
                className="text-left font-semibold"
              >
                {annotation.label}
              </button>
              {annotation.description && (
                <span className="block text-xs">{annotation.description}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {(data.caption || data.credit) && (
        <figcaption className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {data.caption}
          {data.credit && <span className="block font-mono">Credit: {data.credit}</span>}
        </figcaption>
      )}
    </figure>
  );
};

export const VideoGalleryBlockView: React.FC<{ data: VideoGalleryBlock['data'] }> = ({ data }) => {
  return (
    <section aria-label={data.title || 'Video gallery'} className="my-8">
      {data.title && (
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">{data.title}</h3>
      )}
      {data.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{data.description}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.videos.map((video) => (
          <figure
            key={video.id}
            className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm"
          >
            <div className="relative aspect-video bg-slate-900">
              <video
                controls
                preload="none"
                poster={video.posterUrl}
                className="h-full w-full"
                aria-label={video.title}
              >
                <source src={video.url} />
                <track kind="captions" />
              </video>
            </div>
            <figcaption className="p-3">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {video.title}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {video.durationSeconds !== undefined && (
                  <span>{formatTimestamp(video.durationSeconds)}</span>
                )}
                {video.credit && <span>Credit: {video.credit}</span>}
              </div>
              {video.caption && (
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">{video.caption}</p>
              )}
              {video.chapters && video.chapters.length > 0 && (
                <ol className="mt-2 space-y-0.5">
                  {video.chapters.map((chapter) => (
                    <li key={chapter.startSeconds} className="text-[11px] text-slate-500">
                      <span className="font-mono">{formatTimestamp(chapter.startSeconds)}</span>{' '}
                      {chapter.title}
                    </li>
                  ))}
                </ol>
              )}
              {video.transcriptSegments && video.transcriptSegments.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] font-semibold text-indigo-700 dark:text-indigo-400">
                    Transcript ({video.transcriptSegments.length} segments)
                  </summary>
                  <ol className="mt-1.5 space-y-1">
                    {video.transcriptSegments.map((segment, idx) => (
                      <li key={idx} className="text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="font-mono">{formatTimestamp(segment.startSeconds)}</span>{' '}
                        {segment.speaker ? <b>{segment.speaker}: </b> : null}
                        {segment.text}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </figcaption>
          </figure>
        ))}
      </div>

      {data.sourceAttribution && (
        <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
          Source: {data.sourceAttribution}
        </p>
      )}
    </section>
  );
};

export const PodcastBlockView: React.FC<{ data: PodcastBlock['data'] }> = ({ data }) => {
  return (
    <section
      aria-label={data.title}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        {data.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400">{data.description}</p>
        )}
      </header>

      <ul className="divide-y divide-slate-200 dark:border-slate-800">
        {data.episodes.map((episode, idx) => (
          <li key={`${episode.showTitle}-${idx}`} className="px-5 py-4">
            <div className="flex items-start gap-4">
              {episode.artworkUrl && (
                <img
                  src={episode.artworkUrl}
                  alt=""
                  aria-hidden="true"
                  className="h-16 w-16 shrink-0 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                  loading="lazy"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {episode.showTitle}
                  {episode.seasonNumber !== undefined ? ` · S${episode.seasonNumber}` : ''}
                  {episode.episodeNumber !== undefined ? ` E${episode.episodeNumber}` : ''}
                  {episode.explicit ? ' · Explicit' : ''}
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {episode.episodeTitle}
                </div>
                {episode.description && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {episode.description}
                  </p>
                )}
                <audio
                  controls
                  preload="none"
                  className="mt-2 w-full"
                  aria-label={episode.episodeTitle}
                >
                  <source src={episode.audioUrl} />
                </audio>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {episode.durationSeconds !== undefined && (
                    <span>{formatTimestamp(episode.durationSeconds)}</span>
                  )}
                  {episode.publishedAt && <span>{episode.publishedAt.slice(0, 10)}</span>}
                  {episode.speakers && episode.speakers.length > 0 && (
                    <span>Speakers: {episode.speakers.map((s) => s.name).join(', ')}</span>
                  )}
                  {episode.episodeUrl && (
                    <a
                      href={episode.episodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-700 dark:text-indigo-400 hover:underline"
                    >
                      Episode page
                    </a>
                  )}
                </div>
                {episode.chapters && episode.chapters.length > 0 && (
                  <ol className="mt-2 space-y-0.5">
                    {episode.chapters.map((chapter) => (
                      <li key={chapter.startSeconds} className="text-[11px] text-slate-500">
                        <span className="font-mono">{formatTimestamp(chapter.startSeconds)}</span>{' '}
                        {chapter.title}
                      </li>
                    ))}
                  </ol>
                )}
                {episode.transcript && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] font-semibold text-indigo-700 dark:text-indigo-400">
                      Transcript
                    </summary>
                    <p className="mt-1 whitespace-pre-line text-[11px] text-slate-600 dark:text-slate-400">
                      {episode.transcript}
                    </p>
                  </details>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {data.sourceAttribution && (
        <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          Source: {data.sourceAttribution}
        </footer>
      )}
    </section>
  );
};

export const WaveformBlockView: React.FC<{ data: WaveformBlock['data'] }> = ({ data }) => {
  const peaks = data.peaks;
  const mid = Math.floor(peaks.length / 2);

  return (
    <figure aria-label={data.title || 'Audio waveform'} className="my-6">
      {data.title && (
        <figcaption className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
          {data.title}
        </figcaption>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
        <div
          className="flex h-20 items-center gap-[2px]"
          role="img"
          aria-label={`Waveform with ${peaks.length} amplitude samples${data.durationSeconds ? ` over ${formatTimestamp(data.durationSeconds)}` : ''}`}
        >
          {peaks.map((peak, idx) => (
            <span
              key={idx}
              className="flex-1 rounded-sm bg-indigo-500/70"
              style={{ height: `${Math.max(4, peak * 100)}%` }}
            />
          ))}
        </div>

        {data.mediaType === 'audio' && (
          <audio controls preload="none" className="mt-3 w-full" aria-label="Waveform audio">
            <source src={data.mediaUrl} />
          </audio>
        )}

        {data.segments.length > 0 && (
          <ol className="mt-3 space-y-0.5">
            {data.segments.map((segment) => (
              <li
                key={`${segment.startSeconds}-${segment.label}`}
                className="text-[11px] text-slate-600 dark:text-slate-400"
              >
                <span className="font-mono">{formatTimestamp(segment.startSeconds)}</span>{' '}
                {segment.label}
                {segment.blockRefId && (
                  <span className="ml-1 font-mono text-slate-400">→ {segment.blockRefId}</span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {data.sourceAttribution && (
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          Source: {data.sourceAttribution}
        </p>
      )}
      <span className="sr-only">{mid} amplitude samples rendered as bars</span>
    </figure>
  );
};

export const TranscriptBlockView: React.FC<{ data: TranscriptBlock['data'] }> = ({ data }) => {
  return (
    <section
      aria-label={data.title || 'Transcript'}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {data.title || 'Transcript'}
          </h3>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {data.mediaType} · {data.language}
            {data.speakers.length > 0
              ? ` · ${data.speakers.map((speaker) => speaker.name).join(', ')}`
              : ''}
          </p>
        </div>
        {data.mediaUrl && (
          <a
            href={data.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:underline"
          >
            Open media
          </a>
        )}
      </header>

      <ol className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70">
        {data.segments.map((segment, idx) => (
          <li key={idx} className="px-5 py-3 flex gap-3">
            <span className="font-mono text-[11px] text-slate-400 shrink-0 w-12 pt-0.5">
              {formatTimestamp(segment.startSeconds)}
            </span>
            <div className="flex-1">
              {segment.speaker && (
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {segment.speaker}
                </div>
              )}
              <p className="text-sm text-slate-700 dark:text-slate-300">{segment.text}</p>
              {segment.confidence !== undefined && (
                <div className="text-[10px] font-mono text-slate-400">
                  transcription confidence {Math.round(segment.confidence * 100)}%
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {(data.methodology || data.sourceAttribution) && (
        <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
          {data.methodology && <p>Methodology: {data.methodology}</p>}
        </footer>
      )}
    </section>
  );
};

export const DatasetBlockView: React.FC<{ data: DatasetBlock['data'] }> = ({ data }) => {
  const columns =
    data.columns.length > 0
      ? data.columns
      : Object.keys(data.previewRows[0] ?? {}).map((key) => ({
          key,
          label: key,
          type: 'string' as const,
        }));

  return (
    <section
      aria-label={data.title}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
          {data.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{data.description}</p>
          )}
        </div>
        {data.downloadUrl && (
          <a
            href={data.downloadUrl}
            download
            className="rounded-lg border border-indigo-300 dark:border-indigo-500/40 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
          >
            Download {data.formats.map((f) => f.toUpperCase()).join(' / ')}
          </a>
        )}
      </header>

      {data.previewRows.length > 0 && (
        <div className="px-5 py-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/60 text-xs uppercase tracking-wide">
                {columns.map((column) => (
                  <th key={column.key} className="px-3 py-2">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.previewRows.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((column) => {
                    const value = row[column.key];
                    return (
                      <td key={column.key} className="px-3 py-2 font-mono text-xs">
                        {value === null || value === undefined ? '—' : String(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(data.license || data.methodology || data.lastUpdated || data.sourceAttribution) && (
        <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
          {data.license && <p>License: {data.license}</p>}
          {data.methodology && <p>Methodology: {data.methodology}</p>}
          {data.lastUpdated && <p>Last updated: {data.lastUpdated}</p>}
        </footer>
      )}
    </section>
  );
};
