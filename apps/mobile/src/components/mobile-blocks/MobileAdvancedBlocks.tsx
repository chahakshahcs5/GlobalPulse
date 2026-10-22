import { View, Text, Image } from 'react-native';
import type {
  AnomalyBlock,
  MotionChartBlock,
  NetworkGraphBlock,
  RegressionBlock,
  SandboxBlock,
  SankeyBlock,
  Scene3DBlock,
  ScrollyBlock,
  SurveyResultsBlock,
  TreemapBlock,
} from '@ai-news/schemas';
import { styles } from './styles';

/**
 * Mobile renderers for the flow, hierarchy, analysis and immersive blocks.
 *
 * A phone has no room for a picture the reader cannot pinch, and no pointer
 * to drag one with — so these blocks are drawn as the numbers and the words
 * they are made of. The picture is the same information; this is the same
 * information in a form that fits.
 */

export function SankeyBlockItem({ block }: { block: SankeyBlock }) {
  const data = block.data || {};
  const total = (data.links ?? []).reduce((sum, link) => sum + (link.value ?? 0), 0);

  return (
    <View style={styles.intelCard}>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      {data.subtitle ? <Text style={styles.intelText}>{data.subtitle}</Text> : null}

      {(data.links ?? []).map((link, index) => {
        const share = total > 0 ? Math.round((link.value / total) * 100) : 0;
        return (
          <View key={`${link.source}-${link.target}-${index}`} style={styles.intelListItem}>
            <Text style={styles.intelMeta}>
              {link.source} → {link.target}
            </Text>
            <Text style={styles.intelText}>
              {link.value.toLocaleString()}
              {data.unit ? ` ${data.unit}` : ''} ({share}%)
            </Text>
          </View>
        );
      })}

      {data.caption ? <Text style={styles.intelText}>{data.caption}</Text> : null}
      {data.sourceAttribution ? (
        <Text style={styles.sourceFootnote}>Source: {data.sourceAttribution}</Text>
      ) : null}
    </View>
  );
}

export function TreemapBlockItem({ block }: { block: TreemapBlock }) {
  const data = block.data || {};
  const valued = (data.nodes ?? []).filter((node) => typeof node.value === 'number');
  const total = valued.reduce((sum, node) => sum + (node.value ?? 0), 0);

  return (
    <View style={styles.intelCard}>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      {data.subtitle ? <Text style={styles.intelText}>{data.subtitle}</Text> : null}

      {valued.map((node) => {
        const share = total > 0 ? Math.round(((node.value ?? 0) / total) * 100) : 0;
        return (
          <View key={node.id} style={styles.intelListItem}>
            <Text style={styles.intelMeta}>{node.label}</Text>
            <Text style={styles.intelText}>
              {(node.value ?? 0).toLocaleString()}
              {data.unit ? ` ${data.unit}` : ''} ({share}%)
            </Text>
          </View>
        );
      })}

      {data.caption ? <Text style={styles.intelText}>{data.caption}</Text> : null}
      {data.sourceAttribution ? (
        <Text style={styles.sourceFootnote}>Source: {data.sourceAttribution}</Text>
      ) : null}
    </View>
  );
}

export function NetworkGraphBlockItem({ block }: { block: NetworkGraphBlock }) {
  const data = block.data || {};
  const degree: Record<string, number> = {};
  for (const link of data.links ?? []) {
    degree[link.source] = (degree[link.source] ?? 0) + 1;
    degree[link.target] = (degree[link.target] ?? 0) + 1;
  }

  const mostConnected = (data.nodes ?? [])
    .slice()
    .sort((a, b) => (degree[b.id] ?? 0) - (degree[a.id] ?? 0))
    .slice(0, 8);

  return (
    <View style={styles.intelCard}>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      {data.subtitle ? <Text style={styles.intelText}>{data.subtitle}</Text> : null}

      <Text style={styles.intelSectionLabel}>
        {(data.nodes ?? []).length} people or organisations, {(data.links ?? []).length} connections
      </Text>

      {mostConnected.map((node) => (
        <View key={node.id} style={styles.intelListItem}>
          <Text style={styles.intelMeta}>{node.label}</Text>
          <Text style={styles.intelText}>
            {degree[node.id] ?? 0} connection{degree[node.id] === 1 ? '' : 's'}
            {node.group ? ` · ${node.group}` : ''}
          </Text>
        </View>
      ))}

      {data.caption ? <Text style={styles.intelText}>{data.caption}</Text> : null}
      {data.sourceAttribution ? (
        <Text style={styles.sourceFootnote}>Source: {data.sourceAttribution}</Text>
      ) : null}
    </View>
  );
}

