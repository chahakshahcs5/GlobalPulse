'use client';

import { useState, useEffect, useCallback } from 'react';
import { BASELINE_NAV_TABS, type Category, type NavTab, type Story } from '@ai-news/schemas';
import * as api from '../api-client';
import { useAllStories } from './stories-store';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api
      .listCategories()
      .then((cats) => {
        if (cats && cats.length > 0) setCategories(cats);
      })
      .catch(() => {});
  }, []);

  return categories;
}

/**
 * React hook to fetch stories for a specific category.
 */
export function useCategoryStories(slug: string) {
  const { stories: allStories } = useAllStories();
  const [categoryStories, setCategoryStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api
      .getCategoryStories(slug, 30)
      .then((stories) => {
        if (isMounted && stories && stories.length > 0) {
          setCategoryStories(stories);
          setIsLoading(false);
        } else if (isMounted) {
          // Fallback to filtering allStories locally
          const normalized = slug.toLowerCase();
          const filtered = allStories.filter(
            (s) =>
              (s.articleType || '').toLowerCase() === normalized ||
              (s.topicIds || []).some((t) => t.toLowerCase().includes(normalized))
          );
          setCategoryStories(filtered);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          const normalized = slug.toLowerCase();
          const filtered = allStories.filter(
            (s) =>
              (s.articleType || '').toLowerCase() === normalized ||
              (s.topicIds || []).some((t) => t.toLowerCase().includes(normalized))
          );
          setCategoryStories(filtered);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug, allStories]);

  return { stories: categoryStories, isLoading };
}

/**
 * React hook for story comments.
 */
export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  code?: string;
  description: string;
  icon?: string;
  storyCount?: number;
  isCustom?: boolean;
  subCategories?: string[];
}

export interface NewsTopic {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentCategory?: string;
  storyCount?: number;
  isCustom?: boolean;
}

export const DEFAULT_CATEGORIES: NewsCategory[] = [];
export const DEFAULT_TOPICS: NewsTopic[] = [];

export const CATEGORY_ICON_MAP: Record<string, string> = {
  'top-stories': '⭐',
  technology: '💻',
  business: '📈',
  world: '🌐',
  science: '🔬',
  health: '🩺',
  sports: '🏆',
  entertainment: '🎬',
  india: '🇮🇳',
};

const CATEGORIES_KEY = 'globalpulse_api_categories_v3';
const TOPICS_KEY = 'globalpulse_api_topics_v3';
const NAV_TABS_KEY = 'globalpulse_api_nav_tabs_v3';

export function useTaxonomy() {
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [topics, setTopics] = useState<NewsTopic[]>([]);
  const [navTabs, setNavTabs] = useState<NavTab[]>(BASELINE_NAV_TABS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadTaxonomy = useCallback(async () => {
    // Clear legacy static keys from storage if present
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('globalpulse_categories_v1');
        localStorage.removeItem('globalpulse_topics_v1');
      } catch {}

      try {
        const storedCats = localStorage.getItem(CATEGORIES_KEY);
        if (storedCats) {
          const parsed = JSON.parse(storedCats);
          if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed);
        }
        const storedTops = localStorage.getItem(TOPICS_KEY);
        if (storedTops) {
          const parsed = JSON.parse(storedTops);
          if (Array.isArray(parsed) && parsed.length > 0) setTopics(parsed);
        }
        const storedTabs = localStorage.getItem(NAV_TABS_KEY);
        if (storedTabs) {
          const parsed = JSON.parse(storedTabs);
          if (Array.isArray(parsed) && parsed.length > 0) setNavTabs(parsed);
        }
      } catch {
        // Safe fallback
      }
    }

    try {
      const [apiCats, apiTops, apiTabs, publishedStories] = await Promise.all([
        api.listCategories().catch(() => []),
        api.listTopics().catch(() => []),
        api.listNavTabs().catch(() => []),
        api.listStories({ limit: 500 }).catch(() => []),
      ]);

      const stories = Array.isArray(publishedStories) ? publishedStories : [];

      // Calculate dynamic story count per category and topic
      const categoryCounts: Record<string, number> = {};
      const topicCounts: Record<string, number> = {};

      for (const story of stories) {
        if (story.status !== 'PUBLISHED') continue;
        const artType = (story.articleType || '').toLowerCase();
        categoryCounts[artType] = (categoryCounts[artType] || 0) + 1;

        const storyTopicIds = (story.topicIds || []).map((t) => t.toLowerCase());
        const storyText = `${story.title} ${story.summary || ''}`.toLowerCase();

        for (const tid of storyTopicIds) {
          topicCounts[tid] = (topicCounts[tid] || 0) + 1;
        }

        if (Array.isArray(apiTops)) {
          for (const t of apiTops) {
            const tId = (t.id || '').toLowerCase();
            const tSlug = (t.slug || '').toLowerCase();
            const tName = (t.name || '').toLowerCase();
            if (
              storyTopicIds.includes(tId) ||
              storyTopicIds.includes(tSlug) ||
              storyText.includes(tName)
            ) {
              topicCounts[tId] = (topicCounts[tId] || 0) + 1;
              topicCounts[tSlug] = (topicCounts[tSlug] || 0) + 1;
            }
          }
        }
      }

      // Map categories purely from live API
      const finalCats: NewsCategory[] = Array.isArray(apiCats)
        ? apiCats.map((ac) => {
            const slug = (ac.slug || ac.code || ac.name || '').toLowerCase();
            const dynamicCount =
              categoryCounts[slug] ?? categoryCounts[ac.code] ?? ac.storyCount ?? 0;
            return {
              id: (ac as { id?: string }).id || `cat_${slug}`,
              name: ac.name,
              slug,
              code: ac.code,
              description: ac.description || '',
              icon: CATEGORY_ICON_MAP[slug] || ac.icon || '🏷️',
              storyCount: dynamicCount,
              isPinned: ac.isPinned,
              subCategories: Array.isArray(ac.subCategories) ? ac.subCategories : [],
            };
          })
        : [];

      // Map topics purely from live API
      const finalTops: NewsTopic[] = Array.isArray(apiTops)
        ? apiTops.map((at) => {
            const slug = at.slug || at.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const atId = (at.id || '').toLowerCase();
            const count =
              topicCounts[atId] ||
              topicCounts[slug.toLowerCase()] ||
              (at as { storyCount?: number }).storyCount ||
              0;
            return {
              id: at.id || `top_${slug}`,
              name: at.name,
              slug,
              description: at.description || '',
              parentCategory:
                (at as { parentCategory?: string }).parentCategory || at.parentTopicId || 'General',
              storyCount: count,
              isCustom: (at as { isCustom?: boolean }).isCustom ?? false,
            };
          })
        : [];

      setCategories(finalCats);
      setTopics(finalTops);
      if (Array.isArray(apiTabs) && apiTabs.length > 0) {
        setNavTabs(apiTabs);
      }
      setIsLoading(false);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(CATEGORIES_KEY, JSON.stringify(finalCats));
          localStorage.setItem(TOPICS_KEY, JSON.stringify(finalTops));
          if (Array.isArray(apiTabs) && apiTabs.length > 0) {
            localStorage.setItem(NAV_TABS_KEY, JSON.stringify(apiTabs));
          }
        } catch {}
      }
    } catch {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTaxonomy();
    window.addEventListener('globalpulse_taxonomy_updated', loadTaxonomy);
    window.addEventListener('globalpulse_stories_updated', loadTaxonomy);
    return () => {
      window.removeEventListener('globalpulse_taxonomy_updated', loadTaxonomy);
      window.removeEventListener('globalpulse_stories_updated', loadTaxonomy);
    };
  }, [loadTaxonomy]);

  const addCategory = useCallback(
    (cat: { name: string; slug?: string; description?: string; icon?: string }) => {
      const slug =
        cat.slug ||
        cat.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-');
      const newCat: NewsCategory = {
        id: `cat_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: cat.name.trim(),
        slug,
        description: cat.description || `Comprehensive dispatches and analysis on ${cat.name}.`,
        icon: cat.icon || '🏷️',
        storyCount: 0,
        isCustom: true,
      };

      setCategories((prev) => {
        const updated = [newCat, ...prev.filter((c) => c.slug !== slug)];
        try {
          localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
          window.dispatchEvent(new Event('globalpulse_taxonomy_updated'));
        } catch {}
        return updated;
      });

      return newCat;
    },
    []
  );

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('globalpulse_taxonomy_updated'));
      } catch {}
      return updated;
    });
  }, []);

  const addTopic = useCallback(
    (topic: { name: string; slug?: string; description?: string; parentCategory?: string }) => {
      const slug =
        topic.slug ||
        topic.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-');
      const newTopic: NewsTopic = {
        id: `top_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: topic.name.trim(),
        slug,
        description:
          topic.description || `In-depth coverage and timeline milestones for ${topic.name}.`,
        parentCategory: topic.parentCategory || 'General',
        storyCount: 0,
        isCustom: true,
      };

      setTopics((prev) => {
        const updated = [newTopic, ...prev.filter((t) => t.slug !== slug)];
        try {
          localStorage.setItem(TOPICS_KEY, JSON.stringify(updated));
          window.dispatchEvent(new Event('globalpulse_taxonomy_updated'));
        } catch {}
        return updated;
      });

      // Optionally sync with backend if running
      api
        .createTopic({
          name: newTopic.name,
          slug: newTopic.slug,
          description: newTopic.description,
        })
        .catch(() => {});

      return newTopic;
    },
    []
  );

  const deleteTopic = useCallback((id: string) => {
    setTopics((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      try {
        localStorage.setItem(TOPICS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('globalpulse_taxonomy_updated'));
      } catch {}
      return updated;
    });
  }, []);

  const addDesk = useCallback(
    async (categorySlug: string, deskName: string) => {
      const cleanDesk = deskName.trim();
      if (!cleanDesk) return;
      try {
        await api.addCategoryDesk(categorySlug, cleanDesk);
        await loadTaxonomy();
        window.dispatchEvent(new Event('globalpulse_taxonomy_updated'));
      } catch {
        setCategories((prev) => {
          const updated = prev.map((c) =>
            c.slug === categorySlug || c.code === categorySlug
              ? {
                  ...c,
                  subCategories: Array.from(new Set([...(c.subCategories || []), cleanDesk])),
                }
              : c
          );
          try {
            localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
            window.dispatchEvent(new Event('globalpulse_taxonomy_updated'));
          } catch {}
          return updated;
        });
      }
    },
    [loadTaxonomy]
  );

  const removeDesk = useCallback(
    async (categorySlug: string, deskName: string) => {
      try {
        await api.removeCategoryDesk(categorySlug, deskName);
        await loadTaxonomy();
        window.dispatchEvent(new Event('globalpulse_taxonomy_updated'));
      } catch {
        setCategories((prev) => {
          const updated = prev.map((c) =>
            c.slug === categorySlug || c.code === categorySlug
              ? {
                  ...c,
                  subCategories: (c.subCategories || []).filter(
                    (s) => s.toLowerCase() !== deskName.toLowerCase()
                  ),
                }
              : c
          );
          try {
            localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
            window.dispatchEvent(new Event('globalpulse_taxonomy_updated'));
          } catch {}
          return updated;
        });
      }
    },
    [loadTaxonomy]
  );

  return {
    categories,
    topics,
    navTabs,
    isLoading,
    addCategory,
    deleteCategory,
    addDesk,
    removeDesk,
    addTopic,
    deleteTopic,
    refetch: loadTaxonomy,
  };
}
