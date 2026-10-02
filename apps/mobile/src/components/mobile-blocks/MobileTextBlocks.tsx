import { View, Text, type TextStyle } from 'react-native';
import type {
  HeadingBlock,
  ParagraphBlock,
  SummaryBlock,
  QuoteBlock,
  CalloutBlock,
} from '@ai-news/schemas';
import { styles } from './styles';

export function HeadingBlockItem({ block }: { block: HeadingBlock }) {
  const level = block.data?.level || 2;
  const text = block.data?.text || '';
  const subtext = block.data?.subtext;

  let headingStyle: TextStyle = styles.h2;
  if (level === 1) headingStyle = styles.h1;
  else if (level === 3) headingStyle = styles.h3;
  else if (level === 4) headingStyle = styles.h4;

  return (
    <View style={styles.headingWrapper}>
      <Text style={headingStyle}>{text}</Text>
      {subtext && <Text style={styles.subtext}>{subtext}</Text>}
    </View>
  );
}

export function ParagraphBlockItem({ block }: { block: ParagraphBlock }) {
  return <Text style={styles.paragraph}>{block.data?.text}</Text>;
}

export function SummaryBlockItem({ block }: { block: SummaryBlock }) {
  const data = block.data || {};
  const points = data.bulletPoints || [];
  return (
    <View style={styles.summaryCard}>
      <View style={styles.badgeRow}>
        <View style={styles.pulseDot} />
        <Text style={styles.summaryBadge}>EXECUTIVE BRIEFING</Text>
      </View>
      {data.headline && <Text style={styles.summaryHeadline}>{data.headline}</Text>}
      {points.map((pt: string, idx: number) => (
        <View key={idx} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{pt}</Text>
        </View>
      ))}
    </View>
  );
}

export function QuoteBlockItem({ block }: { block: QuoteBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.quoteCard}>
      <Text style={styles.quoteText}>"{data.quote}"</Text>
      {data.attribution && (
        <Text style={styles.quoteAttribution}>
          — {data.attribution}
          {data.title ? `, ${data.title}` : ''}
        </Text>
      )}
    </View>
  );
}

export function CalloutBlockItem({ block }: { block: CalloutBlock }) {
  const data = block.data || {};
  return (
    <View style={styles.calloutCard}>
      {data.title && <Text style={styles.calloutTitle}>{data.title}</Text>}
      <Text style={styles.calloutText}>{data.text}</Text>
    </View>
  );
}