export function RegressionBlockItem({ block }: { block: RegressionBlock }) {
  const data = block.data || {};
  const points = data.points ?? [];

  return (
    <View style={styles.intelCard}>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      {data.subtitle ? <Text style={styles.intelText}>{data.subtitle}</Text> : null}

      <Text style={styles.intelSectionLabel}>
        {(data.model ?? 'linear').toUpperCase()} model · {points.length} measurements
      </Text>

      {points.slice(0, 6).map((point, index) => (
        <View key={`${point.x}-${index}`} style={styles.intelListItem}>
          <Text style={styles.intelMeta}>
            {point.label ?? `${point.x}`}
            {data.xLabel ? ` (${data.xLabel})` : ''}
          </Text>
          <Text style={styles.intelText}>
            {point.y.toLocaleString()}
            {data.yLabel ? ` ${data.yLabel}` : ''}
          </Text>
        </View>
      ))}

      {data.caption ? <Text style={styles.intelText}>{data.caption}</Text> : null}
      {data.methodology ? (
        <Text style={styles.sourceFootnote}>Methodology: {data.methodology}</Text>
      ) : null}
    </View>
  );
}

export function AnomalyBlockItem({ block }: { block: AnomalyBlock }) {
  const data = block.data || {};

  return (
    <View style={styles.intelCard}>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      {data.subtitle ? <Text style={styles.intelText}>{data.subtitle}</Text> : null}

      <Text style={styles.intelSectionLabel}>{(data.method ?? 'zscore').toUpperCase()} method</Text>

      {(data.points ?? []).slice(-8).map((point, index) => (
        <View key={`${point.x}-${index}`} style={styles.intelListItem}>
          <Text style={styles.intelMeta}>{point.x}</Text>
          <Text style={styles.intelText}>
            {point.y.toLocaleString()}
            {data.unit ? ` ${data.unit}` : ''}
          </Text>
        </View>
      ))}

      {data.caption ? <Text style={styles.intelText}>{data.caption}</Text> : null}
      {data.methodology ? (
        <Text style={styles.sourceFootnote}>Methodology: {data.methodology}</Text>
      ) : null}
    </View>
  );
}

export function SurveyResultsBlockItem({ block }: { block: SurveyResultsBlock }) {
  const data = block.data || {};
  const responses = data.responses ?? [];
  const total = responses.reduce((sum, response) => sum + (response.count ?? 0), 0) || 1;

  return (
    <View style={styles.intelCard}>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      {data.subtitle ? <Text style={styles.intelText}>{data.subtitle}</Text> : null}
      <Text style={styles.intelSectionLabel}>{data.question}</Text>

      {responses.map((response) => (
        <View key={response.option} style={styles.intelListItem}>
          <Text style={styles.intelMeta}>{response.option}</Text>
          <Text style={styles.intelText}>
            {response.count.toLocaleString()} ({Math.round((response.count / total) * 100)}%)
          </Text>
        </View>
      ))}

      {data.totalRespondents !== undefined ? (
        <Text style={styles.sourceFootnote}>
          Respondents: {data.totalRespondents.toLocaleString()}
          {data.marginOfError !== undefined ? ` · ±${data.marginOfError}%` : ''}
        </Text>
      ) : null}
      {data.sourceAttribution ? (
        <Text style={styles.sourceFootnote}>Source: {data.sourceAttribution}</Text>
      ) : null}
    </View>
  );
}

