/**
 * Dynamic OpenGraph & Twitter Card metadata generator and social share URL builder.
 * Compliant with Open Graph Protocol (ogp.me) and Twitter Cards specification.
 */

export interface OpenGraphMeta {
  title: string;
  description: string;
  url: string;
  type: 'article' | 'website';
  siteName: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  twitterCard: 'summary_large_image' | 'summary';
  twitterSite?: string;
  twitterCreator?: string;
}

export interface StoryMetaInput {
  id: string;
  slug: string;
  title: string;
  summary: string;
  heroImageUrl?: string;
  publishedAt?: string;
  updatedAt?: string;
  authorId?: string;
  topicIds?: string[];
  articleType?: string;
  category?: string;
}

export interface OpenGraphOptions {
  story: StoryMetaInput;
  baseUrl: string;
  siteName?: string;
  defaultImage?: string;
  twitterHandle?: string;
}

export function generateOpenGraphMeta(options: OpenGraphOptions): OpenGraphMeta {
  const {
    story,
    baseUrl,
    siteName = 'GlobalPulse News',
    defaultImage = `${baseUrl}/og-default.jpg`,
    twitterHandle = '@GlobalPulseNews',
  } = options;

  const url = `${baseUrl.replace(/\/$/, '')}/stories/${story.slug}`;
  const image = story.heroImageUrl || defaultImage;

  return {
    title: `${story.title} | ${siteName}`,
    description: story.summary,
    url,
    type: 'article',
    siteName,
    image,
    imageWidth: 1200,
    imageHeight: 630,
    publishedTime: story.publishedAt,
    modifiedTime: story.updatedAt,
    author: story.authorId || siteName,
    section: story.category || story.articleType,
    tags: story.topicIds || [],
    twitterCard: 'summary_large_image',
    twitterSite: twitterHandle,
    twitterCreator: twitterHandle,
  };
}

export function renderOpenGraphHtmlTags(meta: OpenGraphMeta): string {
  const tags: string[] = [
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.url)}" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:site_name" content="${escapeHtml(meta.siteName)}" />`,
    `<meta name="twitter:card" content="${meta.twitterCard}" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
  ];

  if (meta.image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(meta.image)}" />`);
    if (meta.imageWidth) tags.push(`<meta property="og:image:width" content="${meta.imageWidth}" />`);
    if (meta.imageHeight) tags.push(`<meta property="og:image:height" content="${meta.imageHeight}" />`);
    tags.push(`<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`);
  }

  if (meta.publishedTime) {
    tags.push(`<meta property="article:published_time" content="${meta.publishedTime}" />`);
  }
  if (meta.modifiedTime) {
    tags.push(`<meta property="article:modified_time" content="${meta.modifiedTime}" />`);
  }
  if (meta.author) {
    tags.push(`<meta property="article:author" content="${escapeHtml(meta.author)}" />`);
  }
  if (meta.section) {
    tags.push(`<meta property="article:section" content="${escapeHtml(meta.section)}" />`);
  }
  if (meta.tags) {
    for (const tag of meta.tags) {
      tags.push(`<meta property="article:tag" content="${escapeHtml(tag)}" />`);
    }
  }
  if (meta.twitterSite) {
    tags.push(`<meta name="twitter:site" content="${escapeHtml(meta.twitterSite)}" />`);
  }
  if (meta.twitterCreator) {
    tags.push(`<meta name="twitter:creator" content="${escapeHtml(meta.twitterCreator)}" />`);
  }

  return tags.join('\n');
}

export interface ShareLinks {
  twitter: string;
  linkedin: string;
  facebook: string;
  whatsapp: string;
  telegram: string;
  email: string;
}

export function generateSocialShareLinks(url: string, title: string, text?: string): ShareLinks {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(text || title);

  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
