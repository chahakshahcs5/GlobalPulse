import { NUMBER_LOCALE } from './format';
import { View, Text } from 'react-native';
import type {
  EvidenceBlock,
  PerspectiveBlock,
  InterviewBlock,
  LiveDataBlock,
  FactCheckBlock,
  DataExplorerBlock,
  RankingBlock,
  CalculatorBlock,
  FinancialBlock,
  ElectionBlock,
  DisasterBlock,
  ScienceBlock,
  AnnotatedImageBlock,
  VideoGalleryBlock,
  PodcastBlock,
  WaveformBlock,
  TranscriptBlock,
  DatasetBlock,
} from '@ai-news/schemas';
import { styles } from './styles';

/**
 * Mobile renderers for the intelligence, data-journalism, and media-expansion
 * blocks.
 *
 * Mobile keeps the same guarantees as the web surface: confidence always
 * carries its methodology, evidence keeps its stance, and every dataset keeps
 * its source and license visible.
 */

function formatTimestamp(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function Provenance({
  source,
  methodology,
  license,
}: {
  source?: string;
  methodology?: string;
  license?: string;
}) {
  if (!source && !methodology && !license) return null;
  return (
    <View style={styles.intelListItem}>
      {source ? <Text style={styles.sourceFootnote}>Source: {source}</Text> : null}
      {license ? <Text style={styles.sourceFootnote}>License: {license}</Text> : null}
      {methodology ? <Text style={styles.sourceFootnote}>Methodology: {methodology}</Text> : null}
    </View>
  );
}

export function EvidenceBlockItem({ block }: { block: EvidenceBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelSectionLabel}>Evidence</Text>
      <Text style={styles.intelTitle}>{data.title || 'Evidence'}</Text>
      {data.summary ? <Text style={styles.intelText}>{data.summary}</Text> : null}

      {data.claims?.map((claim, idx) => (
        <View key={claim.claimId || idx} style={styles.intelListItem}>
          <View style={styles.intelRow}>
            <View style={styles.intelPill}>
              <Text style={styles.intelPillText}>{String(claim.status).replace(/_/g, ' ')}</Text>
            </View>
            <Text style={styles.intelText}>{claim.text}</Text>
          </View>
          {claim.confidence !== undefined ? (
            <Text style={styles.intelMeta}>
              Confidence {Math.round(claim.confidence * 100)}%
              {claim.confidenceMethodology ? ` — ${claim.confidenceMethodology}` : ''}
            </Text>
          ) : null}
        </View>
      ))}

      {data.evidence?.map((item, idx) => (
        <View key={item.id || idx} style={styles.intelListItem}>
          <View style={styles.intelRow}>
            <View style={styles.intelPill}>
              <Text style={styles.intelPillText}>{item.stance}</Text>
            </View>
            <Text style={styles.intelText}>{item.title}</Text>
          </View>
          {item.excerpt ? <Text style={styles.transcriptSnippet}>“{item.excerpt}”</Text> : null}
        </View>
      ))}

      <Provenance source={data.sourceAttribution} methodology={data.methodology} />
    </View>
  );
}

export function PerspectiveBlockItem({ block }: { block: PerspectiveBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      {data.perspectives?.map((perspective, idx) => (
        <View key={idx} style={styles.intelListItem}>
          <View style={styles.intelRowBetween}>
            <Text style={styles.intelTitle}>{perspective.label}</Text>
            <View style={styles.intelPill}>
              <Text style={styles.intelPillText}>{perspective.stance}</Text>
            </View>
          </View>
          <Text style={styles.intelText}>{perspective.summary}</Text>
          {perspective.quoteExcerpt ? (
            <Text style={styles.transcriptSnippet}>“{perspective.quoteExcerpt}”</Text>
          ) : null}
          {perspective.sourceIds?.length ? (
            <Text style={styles.intelMeta}>Sources: {perspective.sourceIds.join(', ')}</Text>
          ) : null}
        </View>
      ))}
      <Provenance methodology={data.methodology} />
    </View>
  );
}

