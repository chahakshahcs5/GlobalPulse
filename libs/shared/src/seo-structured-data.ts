/**
 * Schema.org NewsArticle Structured Data generator for Google Search & Google News indexing.
 * Specification: https://schema.org/NewsArticle and Google Search Central News Guidelines.
 */

export interface NewsArticleJsonLd {
  '@context': 'https://schema.org';
  '@type': 'NewsArticle';
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
  headline: string;
  image?: string[];
  datePublished: string;
  dateModified: string;
  author: Array<{
    '@type': 'Person' | 'Organization';
    name: string;
    url?: string;
  }>;
  publisher: {
    '@type': 'Organization';
    name: string;
    logo?: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  description: string;
  articleSection?: string;
  keywords?: string[];
  wordCount?: number;
  timeRequired?: string;
}

export interface StructuredDataOptions {
  story: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    articleType?: string;
    heroImageUrl?: string;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
    authorId?: string;
    topicIds?: string[];
    wordCount?: number;
    readingTimeMinutes?: number;
  };
  baseUrl: string;
  publisherName?: string;
  publisherLogoUrl?: string;
  authorName?: string;
}

/**
 * Builds standard Google News compliant NewsArticle JSON-LD object.
 */
export function generateNewsArticleJsonLd(options: StructuredDataOptions): NewsArticleJsonLd {
  const {
    story,
    baseUrl,
    publisherName = 'GlobalPulse News',
    publisherLogoUrl = `${baseUrl}/logo.png`,
    authorName = story.authorId || 'GlobalPulse Editorial Staff',
  } = options;

  const canonicalUrl = `${baseUrl.replace(/\/+$/, '')}/stories/${story.slug}`;
  const datePublished = story.publishedAt || story.createdAt;
  const dateModified = story.updatedAt || datePublished;

  const images: string[] = [];
  if (story.heroImageUrl) {
    images.push(story.heroImageUrl);
  } else {
    images.push(`${baseUrl}/default-news-og.png`);
  }

  const jsonLd: NewsArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    headline: story.title,
    image: images,
    datePublished,
    dateModified,
    author: [
      {
        '@type': 'Person',
        name: authorName,
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: publisherName,
      logo: {
        '@type': 'ImageObject',
        url: publisherLogoUrl,
      },
    },
    description: story.summary,
    articleSection: story.articleType ? story.articleType.replace(/_/g, ' ') : 'General News',
  };

  if (story.topicIds && story.topicIds.length > 0) {
    jsonLd.keywords = story.topicIds;
  }

  if (typeof story.wordCount === 'number' && story.wordCount > 0) {
    jsonLd.wordCount = story.wordCount;
  }

  if (typeof story.readingTimeMinutes === 'number' && story.readingTimeMinutes > 0) {
    jsonLd.timeRequired = `PT${story.readingTimeMinutes}M`;
  }

  return jsonLd;
}