export function ScrollyBlockItem({ block }: { block: ScrollyBlock }) {
  const data = block.data || {};

  return (
    <View style={styles.intelCard}>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}

      {(data.steps ?? []).map((step) => (
        <View key={step.id} style={styles.intelListItem}>
          {step.heading ? <Text style={styles.intelMeta}>{step.heading}</Text> : null}
          {step.body ? <Text style={styles.intelText}>{step.body}</Text> : null}
          {step.visual.kind === 'stat' ? (
            <View style={styles.intelRow}>
              <Text style={styles.statValue}>{step.visual.value}</Text>
              <Text style={styles.statLabel}>{step.visual.label}</Text>
            </View>
          ) : null}
          {step.visual.kind === 'image' ? (
            <Image
              source={{ uri: step.visual.url }}
              style={{ width: '100%', height: 160, borderRadius: 8 }}
              resizeMode="cover"
              alt={step.visual.alt}
            />
          ) : null}
          {step.visual.kind === 'text' ? (
            <Text style={styles.intelText}>{step.visual.text}</Text>
          ) : null}
        </View>
      ))}

      {data.caption ? <Text style={styles.intelText}>{data.caption}</Text> : null}
      {data.sourceAttribution ? (
        <Text style={styles.sourceFootnote}>Source: {data.sourceAttribution}</Text>
      ) : null}
    </View>
  );
}

export function MotionChartBlockItem({ block }: { block: MotionChartBlock }) {
  const data = block.data || {};
  const chart = data.chart || ({} as MotionChartBlock['data']['chart']);
  const values = (chart.values as Array<Record<string, unknown>>) ?? [];
  const labelKey = chart.xAxis?.key;
  const valueKey = chart.series?.[0]?.key;

  return (
    <View style={styles.mediaCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTypeBadge}>{(data.animation ?? 'grow').toUpperCase()}</Text>
        <Text style={styles.cardMetaText}>Animated chart</Text>
      </View>
      <Text style={styles.cardTitle}>{data.title || chart.title || 'Chart'}</Text>

      <View style={styles.chartValuesContainer}>
        {values.slice(0, 6).map((row, index) => (
          <View key={index} style={styles.chartValueRow}>
            <Text style={styles.chartValueLabel}>
              {String(row[labelKey ?? ''] ?? `Row ${index + 1}`)}
            </Text>
            <Text style={styles.chartValueNumber}>
              {Number(row[valueKey ?? ''] ?? 0).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      {data.caption ? <Text style={styles.intelText}>{data.caption}</Text> : null}
      {data.sourceAttribution ? (
        <Text style={styles.sourceFootnote}>Source: {data.sourceAttribution}</Text>
      ) : null}
    </View>
  );
}

export function SandboxBlockItem({ block }: { block: SandboxBlock }) {
  const data = block.data || {};

  return (
    <View style={styles.intelCard}>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      <Text style={styles.intelText}>
        This custom visual runs in an interactive frame, which is not shown on a phone.
      </Text>
      {data.accessibilityText ? (
        <Text style={styles.intelText}>{data.accessibilityText}</Text>
      ) : null}
      {data.caption ? <Text style={styles.intelText}>{data.caption}</Text> : null}
    </View>
  );
}

export function Scene3DBlockItem({ block }: { block: Scene3DBlock }) {
  const data = block.data || {};

  return (
    <View style={styles.intelCard}>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      {data.subtitle ? <Text style={styles.intelText}>{data.subtitle}</Text> : null}

      {data.posterUrl ? (
        <Image
          source={{ uri: data.posterUrl }}
          style={{ width: '100%', height: 200, borderRadius: 8 }}
          resizeMode="cover"
          alt={data.alt ?? data.title ?? 'Three-dimensional scene'}
        />
      ) : null}

      {data.alt ? <Text style={styles.intelText}>{data.alt}</Text> : null}
      {data.caption ? <Text style={styles.intelText}>{data.caption}</Text> : null}
      {data.sourceAttribution ? (
        <Text style={styles.sourceFootnote}>Source: {data.sourceAttribution}</Text>
      ) : null}
    </View>
  );
}