export function InterviewBlockItem({ block }: { block: InterviewBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelTitle}>{data.title}</Text>
      <Text style={styles.intelMeta}>
        {data.interviewee?.name}
        {data.interviewee?.role ? ` — ${data.interviewee.role}` : ''}
      </Text>
      {data.segments?.map((segment, idx) => (
        <View key={idx} style={styles.intelListItem}>
          <View style={styles.intelRowBetween}>
            <Text style={styles.intelText}>Q: {segment.question}</Text>
            {segment.timestampSeconds !== undefined ? (
              <Text style={styles.intelMeta}>{formatTimestamp(segment.timestampSeconds)}</Text>
            ) : null}
          </View>
          <Text style={styles.intelText}>A: {segment.answer}</Text>
          {segment.speaker ? <Text style={styles.intelMeta}>{segment.speaker}</Text> : null}
        </View>
      ))}
      <Provenance source={data.sourceAttribution} />
    </View>
  );
}

export function LiveDataBlockItem({ block }: { block: LiveDataBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      {data.items?.map((item) => {
        const isUp = (item.change ?? 0) > 0;
        const isDown = (item.change ?? 0) < 0;
        return (
          <View key={item.id} style={styles.intelListItem}>
            <View style={styles.intelRowBetween}>
              <Text style={styles.intelSectionLabel}>{item.label}</Text>
              {item.change !== undefined ? (
                <View
                  style={
                    isUp
                      ? styles.intelPillPositive
                      : isDown
                        ? styles.intelPillNegative
                        : styles.intelPill
                  }
                >
                  <Text
                    style={
                      isUp
                        ? styles.intelPillPositiveText
                        : isDown
                          ? styles.intelPillNegativeText
                          : styles.intelPillText
                    }
                  >
                    {isUp ? '↑' : isDown ? '↓' : '→'} {Math.abs(item.change).toFixed(2)}%
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.statValue}>{String(item.value)}</Text>
            <Text style={styles.intelMeta}>
              {item.provider} · {item.asOf}
            </Text>
          </View>
        );
      })}
      <Provenance source={data.sourceAttribution} />
    </View>
  );
}

export function FactCheckBlockItem({ block }: { block: FactCheckBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <View style={styles.intelRow}>
        <Text style={styles.intelSectionLabel}>Fact check</Text>
        <View style={styles.intelPill}>
          <Text style={styles.intelPillText}>{String(data.status).replace(/_/g, ' ')}</Text>
        </View>
      </View>
      <Text style={styles.intelText}>“{data.claim}”</Text>
      {data.claimant ? <Text style={styles.intelMeta}>Claimed by {data.claimant}</Text> : null}
      <Text style={styles.intelText}>{data.summary}</Text>
      {data.evidenceSummary ? <Text style={styles.intelText}>{data.evidenceSummary}</Text> : null}
      {data.confidence !== undefined ? (
        <Text style={styles.intelMeta}>
          Confidence {Math.round(data.confidence * 100)}%
          {data.confidenceMethodology ? ` — ${data.confidenceMethodology}` : ''}
        </Text>
      ) : null}
      {data.sources?.length ? (
        <Text style={styles.intelMeta}>Sources: {data.sources.join(', ')}</Text>
      ) : null}
      <Provenance methodology={data.methodology} />
    </View>
  );
}

export function DataExplorerBlockItem({ block }: { block: DataExplorerBlock }) {
  const data = block.data || {};
  const metric = data.metrics?.find((m) => m.key === data.defaultMetric) ?? data.metrics?.[0];
  const dimension =
    data.dimensions?.find((d) => d.key === data.defaultDimension) ?? data.dimensions?.[0];

  const totals = new Map<string, number>();
  for (const row of data.rows ?? []) {
    const key = String(row[dimension?.key ?? ''] ?? 'Unknown');
    const value = Number(row[metric?.key ?? ''] ?? 0);
    totals.set(key, (totals.get(key) ?? 0) + (Number.isFinite(value) ? value : 0));
  }
  const grouped = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelTitle}>{data.title}</Text>
      {data.subtitle ? <Text style={styles.intelText}>{data.subtitle}</Text> : null}
      {data.description ? <Text style={styles.intelText}>{data.description}</Text> : null}
      <Text style={styles.intelMeta}>
        {metric?.label}
        {metric?.unit ? ` (${metric?.unit})` : ''} by {dimension?.label}
      </Text>
      {grouped.map(([key, value]) => (
        <View key={key} style={styles.intelRowBetween}>
          <Text style={styles.intelText}>{key}</Text>
          <Text style={styles.chartValueNumber}>
            {value.toLocaleString(NUMBER_LOCALE)}
            {metric?.unit ? ` ${metric.unit}` : ''}
          </Text>
        </View>
      ))}
      <Provenance
        source={data.dataset?.sourceAttribution}
        methodology={data.dataset?.methodology}
        license={data.dataset?.license}
      />
    </View>
  );
}

