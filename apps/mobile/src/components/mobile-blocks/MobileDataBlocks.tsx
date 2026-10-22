import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import React from 'react';
import type {
  ChartBlock,
  TimelineBlock,
  MapBlock,
  Map3DBlock,
  StatisticBlock,
  TableBlock,
  UncertaintyBlock,
  SensitivityBlock,
  PredictionLeaderboardBlock,
  WhatIfBlock,
  CorrelationBlock,
  QuizBlock,
} from '@ai-news/schemas';
import {
  SensitivityRenderer,
  PredictionScorer,
  WhatIfModel,
  CorrelationModel,
} from '@ai-news/media';
import { styles } from './styles';

export function ChartBlockItem({ block }: { block: ChartBlock }) {
  const data = block.data || {};
  const values = (data.values as Array<Record<string, unknown>>) || [];
  return (
    <View style={styles.mediaCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTypeBadge}>{(data.chartType || 'CHART').toUpperCase()}</Text>
        <Text style={styles.cardMetaText}>Data Visual</Text>
      </View>
      <Text style={styles.cardTitle}>{data.title || 'Chart'}</Text>
      {(data as { subtitle?: string }).subtitle && (
        <Text style={styles.cardSubtitle}>{(data as { subtitle?: string }).subtitle}</Text>
      )}

      {/* Values summary list */}
      <View style={styles.chartValuesContainer}>
        {values.slice(0, 4).map((row: Record<string, unknown>, rIdx: number) => {
          const label =
            (row[data.xAxis?.key] as string) || (row.name as string) || `Row ${rIdx + 1}`;
          const val =
            (row[data.series?.[0]?.key] as number) ||
            (row.value as number) ||
            (row.val as number) ||
            0;
          return (
            <View key={rIdx} style={styles.chartValueRow}>
              <Text style={styles.chartValueLabel}>{String(label)}</Text>
              <Text style={styles.chartValueNumber}>{Number(val).toLocaleString()}</Text>
            </View>
          );
        })}
      </View>

      {data.sourceAttribution && (
        <Text style={styles.sourceFootnote}>Source: {data.sourceAttribution}</Text>
      )}

      {/* Annotations explain a specific data point. Mobile renders charts as
          values rather than an image, so the annotations travel with the
          values they refer to. */}
      {data.annotations && data.annotations.length > 0 ? (
        <View style={styles.chartValuesContainer}>
          {data.annotations.map((annotation, aIdx: number) => (
            <View key={annotation.id} style={styles.chartValueRow}>
              <Text style={styles.chartValueLabel}>
                {aIdx + 1}. {annotation.label}
              </Text>
              <Text style={styles.cardMetaText}>{annotation.body}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function TimelineBlockItem({ block }: { block: TimelineBlock }) {
  const data = block.data || {};
  const items = data.items || [];
  return (
    <View style={styles.mediaCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTypeBadge}>CHRONOLOGY</Text>
        <Text style={styles.cardMetaText}>{items.length} Milestones</Text>
      </View>
      <Text style={styles.cardTitle}>{data.title || 'Timeline'}</Text>
      <View style={styles.timelineList}>
        {items.map((item: { date?: string; headline?: string; body?: string }, idx: number) => (
          <View key={idx} style={styles.timelineItem}>
            <View style={styles.timelineStepBadge}>
              <Text style={styles.timelineStepText}>{idx + 1}</Text>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineDate}>{item.date}</Text>
              <Text style={styles.timelineHeadline}>{item.headline}</Text>
              <Text style={styles.timelineBody} numberOfLines={2}>
                {item.body}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function MapBlockItem({ block }: { block: MapBlock }) {
  const data = block.data || {};
  const markers = data.markers || [];
  return (
    <View style={styles.mediaCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTypeBadge}>GEOGRAPHIC MAP</Text>
        <Text style={styles.cardMetaText}>Zoom: {data.zoom || 5}x</Text>
      </View>
      <Text style={styles.cardTitle}>{data.title || 'Location Overview'}</Text>
      {data.center && (
        <Text style={styles.cardSubtitle}>
          Coordinates: {Number(data.center[1]).toFixed(2)}°N, {Number(data.center[0]).toFixed(2)}°E
        </Text>
      )}
      {markers.length > 0 && (
        <View style={styles.markerContainer}>
          {markers.map((m: { title?: string }, idx: number) => (
            <View key={idx} style={styles.markerRow}>
              <Text style={styles.markerPin}>📍</Text>
              <Text style={styles.markerTitle}>{m.title || ''}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * A map in three dimensions.
 *
 * A phone has no WebGL, so the scene is not drawn. What the reader gets is
 * what the scene is of and where it is, which is the part that matters in
 * words.
 */
export function Map3DBlockItem({ block }: { block: Map3DBlock }) {
  const data = block.data || {};
  const markers = data.markers || [];
  const scene = data.scene || 'terrain';

  return (
    <View style={styles.mediaCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTypeBadge}>3D MAP</Text>
        <Text style={styles.cardMetaText}>
          {scene === 'terrain' ? 'Terrain' : scene === 'globe' ? 'Globe' : 'Extruded'}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{data.title || 'Three-dimensional map'}</Text>
      {data.subtitle ? <Text style={styles.cardSubtitle}>{data.subtitle}</Text> : null}
      {data.center && (
        <Text style={styles.cardSubtitle}>
          Coordinates: {Number(data.center[1]).toFixed(2)}°N, {Number(data.center[0]).toFixed(2)}°E
        </Text>
      )}
      {markers.length > 0 && (
        <View style={styles.markerContainer}>
          {markers.map((m: { title?: string }, idx: number) => (
            <View key={idx} style={styles.markerRow}>
              <Text style={styles.markerPin}>◉</Text>
              <Text style={styles.markerTitle}>{m.title || ''}</Text>
            </View>
          ))}
        </View>
      )}
      {data.caption ? <Text style={styles.intelText}>{data.caption}</Text> : null}
    </View>
  );
}

/**
 * Estimates with confidence intervals.
 *
 * The interval is part of the number, never a footnote: the estimate and the
 * range it sits in are always rendered together.
 */
/**
 * Sensitivity analysis.
 *
 * Mobile renders the swings as a ranked list rather than a tornado chart:
 * the ordering carries the same message — the assumption at the top moves the
 * outcome the most.
 */
/**
 * Prediction leaderboard.
 *
 * Only the scores are shown — the calibration chart is a desktop treatment.
 */
/**
 * Interactive scenario explorer.
 *
 * Mobile has no slider dependency, so the base case is shown with the range
 * each input can be moved across. The numbers are the same ones the web
 * reader computes by dragging the sliders.
 */
/**
 * Correlation matrix.
 *
 * Mobile shows the pairings as a list rather than a grid — the numbers are
 * what matter, and a 20-variable matrix does not fit on a phone.
 */
/**
 * Knowledge check.
 *
 * Mobile shows the questions and their answers; the explanations travel with
 * them so the reader still learns the answer.
 */
export function QuizBlockItem({ block }: { block: QuizBlock }) {
  const data = block.data || {};
  const [answers, setAnswers] = React.useState<Record<string, string>>({});

  const score = data.questions.reduce((total, question) => {
    const chosen = answers[question.id];
    if (!chosen) return total;
    return question.options.find((o) => o.id === chosen)?.correct ? total + 1 : total;
  }, 0);

  const allAnswered = data.questions.every((q) => answers[q.id] !== undefined);

  return (
    <View style={styles.mediaCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTypeBadge}>KNOWLEDGE CHECK</Text>
        <Text style={styles.cardMetaText}>
          {data.questions.length} question{data.questions.length === 1 ? '' : 's'}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{data.title}</Text>
      {data.description && <Text style={styles.cardSubtitle}>{data.description}</Text>}

      {data.questions.map((question, index) => {
        const chosen = answers[question.id];
        const isAnswered = chosen !== undefined;

        return (
          <View key={question.id} style={styles.intelListItem}>
            <Text style={styles.intelText}>
              {index + 1}. {question.question}
            </Text>
            {question.options.map((option) => {
              const isChosen = chosen === option.id;
              const showAsCorrect = isAnswered && option.correct;
              const showAsWrong = isAnswered && isChosen && !option.correct;

              return (
                <TouchableOpacity
                  key={option.id}
                  disabled={isAnswered}
                  onPress={() => {
                    if (isAnswered) return;
                    setAnswers((prev) => ({ ...prev, [question.id]: option.id }));
                  }}
                  style={styles.quizOption}
                >
                  <Text
                    style={[
                      styles.intelMeta,
                      showAsCorrect && styles.intelPillPositiveText,
                      showAsWrong && styles.intelPillNegativeText,
                    ]}
                  >
                    {showAsCorrect ? '✓ ' : showAsWrong ? '✕ ' : isChosen ? '● ' : '○ '}
                    {option.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {isAnswered && question.explanation ? (
              <Text style={styles.intelMeta}>{question.explanation}</Text>
            ) : null}
          </View>
        );
      })}

      {allAnswered && data.showScore && (
        <Text style={styles.chartValueNumber}>
          You scored {score} of {data.questions.length}
        </Text>
      )}

      {data.methodology && (
        <Text style={styles.sourceFootnote}>Methodology: {data.methodology}</Text>
      )}
    </View>
  );
}

export function CorrelationBlockItem({ block }: { block: CorrelationBlock }) {
  const data = block.data || {};
  const matrix = CorrelationModel.compute(data);
  const summary = CorrelationModel.summarise(matrix);

  return (
    <View style={styles.mediaCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTypeBadge}>CORRELATION</Text>
        <Text style={styles.cardMetaText}>
          {data.observations.length} observation{data.observations.length === 1 ? '' : 's'}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{data.title}</Text>
      {data.subtitle && <Text style={styles.cardSubtitle}>{data.subtitle}</Text>}

      <View style={styles.chartValuesContainer}>
        {matrix.variables.map((rowVariable, row) =>
          matrix.variables.slice(row + 1).map((columnVariable, offset) => {
            const cell = matrix.cells[row][row + 1 + offset];
            return (
              <View key={`${rowVariable.key}-${columnVariable.key}`} style={styles.chartValueRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.chartValueLabel}>
                    {rowVariable.label} &amp; {columnVariable.label}
                  </Text>
                  <Text style={styles.chartValueLabel}>
                    n={cell.n} · p={cell.pValue < 0.001 ? '<0.001' : cell.pValue.toFixed(3)}
                    {cell.isSignificant ? ' · significant' : ''}
                  </Text>
                </View>
                <Text style={styles.chartValueNumber}>
                  {cell.coefficient === null ? '—' : cell.coefficient.toFixed(2)}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {summary ? <Text style={styles.statContext}>{summary}</Text> : null}

      {data.methodology && (
        <Text style={styles.sourceFootnote}>Methodology: {data.methodology}</Text>
      )}
      {data.sourceAttribution && (
        <Text style={styles.sourceFootnote}>Source: {data.sourceAttribution}</Text>
      )}
    </View>
  );
}

export function WhatIfBlockItem({ block }: { block: WhatIfBlock }) {
  const data = block.data || {};
  const scenario = WhatIfModel.evaluate(data, WhatIfModel.defaultValues(data));

  const format = (value: number | null) =>
    value === null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <View style={styles.mediaCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTypeBadge}>WHAT IF</Text>
        <Text style={styles.cardMetaText}>{data.outcomeLabel}</Text>
      </View>
      <Text style={styles.cardTitle}>{data.title}</Text>
      {data.description && <Text style={styles.cardSubtitle}>{data.description}</Text>}

      <Text style={styles.chartValueNumber}>
        {format(scenario.outcome)}
        {data.outcomeUnit ? ` ${data.outcomeUnit}` : ''}
      </Text>
      {scenario.baseline !== null && (
        <Text style={styles.statContext}>Base case: {format(scenario.baseline)}</Text>
      )}

      <View style={styles.chartValuesContainer}>
        {data.inputs.map((input) => (
          <View key={input.id} style={styles.chartValueRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.chartValueLabel}>{input.label}</Text>
              <Text style={styles.chartValueLabel}>
                {format(input.min)} – {format(input.max)}
                {input.unit ? ` ${input.unit}` : ''}
              </Text>
            </View>
            <Text style={styles.chartValueNumber}>
              {format(input.defaultValue)}
              {input.unit ? ` ${input.unit}` : ''}
            </Text>
          </View>
        ))}
      </View>

      {scenario.components.length > 0 && (
        <View style={styles.chartValuesContainer}>
          {scenario.components.map((component) => (
            <View key={component.label} style={styles.chartValueRow}>
              <Text style={styles.chartValueLabel}>{component.label}</Text>
              <Text style={styles.chartValueNumber}>{format(component.value)}</Text>
            </View>
          ))}
        </View>
      )}

      {data.methodology && (
        <Text style={styles.sourceFootnote}>Methodology: {data.methodology}</Text>
      )}
      {data.sourceAttribution && (
        <Text style={styles.sourceFootnote}>Source: {data.sourceAttribution}</Text>
      )}
    </View>
  );
}

export function PredictionLeaderboardBlockItem({ block }: { block: PredictionLeaderboardBlock }) {
  const data = block.data || {};
  const scores = PredictionScorer.scoreForecasters(data);

  const formatScore = (value: number | null) => (value === null ? '—' : value.toFixed(3));
  const formatPercent = (value: number | null) =>
    value === null ? '—' : `${Math.round(value * 100)}%`;

  return (
    <View style={styles.mediaCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTypeBadge}>PREDICTIONS</Text>
        <Text style={styles.cardMetaText}>
          {data.predictions.length} tracked · {data.predictions.filter((p) => p.resolved).length}{' '}
          resolved
        </Text>
      </View>
      <Text style={styles.cardTitle}>{data.title}</Text>
      {data.subtitle && <Text style={styles.cardSubtitle}>{data.subtitle}</Text>}

      <View style={styles.chartValuesContainer}>
        {scores.map((score, idx) => (
          <View key={score.forecaster} style={styles.chartValueRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.chartValueLabel}>
                {idx + 1}. {score.forecaster}
              </Text>
              <Text style={styles.chartValueLabel}>
                {score.resolved} resolved · {formatPercent(score.accuracy)} accurate
              </Text>
            </View>
            <Text style={styles.chartValueNumber}>{formatScore(score.brierScore)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sourceFootnote}>
        Brier score: lower is better (0 perfect, 0.25 a coin flip, 1 always wrong).
      </Text>
      {data.methodology && (
        <Text style={styles.sourceFootnote}>Methodology: {data.methodology}</Text>
      )}
      {data.sourceAttribution && (
        <Text style={styles.sourceFootnote}>Source: {data.sourceAttribution}</Text>
      )}
    </View>
  );
}

export function SensitivityBlockItem({ block }: { block: SensitivityBlock }) {
  const data = block.data || {};

  const swings = SensitivityRenderer.computeSwings(data);
  const notices = SensitivityRenderer.getNotices(data);

  const format = (value: number) => {
    if (!Number.isFinite(value)) return '—';
    const abs = Math.abs(value);
    if (abs === 0) return '0';
    if (abs >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (abs >= 1) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
  };

  return (
    <View style={styles.mediaCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTypeBadge}>SENSITIVITY</Text>
        <Text style={styles.cardMetaText}>{data.outputLabel}</Text>
      </View>
      <Text style={styles.cardTitle}>{data.title}</Text>
      {data.subtitle && <Text style={styles.cardSubtitle}>{data.subtitle}</Text>}

      <Text style={styles.statContext}>
        Base case: {format(data.baseOutput)}
        {data.outputUnit ? ` ${data.outputUnit}` : ''}
      </Text>

      <View style={styles.chartValuesContainer}>
        {swings.map((swing) => (
          <View key={swing.id} style={styles.chartValueRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.chartValueLabel}>{swing.label}</Text>
              <Text style={styles.chartValueLabel}>
                {format(swing.low)} – {format(swing.high)}
                {swing.unit ? ` ${swing.unit}` : ''}
              </Text>
            </View>
            <Text style={styles.chartValueNumber}>
              ±{format(swing.swing)}
              {data.outputUnit ? ` ${data.outputUnit}` : ''}
            </Text>
          </View>
        ))}
      </View>

      {notices.map((notice) => (
        <Text key={notice} style={styles.trendText}>
          {notice}
        </Text>
      ))}

      {data.methodology && (
        <Text style={styles.sourceFootnote}>Methodology: {data.methodology}</Text>
      )}
      {data.sourceAttribution && (
        <Text style={styles.sourceFootnote}>Source: {data.sourceAttribution}</Text>
      )}
    </View>
  );
}

export function UncertaintyBlockItem({ block }: { block: UncertaintyBlock }) {
  const data = block.data || {};
  const points = data.points || [];

  const format = (value: number) => {
    if (!Number.isFinite(value)) return '—';
    const abs = Math.abs(value);
    if (abs === 0) return '0';
    if (abs >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (abs >= 1) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
  };

  return (
    <View style={styles.mediaCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTypeBadge}>UNCERTAINTY</Text>
        <Text style={styles.cardMetaText}>{data.intervalLabel || 'Estimate and range'}</Text>
      </View>
      <Text style={styles.cardTitle}>{data.title}</Text>
      {data.subtitle && <Text style={styles.cardSubtitle}>{data.subtitle}</Text>}

      <View style={styles.chartValuesContainer}>
        {points.map((point, idx) => (
          <View key={point.id ?? `${point.label}-${idx}`} style={styles.chartValueRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.chartValueLabel}>{point.label}</Text>
              <Text style={styles.chartValueLabel}>
                {format(point.low)} – {format(point.high)}
                {point.n !== undefined ? ` · n=${point.n}` : ''}
              </Text>
            </View>
            <Text style={styles.chartValueNumber}>
              {format(point.value)}
              {data.unit ? ` ${data.unit}` : ''}
            </Text>
          </View>
        ))}
      </View>

      {data.referenceValue !== undefined && (
        <Text style={styles.statContext}>
          {data.referenceLabel || 'Reference'}: {format(data.referenceValue)}
          {data.unit ? ` ${data.unit}` : ''}
        </Text>
      )}

      {points
        .filter((p) => p.note)
        .map((p, idx) => (
          <Text key={`note-${idx}`} style={styles.statContext}>
            {p.label}: {p.note}
          </Text>
        ))}

      {data.methodology && (
        <Text style={styles.sourceFootnote}>Methodology: {data.methodology}</Text>
      )}
      {data.sourceAttribution && (
        <Text style={styles.sourceFootnote}>Source: {data.sourceAttribution}</Text>
      )}
    </View>
  );
}

export function StatisticBlockItem({ block }: { block: StatisticBlock }) {
  const data = block.data || {};
  const isUp = data.trend === 'up';
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{data.label}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{data.value}</Text>
        {data.trend && (
          <View style={[styles.trendPill, isUp ? styles.trendUp : styles.trendDown]}>
            <Text style={[styles.trendText, isUp ? styles.trendTextUp : styles.trendTextDown]}>
              {isUp ? '↑' : '↓'} {data.trendValue || data.trend}
            </Text>
          </View>
        )}
      </View>
      {data.context && <Text style={styles.statContext}>{data.context}</Text>}
    </View>
  );
}

export function TableBlockItem({ block }: { block: TableBlock }) {
  const data = block.data || {};
  const headers = data.headers || [];
  const rows = data.rows || [];
  return (
    <View style={styles.mediaCard}>
      {data.title && <Text style={styles.cardTitle}>{data.title}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            {headers.map((h: string, hIdx: number) => (
              <Text key={hIdx} style={styles.tableHeaderCell}>
                {h}
              </Text>
            ))}
          </View>
          {rows.map((row: string[], rIdx: number) => (
            <View key={rIdx} style={styles.tableRow}>
              {row.map((cell: string, cIdx: number) => (
                <Text key={cIdx} style={styles.tableCell}>
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
