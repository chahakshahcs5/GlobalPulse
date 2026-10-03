import type { Metadata } from 'next';
import { getStoryBySlug } from '../../../lib/api-client/stories';

interface StoryLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }> | { slug: string };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug;

  if (!slug) {
    return {
      title: 'Story | GlobalPulse News',
      description: 'GlobalPulse live multimedia dispatches and breaking news.',
    };
  }

  try {
    const story = await getStoryBySlug(slug);
    if (!story) {
      return {
        title: 'Story Not Found | GlobalPulse News',
        description: 'The requested story could not be found.',
      };
    }

    const title = `${story.title} | GlobalPulse News`;
    const description = story.summary || 'GlobalPulse in-depth breaking news dispatch.';
    const imageUrl = story.heroImageUrl;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        publishedTime: story.publishedAt,
        images: imageUrl ? [{ url: imageUrl }] : [],
      },
      twitter: {
        card: imageUrl ? 'summary_large_image' : 'summary',
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch {
    const fallbackTitle = `${slug.replace(/-/g, ' ')} | GlobalPulse News`;
    return {
      title: fallbackTitle.charAt(0).toUpperCase() + fallbackTitle.slice(1),
      description: 'GlobalPulse breaking news coverage and multimedia investigation.',
    };
  }
}

export default function StoryLayout({ children }: StoryLayoutProps) {
  return <>{children}</>;
}