export function RankingBlockItem({ block }: { block: RankingBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelTitle}>{data.title}</Text>
      {data.subtitle ? <Text style={styles.intelText}>{data.subtitle}</Text> : null}
      {data.items?.map((item) => {
        const movement = item.previousRank === undefined ? null : item.previousRank - item.rank;
        return (
          <View key={`${item.rank}-${item.name}`} style={styles.intelRowBetween}>
            <Text style={styles.intelText}>
              {item.rank}. {item.name}
            </Text>
            <View style={styles.intelRow}>
              {item.value !== undefined ? (
                <Text style={styles.chartValueNumber}>
                  {item.value.toLocaleString(NUMBER_LOCALE)}
                  {item.unit ? ` ${item.unit}` : ''}
                </Text>
              ) : null}
              {movement !== null && movement !== 0 ? (
                <View style={movement > 0 ? styles.intelPillPositive : styles.intelPillNegative}>
                  <Text
                    style={
                      movement > 0 ? styles.intelPillPositiveText : styles.intelPillNegativeText
                    }
                  >
                    {movement > 0 ? `↑${movement}` : `↓${Math.abs(movement)}`}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
      <Provenance source={data.sourceAttribution} methodology={data.methodology} />
    </View>
  );
}

export function CalculatorBlockItem({ block }: { block: CalculatorBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelTitle}>{data.title}</Text>
      {data.description ? <Text style={styles.intelText}>{data.description}</Text> : null}
      {data.inputs?.map((input) => (
        <View key={input.id} style={styles.intelRowBetween}>
          <Text style={styles.intelText}>{input.label}</Text>
          <Text style={styles.chartValueNumber}>
            {String(input.defaultValue)}
            {input.unit ? ` ${input.unit}` : ''}
          </Text>
        </View>
      ))}
      {data.outputs?.map((output) => (
        <View key={output.id} style={styles.intelRowBetween}>
          <Text style={styles.intelText}>{output.label}</Text>
          <Text style={styles.chartValueNumber}>
            {output.expression}
            {output.unit ? ` ${output.unit}` : ''}
          </Text>
        </View>
      ))}
      {data.explanation ? <Text style={styles.intelText}>{data.explanation}</Text> : null}
      <Provenance source={data.sourceAttribution} methodology={data.methodology} />
    </View>
  );
}

export function FinancialBlockItem({ block }: { block: FinancialBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelTitle}>{data.title}</Text>
      <Text style={styles.intelMeta}>
        {data.currency} · as of {data.asOf}
      </Text>
      {data.metrics?.map((metric) => (
        <View key={metric.label} style={styles.intelListItem}>
          <View style={styles.intelRowBetween}>
            <Text style={styles.intelSectionLabel}>{metric.label}</Text>
            {metric.change !== undefined ? (
              <View
                style={
                  metric.change > 0
                    ? styles.intelPillPositive
                    : metric.change < 0
                      ? styles.intelPillNegative
                      : styles.intelPill
                }
              >
                <Text
                  style={
                    metric.change > 0
                      ? styles.intelPillPositiveText
                      : metric.change < 0
                        ? styles.intelPillNegativeText
                        : styles.intelPillText
                  }
                >
                  {metric.change > 0 ? '↑' : metric.change < 0 ? '↓' : '→'}{' '}
                  {Math.abs(metric.change)}
                  {metric.changePeriod ? ` ${metric.changePeriod}` : ''}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.statValue}>
            {metric.value.toLocaleString(NUMBER_LOCALE)}{' '}
            <Text style={styles.statLabel}>{metric.unit ?? data.currency}</Text>
          </Text>
        </View>
      ))}
      <Provenance source={data.sourceAttribution} methodology={data.methodology} />
    </View>
  );
}

export function ElectionBlockItem({ block }: { block: ElectionBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelTitle}>{data.title}</Text>
      <Text style={styles.intelMeta}>
        {data.electionType} · {data.region} · {data.electionDate}
        {data.turnout !== undefined ? ` · turnout ${data.turnout}%` : ''}
      </Text>
      {data.results?.map((result) => (
        <View key={result.party} style={styles.intelRowBetween}>
          <Text style={styles.intelText}>{result.party}</Text>
          <Text style={styles.chartValueNumber}>
            {result.voteShare !== undefined ? `${result.voteShare}%` : '—'}
            {result.seats !== undefined ? ` · ${result.seats} seats` : ''}
          </Text>
        </View>
      ))}
      <Provenance source={data.sourceAttribution} methodology={data.methodology} />
    </View>
  );
}

export function DisasterBlockItem({ block }: { block: DisasterBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <View style={styles.intelRowBetween}>
        <Text style={styles.intelTitle}>{data.title}</Text>
        <View style={styles.intelPill}>
          <Text style={styles.intelPillText}>{data.status}</Text>
        </View>
      </View>
      <Text style={styles.intelMeta}>
        {data.disasterType} · {data.location ?? 'Location not stated'} · {data.occurredAt}
      </Text>
      {data.metrics?.map((metric) => (
        <View key={metric.label} style={styles.intelRowBetween}>
          <Text style={styles.intelText}>{metric.label}</Text>
          <Text style={styles.chartValueNumber}>
            {metric.value} {metric.unit}
          </Text>
        </View>
      ))}
      {data.affectedAreas?.length ? (
        <Text style={styles.intelMeta}>Affected: {data.affectedAreas.join(', ')}</Text>
      ) : null}
      {data.updates?.map((update, idx) => (
        <View key={idx} style={styles.intelListItem}>
          <Text style={styles.intelMeta}>{update.timestamp}</Text>
          <Text style={styles.intelText}>{update.title}</Text>
        </View>
      ))}
      <Provenance source={data.sourceAttribution} methodology={data.methodology} />
    </View>
  );
}

export function ScienceBlockItem({ block }: { block: ScienceBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelTitle}>{data.title}</Text>
      {data.field ? <Text style={styles.intelMeta}>{data.field}</Text> : null}
      {data.findings?.map((finding, idx) => (
        <Text key={idx} style={styles.intelText}>
          • {finding}
        </Text>
      ))}
      {data.measurements?.map((measurement) => (
        <View key={measurement.label} style={styles.intelRowBetween}>
          <Text style={styles.intelText}>{measurement.label}</Text>
          <Text style={styles.chartValueNumber}>
            {measurement.value} {measurement.unit}
            {measurement.uncertainty !== undefined ? ` ±${measurement.uncertainty}` : ''}
          </Text>
        </View>
      ))}
      {data.equation ? <Text style={styles.intelMeta}>{data.equation}</Text> : null}
      {data.authors?.length ? (
        <Text style={styles.intelMeta}>Authors: {data.authors.join(', ')}</Text>
      ) : null}
      <Provenance source={data.sourceAttribution} methodology={data.methodology} />
    </View>
  );
}

export function AnnotatedImageBlockItem({ block }: { block: AnnotatedImageBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelTitle}>{data.altText}</Text>
      {data.caption ? <Text style={styles.intelText}>{data.caption}</Text> : null}
      {data.annotations?.map((annotation) => (
        <View key={annotation.id} style={styles.intelListItem}>
          <Text style={styles.intelText}>• {annotation.label}</Text>
          {annotation.description ? (
            <Text style={styles.intelMeta}>{annotation.description}</Text>
          ) : null}
        </View>
      ))}
      {data.credit ? <Text style={styles.sourceFootnote}>Credit: {data.credit}</Text> : null}
    </View>
  );
}

export function VideoGalleryBlockItem({ block }: { block: VideoGalleryBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelSectionLabel}>Video gallery</Text>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      {data.videos?.map((video) => (
        <View key={video.id} style={styles.intelListItem}>
          <Text style={styles.intelText}>{video.title}</Text>
          {video.durationSeconds !== undefined ? (
            <Text style={styles.intelMeta}>{formatTimestamp(video.durationSeconds)}</Text>
          ) : null}
          {video.caption ? <Text style={styles.intelMeta}>{video.caption}</Text> : null}
          {video.chapters?.map((chapter) => (
            <Text key={chapter.startSeconds} style={styles.intelMeta}>
              {formatTimestamp(chapter.startSeconds)} {chapter.title}
            </Text>
          ))}
        </View>
      ))}
      <Provenance source={data.sourceAttribution} />
    </View>
  );
}

