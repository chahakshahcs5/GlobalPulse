import { Controller, Get, Param, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { db } from '@ai-news/database';
import { CANONICAL_CATEGORIES } from '@ai-news/schemas';

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

  @Get(['rss.xml', 'api/feeds/rss', 'feed'])
  async getRssFeed(@Res() reply: FastifyReply) {
    const stories = await db.stories.list({ status: 'PUBLISHED', limit: 50 });
    const now = new Date().toUTCString();

    const itemsXml = stories
      .map((s) => {
        const pubDate = s.publishedAt ? new Date(s.publishedAt).toUTCString() : now;
        const link = `${this.baseUrl}/stories/${s.slug}`;
        return `
    <item>
      <title>${escapeXml(s.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(s.summary)}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(s.articleType)}</category>
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

  @Get('feeds/:category/rss.xml')
  async getCategoryRssFeed(
    @Param('category') category: string,
    @Res() reply: FastifyReply
  ) {
    const normalized = category.toLowerCase();
    const stories = await db.stories.list({
      status: 'PUBLISHED',
      articleType: normalized as any,
      limit: 30,
    });
    const now = new Date().toUTCString();

    const itemsXml = stories
      .map((s) => {
        const pubDate = s.publishedAt ? new Date(s.publishedAt).toUTCString() : now;
        const link = `${this.baseUrl}/stories/${s.slug}`;
        return `
    <item>
      <title>${escapeXml(s.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(s.summary)}</description>
      <pubDate>${pubDate}</pubDate>
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

  @Get(['sitemap.xml', 'api/sitemap.xml'])
  async getSitemap(@Res() reply: FastifyReply) {
    const stories = await db.stories.list({ status: 'PUBLISHED', limit: 500 });
    const nowIso = new Date().toISOString().split('T')[0];

    // Static pages
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
}
