'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  BarChart2,
  Clock,
  Quote,
  Video,
  Send,
  Calendar,
  Trash2,
  Table as TableIcon,
  AlertCircle,
  TrendingUp,
  Eye,
  Star,
} from 'lucide-react';
import type { Story, StoryBlock, ArticleType } from '@ai-news/schemas';
import {
  saveUserStory,
  updateUserStory,
  submitStoryForReview,
  useScheduledStories,
} from '../../../lib/news-store';
import { StoryRenderer } from '../../../components/StoryRenderer';

interface MediaBlockDraft {
  id: string;
  type: 'image' | 'chart' | 'quote' | 'timeline' | 'video' | 'table' | 'callout' | 'statistic';
  data: Record<string, string | number | readonly string[] | undefined>;
  items?: Array<{ date: string; headline: string; body: string }>;
}

interface StoryEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  editingStory?: Story | null;
}

export function StoryEditorDrawer({
  isOpen,
  onClose,
  onSuccess,
  editingStory,
}: StoryEditorDrawerProps) {
  const { scheduleStory } = useScheduledStories();

  const [viewMode, setViewMode] = useState<'compose' | 'preview'>('compose');
  const [submitMode, setSubmitMode] = useState<'PUBLISH' | 'REVIEW' | 'DRAFT' | 'SCHEDULE'>(
    'PUBLISH'
  );
  const [scheduledAtInput, setScheduledAtInput] = useState('');

  // Story Form State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState<ArticleType>('technology');
  const [authorName, setAuthorName] = useState('Senior Staff Journalist');
  const [heroImageUrl, setHeroImageUrl] = useState(
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80'
  );
  const [leadParagraph, setLeadParagraph] = useState('');
  const [bullet1, setBullet1] = useState('');
  const [bullet2, setBullet2] = useState('');
  const [bullet3, setBullet3] = useState('');
  const [mediaBlocks, setMediaBlocks] = useState<MediaBlockDraft[]>([]);
  const [isSubscriberOnly, setIsSubscriberOnly] = useState(false);

  // Pre-populate fields when editing an existing story, or reset for new
  useEffect(() => {
    if (editingStory) {
      setTitle(editingStory.title || '');
      setSummary(editingStory.summary || '');
      setCategory(editingStory.articleType || 'technology');
      setAuthorName(
        editingStory.authorId
          ? editingStory.authorId.replace('usr_', '').replace(/_/g, ' ')
          : 'Senior Staff Journalist'
      );
      setHeroImageUrl(editingStory.heroImageUrl || '');
      setIsSubscriberOnly(Boolean(editingStory.isSubscriberOnly));
      if (editingStory.status === 'PUBLISHED') setSubmitMode('PUBLISH');
      else if (editingStory.status === 'IN_REVIEW') setSubmitMode('REVIEW');
      else if (editingStory.status === 'SCHEDULED') setSubmitMode('SCHEDULE');
      else setSubmitMode('DRAFT');

      const blocks: StoryBlock[] = editingStory.blocks || [];
      const leadBlock = blocks.find((b) => b.blockType === 'paragraph');
      setLeadParagraph((leadBlock?.data as { text?: string } | undefined)?.text || '');

      const bulletBlock = blocks.find(
        (b) => b.blockType === 'summary' || (b.blockType as string) === 'bullet_list'
      );
      const bulletData = bulletBlock?.data as
        { items?: string[]; bulletPoints?: string[] } | undefined;
      const items = bulletData?.items || bulletData?.bulletPoints || [];
      setBullet1(items[0] || '');
      setBullet2(items[1] || '');
      setBullet3(items[2] || '');

      const loadedMedia: MediaBlockDraft[] = [];
      blocks.forEach((b: StoryBlock, idx: number) => {
        if (b.blockType === 'image') {
          const imgData = b.data as
            { url?: string; caption?: string; credit?: string; altText?: string } | undefined;
          loadedMedia.push({
            id: b.id || `img_${idx}`,
            type: 'image',
            data: {
              url: imgData?.url || '',
              caption: imgData?.caption || '',
              credit: imgData?.credit || '',
              altText: imgData?.altText || '',
            },
          });
        } else if (b.blockType === 'chart') {
          const chartData = b.data as unknown as
            | {
                chartType?: string;
                title?: string;
                xAxis?: string | { label?: string; key?: string };
                yAxis?: string | { label?: string; key?: string };
                dataRows?: string;
              }
            | undefined;
          loadedMedia.push({
            id: b.id || `chart_${idx}`,
            type: 'chart',
            data: {
              chartType: chartData?.chartType || 'bar',
              title: chartData?.title || '',
              xAxis:
                typeof chartData?.xAxis === 'string'
                  ? chartData.xAxis
                  : chartData?.xAxis?.label || '',
              yAxis:
                typeof chartData?.yAxis === 'string'
                  ? chartData.yAxis
                  : chartData?.yAxis?.label || '',
              dataRows: chartData?.dataRows || '',
            },
          });
        } else if (b.blockType === 'quote' || (b.blockType as string) === 'pull_quote') {
          const quoteData = b.data as
            { quote?: string; attribution?: string; title?: string } | undefined;
          loadedMedia.push({
            id: b.id || `quote_${idx}`,
            type: 'quote',
            data: {
              quote: quoteData?.quote || '',
              attribution: quoteData?.attribution || '',
              title: quoteData?.title || '',
            },
          });
        } else if (b.blockType === 'timeline') {
          const tData = b.data as
            | {
                title?: string;
                items?: Array<{ date: string; headline: string; body: string }>;
              }
            | undefined;
          loadedMedia.push({
            id: b.id || `time_${idx}`,
            type: 'timeline',
            data: {
              title: tData?.title || '',
            },
            items: tData?.items || [],
          });
        } else if (b.blockType === 'video') {
          const vidData = b.data as
            { url?: string; caption?: string; durationSeconds?: number } | undefined;
          loadedMedia.push({
            id: b.id || `vid_${idx}`,
            type: 'video',
            data: {
              url: vidData?.url || '',
              caption: vidData?.caption || '',
              durationSeconds: vidData?.durationSeconds || 120,
            },
          });
        } else if (b.blockType === 'table') {
          const tableData = b.data as
            | {
                title?: string;
                headers?: string[] | string;
                rows?: unknown[][];
                footer?: string;
              }
            | undefined;
          loadedMedia.push({
            id: b.id || `tbl_${idx}`,
            type: 'table',
            data: {
              title: tableData?.title || '',
              headers: Array.isArray(tableData?.headers)
                ? tableData?.headers.join(', ')
                : tableData?.headers || '',
              rowsText: Array.isArray(tableData?.rows)
                ? tableData?.rows.map((r: unknown[]) => r.join(', ')).join('\n')
                : '',
              footer: tableData?.footer || '',
            },
          });
        } else if (b.blockType === 'callout') {
          const calloutData = b.data as
            { style?: string; title?: string; text?: string } | undefined;
          loadedMedia.push({
            id: b.id || `call_${idx}`,
            type: 'callout',
            data: {
              style: calloutData?.style || 'info',
              title: calloutData?.title || '',
              text: calloutData?.text || '',
            },
          });
        } else if (b.blockType === 'statistic') {
          const statData = b.data as
            | {
                label?: string;
                value?: string;
                trend?: string;
                trendValue?: string;
                context?: string;
              }
            | undefined;
          loadedMedia.push({
            id: b.id || `stat_${idx}`,
            type: 'statistic',
            data: {
              label: statData?.label || '',
              value: statData?.value || '',
              trend: statData?.trend || 'up',
              trendValue: statData?.trendValue || '',
              context: statData?.context || '',
            },
          });
        }
      });
      setMediaBlocks(loadedMedia);
    } else {
      setTitle('');
      setSummary('');
      setCategory('technology');
      setAuthorName('Senior Staff Journalist');
      setHeroImageUrl(
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80'
      );
      setLeadParagraph('');
      setBullet1('');
      setBullet2('');
      setBullet3('');
      setMediaBlocks([]);
      setIsSubscriberOnly(false);
      setSubmitMode('PUBLISH');
      setScheduledAtInput('');
      setViewMode('compose');
    }
  }, [editingStory, isOpen]);

  if (!isOpen) return null;

  const addImageBlock = () => {
    setMediaBlocks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'image',
        data: {
          url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
          caption: 'Figure: High-precision instrumentation and semiconductor diagnostics.',
          credit: 'Bureau Photo Service',
          altText: 'Editorial photo',
        },
      },
    ]);
  };

  const addChartBlock = () => {
    setMediaBlocks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'chart',
        data: {
          chartType: 'bar',
          title: 'Projected Output & Market Volume (2024-2027)',
          xAxis: 'Year',
          yAxis: 'Metric Units',
          dataRows: '2024: 15\n2025: 35\n2026: 72\n2027: 120',
        },
      },
    ]);
  };

  const addQuoteBlock = () => {
    setMediaBlocks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'quote',
        data: {
          quote: 'We are observing a fundamental transition toward sovereign resilient systems.',
          attribution: 'Dr. Sarah Mitchell',
          title: 'Director of Policy & Research',
        },
      },
    ]);
  };

  const addTimelineBlock = () => {
    setMediaBlocks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'timeline',
        data: {
          title: 'Key Milestones & Timeline',
        },
        items: [
          {
            date: 'Phase 1 • 09:00 AM',
            headline: 'Working Group Formal Convening',
            body: 'Delegations confirm multilateral agenda.',
          },
          {
            date: 'Phase 2 • 02:30 PM',
            headline: 'Technical Framework Approved',
            body: 'All parties ratify operational protocol.',
          },
        ],
      },
    ]);
  };

  const addVideoBlock = () => {
    setMediaBlocks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'video',
        data: {
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          caption: 'Live video dispatch and ministerial press briefing.',
          durationSeconds: 180,
        },
      },
    ]);
  };

  const addTableBlock = () => {
    setMediaBlocks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'table',
        data: {
          title: 'Comparative Benchmark Matrix',
          headers: 'Metric / Indicator, Baseline 2024, Current 2025, Target 2026',
          rowsText:
            'Throughput (TFLOPS), 14.2, 48.9, 120.0\nThermal Dissipation (W), 280, 210, 165\nLatency (μs), 4.2, 1.8, 0.9',
          footer: 'Source: Official Engineering Audit and Independent Laboratory Validation.',
        },
      },
    ]);
  };

  const addCalloutBlock = () => {
    setMediaBlocks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'callout',
        data: {
          style: 'info',
          title: 'Regulatory & Editorial Context',
          text: 'This policy dispatch incorporates verified statements from accredited delegations and primary regulatory filings.',
        },
      },
    ]);
  };

  const addStatisticBlock = () => {
    setMediaBlocks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'statistic',
        data: {
          label: 'Total Sovereign Allocation ($ Billion)',
          value: '42.8',
          trend: 'up',
          trendValue: '+28.4% YoY',
          context: 'Cumulative multilateral infrastructure development commitments.',
        },
      },
    ]);
  };

  const removeMediaBlock = (id: string) => {
    setMediaBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const updateMediaBlockData = (
    id: string,
    field: string,
    value: string | number | readonly string[] | undefined
  ) => {
    setMediaBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, data: { ...b.data, [field]: value } } : b))
    );
  };

  const getAssembledBlocks = (): StoryBlock[] => {
    const blocks: StoryBlock[] = [];

    if (leadParagraph.trim()) {
      blocks.push({
        id: `blk_lead_${editingStory?.id || 'new'}`,
        blockType: 'paragraph',
        sortOrder: 0,
        data: { text: leadParagraph.trim(), format: 'markdown' },
      });
    }

    const keyTakeaways = [bullet1, bullet2, bullet3].filter((b) => b.trim().length > 0);
    if (keyTakeaways.length > 0) {
      blocks.push({
        id: `blk_takeaways_${editingStory?.id || 'new'}`,
        blockType: 'summary',
        sortOrder: 1,
        data: {
          headline: 'Key Takeaways',
          bulletPoints: keyTakeaways,
        },
      });
    }

    mediaBlocks.forEach((m) => {
      const sortOrder = blocks.length;
      if (m.type === 'image') {
        blocks.push({
          id: `img_${m.id}`,
          blockType: 'image',
          sortOrder,
          data: {
            url: String(m.data.url || ''),
            caption: m.data.caption ? String(m.data.caption) : undefined,
            credit: m.data.credit ? String(m.data.credit) : undefined,
            altText: String(m.data.altText || m.data.caption || 'Image'),
            aspectRatio: '16:9',
          },
        } as unknown as StoryBlock);
      } else if (m.type === 'chart') {
        blocks.push({
          id: `chart_${m.id}`,
          blockType: 'chart',
          sortOrder,
          data: {
            chartType: m.data.chartType,
            title: m.data.title,
            xAxis: m.data.xAxis,
            yAxis: m.data.yAxis,
            dataRows: m.data.dataRows,
          },
        } as unknown as StoryBlock);
      } else if (m.type === 'quote') {
        blocks.push({
          id: `quote_${m.id}`,
          blockType: 'quote',
          sortOrder,
          data: {
            quote: String(m.data.quote || ''),
            attribution: String(m.data.attribution || ''),
            title: m.data.title ? String(m.data.title) : undefined,
          },
        } as unknown as StoryBlock);
      } else if (m.type === 'timeline') {
        blocks.push({
          id: `time_${m.id}`,
          blockType: 'timeline',
          sortOrder,
          data: {
            title: m.data.title ? String(m.data.title) : undefined,
            items:
              m.items && m.items.length > 0
                ? m.items
                : [
                    {
                      date: '09:00 AM',
                      headline: 'Formal Session Convenes',
                      body: 'Proceedings opened.',
                    },
                  ],
          },
        } as unknown as StoryBlock);
      } else if (m.type === 'video') {
        blocks.push({
          id: `vid_${m.id}`,
          blockType: 'video',
          sortOrder,
          data: {
            url: m.data.url,
            caption: m.data.caption,
            durationSeconds: Number(m.data.durationSeconds) || 120,
          },
        } as unknown as StoryBlock);
      } else if (m.type === 'table') {
        const rawHeaders = Array.isArray(m.data.headers)
          ? m.data.headers
          : String(m.data.headers || '')
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean);
        const rawRows = Array.isArray(m.data.rows)
          ? m.data.rows
          : String(m.data.rowsText || '')
              .split('\n')
              .filter(Boolean)
              .map((line: string) => line.split(',').map((c: string) => c.trim()));
        blocks.push({
          id: `tbl_${m.id}`,
          blockType: 'table',
          sortOrder,
          data: {
            title: m.data.title,
            headers: rawHeaders.length > 0 ? rawHeaders : ['Column A', 'Column B'],
            rows: rawRows.length > 0 ? rawRows : [['Item 1', 'Item 2']],
            footer: m.data.footer,
          },
        } as unknown as StoryBlock);
      } else if (m.type === 'callout') {
        blocks.push({
          id: `call_${m.id}`,
          blockType: 'callout',
          sortOrder,
          data: {
            style: m.data.style || 'info',
            title: m.data.title,
            text: m.data.text,
          },
        } as unknown as StoryBlock);
      } else if (m.type === 'statistic') {
        blocks.push({
          id: `stat_${m.id}`,
          blockType: 'statistic',
          sortOrder,
          data: {
            label: m.data.label,
            value: m.data.value,
            trend: m.data.trend || 'up',
            trendValue: m.data.trendValue,
            context: m.data.context,
          },
        } as unknown as StoryBlock);
      }
    });

    return blocks;
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) {
      alert('Please fill in the required fields: Title and Summary.');
      return;
    }

    if (submitMode === 'SCHEDULE' && !scheduledAtInput) {
      alert('Please provide a scheduled publication date and time.');
      return;
    }

    const newBlocks = getAssembledBlocks();

    try {
      const initialStatus = submitMode === 'DRAFT' ? 'DRAFT' : 'PUBLISHED';

      if (editingStory) {
        await updateUserStory(editingStory.id, {
          title: title.trim(),
          summary: summary.trim(),
          status: initialStatus,
          articleType: category,
          topicIds: [`top_${category}`],
          heroImageUrl: heroImageUrl.trim() || undefined,
          isSubscriberOnly,
          blocks: newBlocks,
          changeSummary: `Editorial revision by ${authorName}`,
        });

        if (submitMode === 'REVIEW') {
          await submitStoryForReview(editingStory.id);
        } else if (submitMode === 'SCHEDULE' && scheduledAtInput) {
          const targetIso = new Date(scheduledAtInput).toISOString();
          await scheduleStory(editingStory.id, targetIso);
        }

        onSuccess(`Story "${title}" updated successfully with new revision snapshot!`);
      } else {
        const created = await saveUserStory({
          title: title.trim(),
          summary: summary.trim(),
          status: initialStatus,
          articleType: category,
          topicIds: [`top_${category}`],
          entityIds: [],
          sourceIds: [],
          heroImageUrl: heroImageUrl.trim() || undefined,
          isSubscriberOnly,
          authorId: `usr_${authorName.toLowerCase().replace(/\s+/g, '_')}`,
          blocks: newBlocks,
        });

        if (submitMode === 'REVIEW') {
          await submitStoryForReview(created.id);
        } else if (submitMode === 'SCHEDULE') {
          const targetIso = new Date(scheduledAtInput).toISOString();
          await scheduleStory(created.id, targetIso);
        }

        onSuccess(
          submitMode === 'REVIEW'
            ? `Story "${title}" submitted to the Editorial Review Queue!`
            : submitMode === 'SCHEDULE'
              ? `Story "${title}" embargo scheduled for ${new Date(scheduledAtInput).toLocaleString()}!`
              : submitMode === 'DRAFT'
                ? `Draft saved successfully!`
                : `Story "${title}" published immediately to live reader feeds!`
        );
      }

      onClose();

      // Reset Form
      setTitle('');
      setSummary('');
      setLeadParagraph('');
      setBullet1('');
      setBullet2('');
      setBullet3('');
      setMediaBlocks([]);
      setScheduledAtInput('');
    } catch (err) {
      console.error('Failed to submit story:', err);
      alert(
        `Failed to ${editingStory ? 'update' : 'create'} story. Please check the console for details.`
      );
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {editingStory ? `Edit Story: "${editingStory.title}"` : 'Draft a New Story Dispatch'}
          </h2>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('compose')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'compose'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>✍️ Compose & Blocks</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>👁️ Live Article Preview</span>
          </button>
        </div>

        {viewMode === 'preview' && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-time Block Rendering
          </span>
        )}
      </div>

      <form onSubmit={handleCreateStory} className="space-y-6">
        {viewMode === 'preview' ? (
          /* Live Article Preview Canvas */
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 shadow-inner space-y-6">
            {heroImageUrl && (
              <div className="relative aspect-video sm:aspect-21/9 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                <img
                  src={heroImageUrl}
                  alt={title || 'Story hero image'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-blue-600 font-bold uppercase tracking-wider text-[10px]">
                    {category}
                  </span>
                  <span className="text-slate-300">By {authorName} • Just now (Preview)</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {title || 'Untitled Story Headline'}
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-serif-headline">
                {summary || 'Executive summary overview will be displayed here once drafted.'}
              </p>
            </div>

            {/* Assembled Interactive Blocks via Production StoryRenderer */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              <StoryRenderer blocks={getAssembledBlocks()} theme="dark" />
            </div>
          </div>
        ) : (
          /* Compose & Blocks Editing Mode */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ArticleType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="technology">Technology & Silicon</option>
                  <option value="business">Business & Economy</option>
                  <option value="world">World Affairs</option>
                  <option value="science">Science & Energy</option>
                  <option value="sports">Sports</option>
                  <option value="health">Health & Medicine</option>
                </select>
              </div>

              {/* Subscriber Exclusive Access Toggle */}
              <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Subscriber Only Story
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Restrict full article access and investigative dossier to GlobalPulse Digital
                      subscribers.
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSubscriberOnly}
                    onChange={(e) => setIsSubscriberOnly(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Author Byline
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Vikram Malhotra, Senior Tech Reporter"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Headline / Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Quantum Computing Startup Achieves 10,000 Logical Qubit Error Suppression"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Executive Summary / Subtitle *
              </label>
              <textarea
                required
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Provide a concise 1-2 sentence executive overview of the story."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs leading-relaxed focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Cover Photo URL
              </label>
              <input
                type="url"
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Lead Paragraph (Dispatch Body)
              </label>
              <textarea
                rows={4}
                value={leadParagraph}
                onChange={(e) => setLeadParagraph(e.target.value)}
                placeholder="Write the comprehensive opening dispatch and verified facts..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs leading-relaxed focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Key Takeaways */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                Key Takeaways / Bullet Highlights
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={bullet1}
                  onChange={(e) => setBullet1(e.target.value)}
                  placeholder="• Primary breakthrough or core finding"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs"
                />
                <input
                  type="text"
                  value={bullet2}
                  onChange={(e) => setBullet2(e.target.value)}
                  placeholder="• Market or geopolitical impact"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs"
                />
                <input
                  type="text"
                  value={bullet3}
                  onChange={(e) => setBullet3(e.target.value)}
                  placeholder="• Next steps and upcoming timeline"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs"
                />
              </div>
            </div>

            {/* Rich Media Block Inserter */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                    Rich Media & Interactive Block Engine
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Add supporting data charts, pull quotes, photo credits, timeline milestones,
                    comparison tables, or callouts.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={addImageBlock}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> + Image
                  </button>
                  <button
                    type="button"
                    onClick={addChartBlock}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-emerald-500" /> + Chart
                  </button>
                  <button
                    type="button"
                    onClick={addQuoteBlock}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
                  >
                    <Quote className="w-3.5 h-3.5 text-purple-500" /> + Quote
                  </button>
                  <button
                    type="button"
                    onClick={addTimelineBlock}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-500" /> + Timeline
                  </button>
                  <button
                    type="button"
                    onClick={addTableBlock}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
                  >
                    <TableIcon className="w-3.5 h-3.5 text-cyan-500" /> + Table
                  </button>
                  <button
                    type="button"
                    onClick={addCalloutBlock}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> + Callout
                  </button>
                  <button
                    type="button"
                    onClick={addStatisticBlock}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> + Stat
                  </button>
                  <button
                    type="button"
                    onClick={addVideoBlock}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 text-rose-500" /> + Video
                  </button>
                </div>
              </div>

              {mediaBlocks.length > 0 && (
                <div className="space-y-3 pt-2">
                  {mediaBlocks.map((block, idx) => (
                    <div
                      key={block.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          Block {idx + 1}: {block.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMediaBlock(block.id)}
                          className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {block.type === 'image' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-500 mb-1">Image URL</label>
                            <input
                              type="url"
                              value={block.data.url}
                              onChange={(e) =>
                                updateMediaBlockData(block.id, 'url', e.target.value)
                              }
                              placeholder="https://..."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">Photo Credit</label>
                            <input
                              type="text"
                              value={block.data.credit}
                              onChange={(e) =>
                                updateMediaBlockData(block.id, 'credit', e.target.value)
                              }
                              placeholder="e.g. Reuters / Bureau Staff"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-slate-500 mb-1">Caption</label>
                            <input
                              type="text"
                              value={block.data.caption}
                              onChange={(e) =>
                                updateMediaBlockData(block.id, 'caption', e.target.value)
                              }
                              placeholder="Caption describing the image..."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'chart' && (
                        <div className="space-y-3 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-slate-500 mb-1">Chart Type</label>
                              <select
                                value={block.data.chartType}
                                onChange={(e) =>
                                  updateMediaBlockData(block.id, 'chartType', e.target.value)
                                }
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                              >
                                <option value="bar">Bar Chart</option>
                                <option value="line">Line Chart</option>
                                <option value="kpi">KPI Metric Stat</option>
                              </select>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-slate-500 mb-1">Chart Title</label>
                              <input
                                type="text"
                                value={block.data.title}
                                onChange={(e) =>
                                  updateMediaBlockData(block.id, 'title', e.target.value)
                                }
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">
                              Data Rows (Label: Value)
                            </label>
                            <textarea
                              rows={3}
                              value={block.data.dataRows}
                              onChange={(e) =>
                                updateMediaBlockData(block.id, 'dataRows', e.target.value)
                              }
                              placeholder="2024: 15&#10;2025: 35&#10;2026: 72"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px]"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'quote' && (
                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block text-slate-500 mb-1">Quote Statement</label>
                            <textarea
                              rows={2}
                              value={block.data.quote}
                              onChange={(e) =>
                                updateMediaBlockData(block.id, 'quote', e.target.value)
                              }
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-500 mb-1">Attributed Person</label>
                              <input
                                type="text"
                                value={block.data.attribution}
                                onChange={(e) =>
                                  updateMediaBlockData(block.id, 'attribution', e.target.value)
                                }
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-500 mb-1">
                                Speaker Role / Title
                              </label>
                              <input
                                type="text"
                                value={block.data.title}
                                onChange={(e) =>
                                  updateMediaBlockData(block.id, 'title', e.target.value)
                                }
                                placeholder="e.g. Chief Economist"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {block.type === 'timeline' && (
                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block text-slate-500 mb-1">Timeline Title</label>
                            <input
                              type="text"
                              value={block.data.title}
                              onChange={(e) =>
                                updateMediaBlockData(block.id, 'title', e.target.value)
                              }
                              placeholder="e.g. Summit Timeline"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'table' && (
                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block text-slate-500 mb-1">Table Title</label>
                            <input
                              type="text"
                              value={block.data.title}
                              onChange={(e) =>
                                updateMediaBlockData(block.id, 'title', e.target.value)
                              }
                              placeholder="e.g. Sovereign AI Supercluster Specs"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">
                              Column Headers (Comma-separated)
                            </label>
                            <input
                              type="text"
                              value={block.data.headers}
                              onChange={(e) =>
                                updateMediaBlockData(block.id, 'headers', e.target.value)
                              }
                              placeholder="Metric, Baseline 2024, Target 2026"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">
                              Table Rows (One row per line, comma-separated)
                            </label>
                            <textarea
                              rows={3}
                              value={block.data.rowsText}
                              onChange={(e) =>
                                updateMediaBlockData(block.id, 'rowsText', e.target.value)
                              }
                              placeholder="Latency (ms), 4.2, 0.9&#10;Bandwidth (TB/s), 12.5, 48.0"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">
                              Footer / Attribution
                            </label>
                            <input
                              type="text"
                              value={block.data.footer}
                              onChange={(e) =>
                                updateMediaBlockData(block.id, 'footer', e.target.value)
                              }
                              placeholder="Source: Technical Benchmark Commission"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'callout' && (
                        <div className="space-y-3 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-slate-500 mb-1">Callout Tone</label>
                              <select
                                value={(block.data.style as string) || 'info'}
                                onChange={(e) =>
                                  updateMediaBlockData(block.id, 'style', e.target.value)
                                }
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                              >
                                <option value="info">Info (Blue)</option>
                                <option value="tip">Tip / Solution (Green)</option>
                                <option value="warning">Warning (Amber)</option>
                                <option value="critical">Critical Alert (Red)</option>
                              </select>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-slate-500 mb-1">Callout Title</label>
                              <input
                                type="text"
                                value={block.data.title}
                                onChange={(e) =>
                                  updateMediaBlockData(block.id, 'title', e.target.value)
                                }
                                placeholder="e.g. Strategic Regulatory Context"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">Callout Content</label>
                            <textarea
                              rows={2}
                              value={block.data.text}
                              onChange={(e) =>
                                updateMediaBlockData(block.id, 'text', e.target.value)
                              }
                              placeholder="Important context or takeaway note..."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'statistic' && (
                        <div className="space-y-3 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-500 mb-1">Metric Label</label>
                              <input
                                type="text"
                                value={block.data.label}
                                onChange={(e) =>
                                  updateMediaBlockData(block.id, 'label', e.target.value)
                                }
                                placeholder="e.g. Projected Market Capitalization"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-500 mb-1">Key Value</label>
                              <input
                                type="text"
                                value={block.data.value}
                                onChange={(e) =>
                                  updateMediaBlockData(block.id, 'value', e.target.value)
                                }
                                placeholder="e.g. $1.4 Trillion"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-500 mb-1">Trend Direction</label>
                              <select
                                value={(block.data.trend as string) || 'up'}
                                onChange={(e) =>
                                  updateMediaBlockData(block.id, 'trend', e.target.value)
                                }
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                              >
                                <option value="up">Upward (↑)</option>
                                <option value="down">Downward (↓)</option>
                                <option value="neutral">Neutral (—)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-slate-500 mb-1">
                                Trend Value / Delta
                              </label>
                              <input
                                type="text"
                                value={block.data.trendValue}
                                onChange={(e) =>
                                  updateMediaBlockData(block.id, 'trendValue', e.target.value)
                                }
                                placeholder="e.g. +24.8% YoY"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">Context / Caption</label>
                            <input
                              type="text"
                              value={block.data.context}
                              onChange={(e) =>
                                updateMediaBlockData(block.id, 'context', e.target.value)
                              }
                              placeholder="e.g. Based on verified multilateral fiscal disclosures."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'video' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-500 mb-1">Video Stream URL</label>
                            <input
                              type="url"
                              value={block.data.url}
                              onChange={(e) =>
                                updateMediaBlockData(block.id, 'url', e.target.value)
                              }
                              placeholder="https://..."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">Duration (Seconds)</label>
                            <input
                              type="number"
                              value={block.data.durationSeconds}
                              onChange={(e) =>
                                updateMediaBlockData(block.id, 'durationSeconds', e.target.value)
                              }
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Publishing Target / Embargo Time */}
        {submitMode === 'SCHEDULE' && (
          <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
              <Calendar className="w-4 h-4" />
              <span>Embargo Publishing Schedule</span>
            </div>
            <input
              type="datetime-local"
              required
              value={scheduledAtInput}
              onChange={(e) => setScheduledAtInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none"
            />
            <p className="text-[11px] text-purple-600 dark:text-purple-400">
              The automated background scheduler will automatically flip this story to PUBLISHED and
              broadcast it over SSE the moment this timestamp arrives.
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400">
            Supports human journalism & autonomous external AI agents via MCP.
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              onClick={() => setSubmitMode('DRAFT')}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              {editingStory ? 'Save Changes as Draft' : 'Save as Draft'}
            </button>
            <button
              type="submit"
              onClick={() => setSubmitMode('REVIEW')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{editingStory ? 'Save & Submit for Review' : 'Submit for Review'}</span>
            </button>
            <button
              type="submit"
              onClick={() => setSubmitMode('SCHEDULE')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Release</span>
            </button>
            <button
              type="submit"
              onClick={() => setSubmitMode('PUBLISH')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              {editingStory ? 'Save & Publish Revision' : 'Publish Immediately'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