export function PodcastBlockItem({ block }: { block: PodcastBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelSectionLabel}>Podcast</Text>
      <Text style={styles.intelTitle}>{data.title}</Text>
      {data.description ? <Text style={styles.intelText}>{data.description}</Text> : null}
      {data.episodes?.map((episode, idx) => (
        <View key={idx} style={styles.intelListItem}>
          <Text style={styles.intelMeta}>
            {episode.showTitle}
            {episode.seasonNumber !== undefined ? ` · S${episode.seasonNumber}` : ''}
            {episode.episodeNumber !== undefined ? ` E${episode.episodeNumber}` : ''}
          </Text>
          <Text style={styles.intelText}>{episode.episodeTitle}</Text>
          {episode.description ? <Text style={styles.intelMeta}>{episode.description}</Text> : null}
          {episode.durationSeconds !== undefined ? (
            <Text style={styles.intelMeta}>{formatTimestamp(episode.durationSeconds)}</Text>
          ) : null}
          {episode.speakers?.length ? (
            <Text style={styles.intelMeta}>
              Speakers: {episode.speakers.map((speaker) => speaker.name).join(', ')}
            </Text>
          ) : null}
        </View>
      ))}
      <Provenance source={data.sourceAttribution} />
    </View>
  );
}

export function WaveformBlockItem({ block }: { block: WaveformBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelSectionLabel}>Audio</Text>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      <Text style={styles.intelMeta}>
        {data.mediaType} · {data.peaks?.length ?? 0} amplitude samples
        {data.durationSeconds ? ` · ${formatTimestamp(data.durationSeconds)}` : ''}
      </Text>
      {data.segments?.map((segment) => (
        <View key={`${segment.startSeconds}-${segment.label}`} style={styles.intelRowBetween}>
          <Text style={styles.intelText}>{segment.label}</Text>
          <Text style={styles.intelMeta}>{formatTimestamp(segment.startSeconds)}</Text>
        </View>
      ))}
      <Provenance source={data.sourceAttribution} />
    </View>
  );
}

