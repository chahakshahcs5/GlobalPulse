import { View, Text, Image } from 'react-native';
import type {
  ImageBlock,
  GalleryBlock,
  ImageDiffBlock,
  SlideDeckBlock,
  EmbedBlock,
  DiagramBlock,
  FlowBlock,
  AnimatedMapBlock,
} from '@ai-news/schemas';
import { styles } from './styles';

/**
 * Mobile renderers for visual and explanatory media blocks: imagery, before /
 * after comparisons, slide decks, embeds, diagrams, and process flows.
 */

export function ImageBlockItem({ block }: { block: ImageBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Image
        source={{ uri: data.url }}
        style={{ width: '100%', height: 200, borderRadius: 8 }}
        resizeMode="cover"
        alt={data.altText}
      />
      {data.caption ? <Text style={styles.intelText}>{data.caption}</Text> : null}
      {data.credit ? <Text style={styles.sourceFootnote}>Credit: {data.credit}</Text> : null}
    </View>
  );
}

export function GalleryBlockItem({ block }: { block: GalleryBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      {data.images?.map((image, idx) => (
        <View key={idx} style={styles.intelListItem}>
          <Image
            source={{ uri: image.url }}
            style={{ width: '100%', height: 180, borderRadius: 8 }}
            resizeMode="cover"
            alt={image.altText}
          />
          {image.caption ? <Text style={styles.intelText}>{image.caption}</Text> : null}
          {image.credit ? <Text style={styles.sourceFootnote}>Credit: {image.credit}</Text> : null}
        </View>
      ))}
    </View>
  );
}

export function ImageDiffBlockItem({ block }: { block: ImageDiffBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <View style={styles.intelRow}>
        <View style={{ flex: 1 }}>
          <Image
            source={{ uri: data.beforeUrl }}
            style={{ width: '100%', height: 120, borderRadius: 8 }}
            resizeMode="cover"
            alt={`${data.beforeLabel} image`}
          />
          <Text style={styles.intelMeta}>{data.beforeLabel}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Image
            source={{ uri: data.afterUrl }}
            style={{ width: '100%', height: 120, borderRadius: 8 }}
            resizeMode="cover"
            alt={`${data.afterLabel} image`}
          />
          <Text style={styles.intelMeta}>{data.afterLabel}</Text>
        </View>
      </View>
      {data.caption ? <Text style={styles.intelText}>{data.caption}</Text> : null}
      {data.credit ? <Text style={styles.sourceFootnote}>Credit: {data.credit}</Text> : null}
    </View>
  );
}

export function SlideDeckBlockItem({ block }: { block: SlideDeckBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelTitle}>{data.title}</Text>
      {data.slides?.map((slide) => (
        <View key={slide.slideNumber} style={styles.intelListItem}>
          <View style={styles.intelRowBetween}>
            <Text style={styles.intelText}>
              {slide.slideNumber}. {slide.title}
            </Text>
          </View>
          {slide.bullets?.map((bullet, idx) => (
            <Text key={idx} style={styles.bulletText}>
              • {bullet}
            </Text>
          ))}
          {slide.body ? <Text style={styles.intelText}>{slide.body}</Text> : null}
          {slide.sourceAttribution ? (
            <Text style={styles.sourceFootnote}>Source: {slide.sourceAttribution}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function EmbedBlockItem({ block }: { block: EmbedBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      <Text style={styles.intelSectionLabel}>{data.provider} embed</Text>
      <Text style={styles.intelText}>{data.title || data.url}</Text>
      <Text style={styles.intelMeta}>{data.url}</Text>
    </View>
  );
}

export function DiagramBlockItem({ block }: { block: DiagramBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      <Text style={styles.intelMeta}>{data.format} diagram</Text>
      <Text style={styles.intelText}>{data.definition}</Text>
      {data.caption ? <Text style={styles.intelMeta}>{data.caption}</Text> : null}
    </View>
  );
}

/**
 * Animated map.
 *
 * Mobile has no scrubber, so the frames are listed with their locations —
 * the same information, read frame by frame.
 */
export function AnimatedMapBlockItem({ block }: { block: AnimatedMapBlock }) {
  const data = block.data || {};

  return (
    <View style={styles.mediaCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTypeBadge}>TIMELINE MAP</Text>
        <Text style={styles.cardMetaText}>
          {data.frames.length} frame{data.frames.length === 1 ? '' : 's'}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{data.title}</Text>
      {data.description && <Text style={styles.cardSubtitle}>{data.description}</Text>}

      {data.frames.map((frame, index) => (
        <View key={`${frame.at}-${index}`} style={styles.intelListItem}>
          <Text style={styles.chartValueLabel}>{frame.label ?? frame.at.slice(0, 10)}</Text>
          {frame.points.map((point) => (
            <Text key={point.id} style={styles.intelMeta}>
              {point.label}
              {point.value !== undefined
                ? ` — ${point.value.toLocaleString()}${data.unit ? ` ${data.unit}` : ''}`
                : ''}
            </Text>
          ))}
        </View>
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

export function FlowBlockItem({ block }: { block: FlowBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.intelCard}>
      {data.title ? <Text style={styles.intelTitle}>{data.title}</Text> : null}
      {data.description ? <Text style={styles.intelText}>{data.description}</Text> : null}
      <View style={styles.timelineList}>
        {data.steps?.map((step) => (
          <View key={step.stepNumber} style={styles.timelineItem}>
            <View style={styles.timelineStepBadge}>
              <Text style={styles.timelineStepText}>{step.stepNumber}</Text>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineHeadline}>{step.title}</Text>
              <Text style={styles.timelineBody}>{step.description}</Text>
              {step.status ? (
                <Text style={styles.timelineDate}>{step.status.toUpperCase()}</Text>
              ) : null}
              {step.branches?.map((branch, idx) => (
                <Text key={idx} style={styles.intelMeta}>
                  ↳ {branch.label}
                  {branch.description ? ` — ${branch.description}` : ''}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
