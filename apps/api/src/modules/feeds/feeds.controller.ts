import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { db } from '@ai-news/database';
import { CANONICAL_CATEGORIES } from '@ai-news/schemas';
import { generateNewsArticleJsonLd } from '@ai-news/shared';

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

@Controller()
export class FeedsController {
  private baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  /**
   * RSS 2.0 Feed with media enclosures and Google News compat
   */
  @Get(['rss.xml', 'api/feeds/rss', 'feed'])
  async getRssFeed(@Res() reply: FastifyReply) {
    const stories = await db.stories.list({ status: 'PUBLISHED', limit: 50 });
    const now = new Date().toUTCString();

    const itemsXml = stories
      .map((s) => {
        const pubDate = s.publishedAt ? new Date(s.publishedAt).toUTCString() : now;
        const link = `${this.baseUrl}/stories/${s.slug}`;
        const enclosure = s.heroImageUrl
          ? `\n      <enclosure url="${escapeXml(s.heroImageUrl)}" type="image/jpeg" length="0"/>`
          : '';
        const keywords = s.topicIds && s.topicIds.length > 0 ? `<category>${escapeXml(s.topicIds.join(', '))}</category>` : '';

        return `
    <item>
      <title>${escapeXml(s.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(s.summary)}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(s.articleType)}</category>
      ${keywords}${enclosure}
    </item>`;
      })
      .join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>GlobalPulse News — Real-Time Intelligence</title>
    <link>${escapeXml(this.baseUrl)}</link>
    <description>Enterprise autonomous newsroom and verified world dispatches.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escapeXml(this.baseUrl)}/rss.xml" rel="self" type="application/rss+xml"/>
    ${itemsXml}
  </channel>
</rss>`;

    reply.type('application/rss+xml; charset=utf-8').send(rssXml);
  }

  /**
   * Atom 1.0 Feed
   */
  @Get(['atom.xml', 'api/feeds/atom'])
  async getAtomFeed(@Res() reply: FastifyReply) {
    const stories = await db.stories.list({ status: 'PUBLISHED', limit: 50 });
    const nowIso = new Date().toISOString();

    const entriesXml = stories
      .map((s) => {
        const updated = s.updatedAt || s.publishedAt || nowIso;
        const link = `${this.baseUrl}/stories/${s.slug}`;
        return `
  <entry>
    <title>${escapeXml(s.title)}</title>
    <link href="${escapeXml(link)}"/>
    <id>urn:uuid:${s.id}</id>
    <updated>${updated}</updated>
    <summary>${escapeXml(s.summary)}</summary>
    <category term="${escapeXml(s.articleType)}"/>
  </entry>`;
      })
      .join('');

    const atomXml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>GlobalPulse News Feed</title>
  <subtitle>Verified, multi-agent AI and human news dispatches.</subtitle>
  <link href="${escapeXml(this.baseUrl)}"/>
  <link href="${escapeXml(this.baseUrl)}/atom.xml" rel="self"/>
  <updated>${nowIso}</updated>
  <id>${escapeXml(this.baseUrl)}/</id>
  ${entriesXml}
</feed>`;