export function TranscriptBlockItem({ block }: { block: TranscriptBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelSectionLabel}>Transcript</Text>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      <Text style={styles.intelMeta}>
        {data.mediaType} · {data.language}
        {data.speakers?.length
          ? ` · ${data.speakers.map((speaker) => speaker.name).join(', ')}`
          : ''}
      </Text>
      {data.segments?.map((segment, idx) => (
        <View key={idx} style={styles.intelListItem}>
          <Text style={styles.intelMeta}>{formatTimestamp(segment.startSeconds)}</Text>
          {segment.speaker ? <Text style={styles.intelText}>{segment.speaker}</Text> : null}
          <Text style={styles.intelText}>{segment.text}</Text>
        </View>
      ))}
      <Provenance source={data.sourceAttribution} methodology={data.methodology} />
    </View>
  );
}

export function DatasetBlockItem({ block }: { block: DatasetBlock }) {
  const data = block.data || {};
  const columns =
    data.columns?.length > 0
      ? data.columns
      : Object.keys(data.previewRows?.[0] ?? {}).map((key) => ({
          key,
          label: key,
          type: 'string' as const,
        }));

  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelSectionLabel}>Dataset</Text>
      <Text style={styles.intelTitle}>{data.title}</Text>
      {data.description ? <Text style={styles.intelText}>{data.description}</Text> : null}
      <Text style={styles.intelMeta}>
        {data.formats?.map((format) => format.toUpperCase()).join(' / ')}
        {data.downloadUrl ? ' · download available' : ''}
      </Text>
      {data.previewRows?.slice(0, 5).map((row, idx) => (
        <View key={idx} style={styles.intelListItem}>
          <Text style={styles.intelMeta}>
            {columns
              .map((column) => `${column.label}: ${String(row[column.key] ?? '—')}`)
              .join(' · ')}
          </Text>
        </View>
      ))}
      <Provenance
        source={data.sourceAttribution}
        methodology={data.methodology}
        license={data.license}
      />
    </View>
  );
}
