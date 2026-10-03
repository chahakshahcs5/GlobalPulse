'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Trash2, Eye } from 'lucide-react';
import type { StoryBlock, ArticleType } from '@ai-news/schemas';
import {
  saveUserStory,
  updateUserStory,
  submitStoryForReview,
  useScheduledStories,
} from '../../../../lib/news-store';
import { StoryRenderer } from '../../../../components/StoryRenderer';
import type { MediaBlockDraft, StoryEditorDrawerProps } from './types';
import { createDefaultMediaBlock, assembleStoryBlocks } from './block-factories';
import { BlockFieldEditor } from './BlockFieldEditor';
import { StoryMetadataSection } from './StoryMetadataSection';
import { StoryTakeawaysSection } from './StoryTakeawaysSection';
import { StoryBlockToolbar } from './StoryBlockToolbar';
import { StoryPublishActions } from './StoryPublishActions';

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

  const handleAddBlock = (type: MediaBlockDraft['type']) => {
    setMediaBlocks((prev: MediaBlockDraft[]) => [...prev, createDefaultMediaBlock(type)]);
  };

  const removeMediaBlock = (id: string) => {
    setMediaBlocks((prev: MediaBlockDraft[]) => prev.filter((b: MediaBlockDraft) => b.id !== id));
  };

  const updateMediaBlockData = (
    id: string,
    field: string,
    value: string | number | readonly string[] | undefined
  ) => {
    setMediaBlocks((prev: MediaBlockDraft[]) =>
      prev.map((b: MediaBlockDraft) =>
        b.id === id ? { ...b, data: { ...b.data, [field]: value } } : b
      )
    );
  };

  const getAssembledBlocks = (): StoryBlock[] => {
    return assembleStoryBlocks({
      leadParagraph,
      bullet1,
      bullet2,
      bullet3,
      mediaBlocks,
      storyId: editingStory?.id,
    });
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
            <StoryMetadataSection
              category={category}
              setCategory={setCategory}
              isSubscriberOnly={isSubscriberOnly}
              setIsSubscriberOnly={setIsSubscriberOnly}
              title={title}
              setTitle={setTitle}
              summary={summary}
              setSummary={setSummary}
              authorName={authorName}
              setAuthorName={setAuthorName}
              heroImageUrl={heroImageUrl}
              setHeroImageUrl={setHeroImageUrl}
            />

            <StoryTakeawaysSection
              leadParagraph={leadParagraph}
              setLeadParagraph={setLeadParagraph}
              bullet1={bullet1}
              setBullet1={setBullet1}
              bullet2={bullet2}
              setBullet2={setBullet2}
              bullet3={bullet3}
              setBullet3={setBullet3}
            />

            {/* Rich Media Block Inserter */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-4">
              <StoryBlockToolbar onAddBlock={handleAddBlock} />

              {mediaBlocks.length > 0 && (
                <div className="space-y-3 pt-2">
                  {mediaBlocks.map((block: MediaBlockDraft, idx: number) => (
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

                      <BlockFieldEditor block={block} updateMediaBlockData={updateMediaBlockData} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <StoryPublishActions
          submitMode={submitMode}
          setSubmitMode={setSubmitMode}
          scheduledAtInput={scheduledAtInput}
          setScheduledAtInput={setScheduledAtInput}
          editingStory={editingStory}
        />
      </form>
    </div>
  );
}