    reply.type('application/atom+xml; charset=utf-8').send(atomXml);
  }

  /**
   * Category RSS 2.0 Feed
   */
  @Get(['feeds/:category/rss.xml', 'api/feeds/category/:category'])
  async getCategoryRssFeed(
    @Param('category') category: string,
    @Res() reply: FastifyReply
  ) {
    const normalized = category.toLowerCase();
    const allPublished = await db.stories.list({
      status: 'PUBLISHED',
      limit: 100,
    });
    const stories = allPublished
      .filter((s) => {
        const matchesArticleType = s.articleType?.toLowerCase() === normalized;
        const matchesTopic = s.topicIds?.some(
          (t) =>
            t.toLowerCase() === `top_${normalized}` ||
            t.toLowerCase() === normalized ||
            t.toLowerCase().includes(normalized)
        );
        return matchesArticleType || matchesTopic;
      })
      .slice(0, 30);
    const now = new Date().toUTCString();

    const itemsXml = stories
      .map((s) => {
        const pubDate = s.publishedAt ? new Date(s.publishedAt).toUTCString() : now;
        const link = `${this.baseUrl}/stories/${s.slug}`;
        const enclosure = s.heroImageUrl
          ? `\n      <enclosure url="${escapeXml(s.heroImageUrl)}" type="image/jpeg" length="0"/>`
          : '';

        return `
    <item>
      <title>${escapeXml(s.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(s.summary)}</description>
      <pubDate>${pubDate}</pubDate>${enclosure}
    </item>`;
      })
      .join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>GlobalPulse News — ${escapeXml(category.toUpperCase())}</title>
    <link>${escapeXml(this.baseUrl)}/category/${escapeXml(category)}</link>
    <description>Section news dispatches for ${escapeXml(category)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    ${itemsXml}
  </channel>
</rss>`;

    reply.type('application/rss+xml; charset=utf-8').send(rssXml);
  }

  /**
   * Topic-specific RSS Feed
   */
  @Get(['feeds/topics/:topic/rss.xml', 'api/feeds/topics/:topic'])
  async getTopicRssFeed(
    @Param('topic') topic: string,
    @Res() reply: FastifyReply
  ) {
    const stories = await db.stories.list({
      status: 'PUBLISHED',
      topicId: topic,
      limit: 30,
    });
    const now = new Date().toUTCString();

    const itemsXml = stories
      .map((s) => {
        const pubDate = s.publishedAt ? new Date(s.publishedAt).toUTCString() : now;
        const link = `${this.baseUrl}/stories/${s.slug}`;
        const enclosure = s.heroImageUrl
          ? `\n      <enclosure url="${escapeXml(s.heroImageUrl)}" type="image/jpeg" length="0"/>`
          : '';

        return `
    <item>
      <title>${escapeXml(s.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(s.summary)}</description>
      <pubDate>${pubDate}</pubDate>${enclosure}
    </item>`;
      })
      .join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>GlobalPulse News — Topic: ${escapeXml(topic)}</title>
    <link>${escapeXml(this.baseUrl)}/topics/${escapeXml(topic)}</link>
    <description>Topic-specific dispatches for #${escapeXml(topic)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    ${itemsXml}
  </channel>
</rss>`;

    reply.type('application/rss+xml; charset=utf-8').send(rssXml);
  }

  /**
   * Standard XML Sitemap
   */
  @Get(['sitemap.xml', 'api/sitemap.xml'])
  async getSitemap(@Res() reply: FastifyReply) {
    const stories = await db.stories.list({ status: 'PUBLISHED', limit: 500 });
    const nowIso = new Date().toISOString().split('T')[0];

    const staticUrls = [
      { loc: `${this.baseUrl}/`, changefreq: 'always', priority: '1.0' },
      { loc: `${this.baseUrl}/sources`, changefreq: 'daily', priority: '0.7' },
      { loc: `${this.baseUrl}/display`, changefreq: 'daily', priority: '0.6' },
      ...CANONICAL_CATEGORIES.map((cat) => ({
        loc: `${this.baseUrl}/category/${cat.slug}`,
        changefreq: 'hourly',
        priority: '0.8',
      })),
    ];

    const staticXml = staticUrls
      .map(
        (u) => `
  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
      )
      .join('');

    const storyXml = stories
      .map((s) => {
        const lastmod = (s.updatedAt || s.publishedAt || nowIso).split('T')[0];
        return `
  <url>
    <loc>${escapeXml(`${this.baseUrl}/stories/${s.slug}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
      })
      .join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticXml}
  ${storyXml}
</urlset>`;

    reply.type('application/xml; charset=utf-8').send(sitemap);
  }

  /**
   * F23: Google News XML Sitemap (sitemap-news.xml)
   * Follows Google News specification:
   * - Namespace xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
   * - Filters articles published within the last 48 hours
   */
  @Get(['sitemap-news.xml', 'api/sitemaps/news.xml'])
  async getGoogleNewsSitemap(@Res() reply: FastifyReply) {
    const stories = await db.stories.list({ status: 'PUBLISHED', limit: 250 });
    const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;

    // Filter to last 48 hours per Google News spec
    const recentStories = stories.filter((s) => {
      const pubTime = s.publishedAt ? new Date(s.publishedAt).getTime() : new Date(s.createdAt).getTime();
      return pubTime >= fortyEightHoursAgo;
    });

    const newsUrlsXml = recentStories
      .map((s) => {
        const pubDateIso = s.publishedAt ? new Date(s.publishedAt).toISOString() : new Date(s.createdAt).toISOString();
        const link = `${this.baseUrl}/stories/${s.slug}`;
        const keywords = s.topicIds && s.topicIds.length > 0
          ? `\n      <news:keywords>${escapeXml(s.topicIds.join(', '))}</news:keywords>`
          : '';

        return `
  <url>
    <loc>${escapeXml(link)}</loc>
    <news:news>
      <news:publication>
        <news:name>GlobalPulse News</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDateIso}</news:publication_date>
      <news:title>${escapeXml(s.title)}</news:title>${keywords}
    </news:news>
  </url>`;
      })
      .join('');

    const googleNewsSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${newsUrlsXml}
</urlset>`;

    reply.type('application/xml; charset=utf-8').send(googleNewsSitemap);
  }

  /**
   * F24: NewsArticle JSON-LD Structured Data Endpoint
   * Returns Schema.org NewsArticle specification for Google Rich Results.
   */
  @Get(['api/stories/:identifier/structured-data', 'api/stories/slug/:identifier/structured-data'])
  async getStoryStructuredData(
    @Param('identifier') identifier: string,
    @Res() reply: FastifyReply
  ) {
    let story = await db.stories.findById(identifier);
    if (!story) {
      story = await db.stories.findBySlug(identifier, 'org_default');
    }

    if (!story) {
      throw new NotFoundException(`Story "${identifier}" not found`);
    }

    const structuredData = generateNewsArticleJsonLd({
      story,
      baseUrl: this.baseUrl,
      publisherName: 'GlobalPulse News',
      publisherLogoUrl: `${this.baseUrl}/logo.png`,
    });

    reply.type('application/ld+json; charset=utf-8').send(structuredData);
  }
}
