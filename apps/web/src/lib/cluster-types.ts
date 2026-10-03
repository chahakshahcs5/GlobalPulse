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
  category:
    'India' | 'World' | 'Business' | 'Technology' | 'Science' | 'Health' | 'Sports' | string;
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
