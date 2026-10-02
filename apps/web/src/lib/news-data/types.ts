export interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: string;
  forecast: Array<{ day: string; temp: number; icon: string }>;
}

export interface FactCheckItem {
  id: string;
  claim: string;
  claimant: string;
  checker: string;
  checkerLogo?: string;
  rating: 'TRUE' | 'FALSE' | 'PARTLY TRUE' | 'MISLEADING';
  summary: string;
  factCheckUrl: string;
}

export interface TrendingTopic {
  id: string;
  tag: string;
  query: string;
  volume: string;
}

export interface RelatedSourceArticle {
  id: string;
  publisher: string;
  publisherLogo?: string;
  headline: string;
  timeAgo: string;
  url: string;
  thumbnailUrl?: string;
}

export interface GoogleNewsCluster {
  id: string;
  mainStoryId: string;
  title: string;
  summary: string;
  category: 'India' | 'World' | 'Business' | 'Technology' | 'Science' | 'Health' | 'Sports';
  leadStory: {
    slug: string;
    headline: string;
    publisher: string;
    publisherLogo?: string;
    timeAgo: string;
    imageUrl: string;
    author: string;
    excerpt: string;
    isSubscriberOnly?: boolean;
  };
  relatedArticles: RelatedSourceArticle[];
  timeline?: Array<{ time: string; headline: string; publisher: string }>;
  perspectives?: Array<{ publisher: string; stance: string; headline: string; url: string }>;
}

export interface FullCoverageCluster {
  storyId: string;
  title: string;
  summary: string;
  perspectives: Array<{
    publisher: string;
    headline: string;
    sourceType: string;
    url: string;
    excerpt: string;
    timeAgo: string;
    tone: 'analytical' | 'optimistic' | 'cautious' | 'official';
    isWire?: boolean;
    stance?: string;
  }>;
  timeline: Array<{
    time: string;
    headline: string;
    detail: string;
  }>;
  factCheck: {
    verdict: 'VERIFIED' | 'DEVELOPING' | 'DISPUTED';
    confidence: number;
    officialSources: string[];
    verificationNote: string;
  };
}

export interface GenericStoryRecord {
  id?: string;
  slug?: string;
  title?: string;
  summary?: string;
  category?: string;
  articleType?: string;
  publishedAt?: string;
  createdAt?: string;
  [key: string]: unknown;
}
