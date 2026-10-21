'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, FileText, Eye, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ArticleType, StoryBlock } from '@ai-news/schemas';
import {
  saveUserStory,
  updateUserStory,
  submitStoryForReview,
  useScheduledStories,
} from '../../../../lib/news-store';
import {
  addBlock as addBlockToStory,
  createStory,
  getStory,
  removeBlock as removeBlockFromStory,
  reorderBlocks,
  updateBlock as updateBlockInStory,
} from '@ai-news/api-client';
import { StoryRenderer } from '../../../../components/StoryRenderer';
import { studioUrl } from '../../../../lib/studio-url';
import { takeBlockFromComposer } from '@ai-news/block-studio';
import { StoryMetadataSection } from './StoryMetadataSection';
import { StoryBlockList } from './StoryBlockList';
import { StoryPublishActions } from './StoryPublishActions';
import { validateStoryBlocks } from './block-factories';
import type { BlockChange, StoryEditorDrawerProps } from './types';

/**
 * A fingerprint of a list of blocks.
 *
 * Two lists with the same fingerprint hold the same blocks, in the same
 * order, with the same payloads. It is how the composer tells its own
 * edits from the platform's.
 *
 * It covers the whole block, not just its content: a block's presentation,
 * its accessibility text and its provenance are as editable as its words
 * are, and an edit to any of them is an edit the composer must not throw
 * away.
 */
function fingerprint(blocks: StoryBlock[]): string {
  return JSON.stringify(
    blocks.map((block) => [
      block.id,
      block.sortOrder,
      block.data,
      block.presentation,
      block.accessibility,
      block.provenance,
      block.citationIds,
      block.sourceIds,
      block.metadata,
    ])
  );
}

/**
 * The newsroom composer.
 *
 * The story is a list of blocks, and the composer edits that list. It does
 * not keep its own private arrangement of a few fields and rebuild the story
 * from them on save — that is how a story loses the blocks it had.
 *
 * A draft is written to the API as it is edited. A published story is not:
 * its changes wait for the version commit that publishes them, because a
 * live story's changes should be a deliberate and recorded act.
 */
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
  const [isSubscriberOnly, setIsSubscriberOnly] = useState(false);

  /**
   * The story's blocks, in the order they read.
   */
  const [blocks, setBlocks] = useState<StoryBlock[]>([]);

  /**
   * Identifies this composer session, so a block handed over by the studio
   * finds its way back to this draft and not to another one.
   */
  const composerSession = useRef(
    `composer_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  );

  /**
   * The story's id on the server, once it has one.
   *
   * A story being written does not exist on the server yet. The first block
   * the editor adds creates it as a draft, and from then on the blocks are
   * written to the API as they are edited.
   */
  const [storyId, setStoryId] = useState<string | null>(null);

  /**
   * The story being created, if one is on its way.
   *
   * Two blocks added in quick succession must not create two stories, so
   * the second one waits for the first.
   */
  const creatingStory = useRef<Promise<string> | null>(null);

  /** What the platform has been told, so the editor is not lied to. */
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  /**
   * The blocks as the platform last had them.
   *
   * A block added in the Block Studio reaches the API, not this tab. When
   * the editor comes back, the story is read again — but only if they have
   * not changed anything here, because their own edits are the newer truth
   * and a refresh would throw them away.
   */
  const [serverSignature, setServerSignature] = useState('');

  /**
   * Pre-populate fields when editing an existing story, or reset for new
   *
   * Every block the story has is loaded — not the handful the composer used
   * to understand. A story is somebody else's work, and the composer has to
   * show all of it.
   */
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
      setBlocks(editingStory.blocks ?? []);
      setStoryId(editingStory.id);
      setServerSignature(fingerprint(editingStory.blocks ?? []));

      if (editingStory.status === 'PUBLISHED') setSubmitMode('PUBLISH');
      else if (editingStory.status === 'IN_REVIEW') setSubmitMode('REVIEW');
      else if (editingStory.status === 'SCHEDULED') setSubmitMode('SCHEDULE');
      else setSubmitMode('DRAFT');
    } else {
      setTitle('');
      setSummary('');
      setCategory('technology');
      setAuthorName('Senior Staff Journalist');
      setHeroImageUrl(
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80'
      );
      setBlocks([]);
      setStoryId(null);
      setIsSubscriberOnly(false);
      setSubmitMode('PUBLISH');
      setScheduledAtInput('');
      setViewMode('compose');
    }
    setSaveState('idle');
    setSaveError(null);
  }, [editingStory, isOpen]);

  /**
   * Pick up a block handed over by the Block Studio.
   *
   * The studio writes the block to the browser and the editor picks it up
   * when they come back to this tab — the studio is usually opened in a new
   * one. The block joins the draft, so it is written when the story is saved.
   */
  useEffect(() => {
    if (!isOpen) return;

    const collect = () => {
      const handed = takeBlockFromComposer(composerSession.current);
      if (!handed) return;

      const id = handed.blockId ?? `blk_${handed.blockType}_${Date.now().toString(36)}`;
      setBlocks((previous) => {
        const without = previous.filter((block) => block.id !== id);
        return [
          ...without,
          {
            id,
            blockType: handed.blockType,
            sortOrder: without.length,
            ...handed.payload,
          } as StoryBlock,
        ];
      });
    };

    // The editor coming back to this tab is the usual signal.
    window.addEventListener('focus', collect);
    // The studio may also write while this tab is in front.
    window.addEventListener('storage', collect);
    collect();

    return () => {
      window.removeEventListener('focus', collect);
      window.removeEventListener('storage', collect);
    };
  }, [isOpen]);

  /**
   * The story's blocks, numbered as they will be saved.
   */
  const getAssembledBlocks = (): StoryBlock[] =>
    blocks.map((block, order) => ({ ...block, sortOrder: order }));

  /**
   * Whether the blocks are written to the API as they are edited.
   *
   * A draft is written as it is edited — that is the point of a draft. A
   * published story is not: its blocks wait for the version commit that
   * publishes them, so a live story never changes without a record of it.
   */
  const writesLive = !editingStory || editingStory.status === 'DRAFT';

  /**
   * Make sure the story exists on the server, so a block has somewhere to go.
   *
   * A story being written has no id yet. Rather than keep the blocks in the
   * browser until the story is published, the story is created as a draft
   * the first time a block is added — and the blocks are written from then
   * on, exactly as they are for any other draft.
   */
  const ensureStoryOnServer = useCallback(async (): Promise<string> => {
    if (storyId) return storyId;

    if (!creatingStory.current) {
      creatingStory.current = createStory({
        title: title.trim() || 'Untitled dispatch',
        summary: summary.trim() || 'Draft in progress.',
        articleType: category,
        topicIds: [`top_${category}`],
        entityIds: [],
        sourceIds: [],
        heroImageUrl: heroImageUrl.trim() || undefined,
        isSubscriberOnly,
        blocks: [],
      })
        .then((created) => {
          setStoryId(created.id);
          return created.id;
        })
        .finally(() => {
          creatingStory.current = null;
        });
    }

    return creatingStory.current;
  }, [category, heroImageUrl, isSubscriberOnly, storyId, summary, title]);

  /**
   * Write a change to the blocks to the API.
   *
   * The server is told what changed — a block added, a block edited, a
   * block removed, the order changed — rather than being handed the whole
   * list, because the whole list is what the editor already has.
   */
  const persistBlocks = useCallback(async (id: string, next: StoryBlock[], change: BlockChange) => {
    try {
      setSaveState('saving');
      setSaveError(null);

      switch (change.kind) {
        case 'added':
          await addBlockToStory(id, change.block);
          break;
        case 'edited':
          await updateBlockInStory(id, change.block.id, change.block);
          break;
        case 'removed':
          await removeBlockFromStory(id, change.block.id);
          break;
        case 'reordered':
          await reorderBlocks(
            id,
            next.map((block) => block.id)
          );
          break;
      }

      setSaveState('saved');
    } catch (cause) {
      setSaveState('error');
      setSaveError(
        cause instanceof Error ? cause.message : 'The change could not be saved to the API.'
      );
    }
  }, []);

  /**
   * A change to the block list.
   *
   * The list is updated straight away, and — for a draft — the change is
   * written to the API as well. The editor sees their change either way; the
   * difference is whether it survives a closed tab.
   */
  const changeBlocks = useCallback(
    (next: StoryBlock[], change: BlockChange) => {
      setBlocks(next);
      if (!writesLive) return;

      void (async () => {
        try {
          const id = await ensureStoryOnServer();
          await persistBlocks(id, next, change);
        } catch (cause) {
          setSaveState('error');
          setSaveError(
            cause instanceof Error
              ? cause.message
              : 'The story could not be created, so the block was not saved.'
          );
        }
      })();
    },
    [ensureStoryOnServer, persistBlocks, writesLive]
  );

  /**
   * Pick up what changed while the editor was elsewhere.
   *
   * The Block Studio writes to the API, so a block added there is not in
   * this tab. The story is read again when the editor comes back — but
   * only when they have not changed anything here, because their own edits
   * are the newer truth.
   */
  useEffect(() => {
    if (!isOpen) return;

    const refresh = async () => {
      const id = storyId ?? editingStory?.id;
      if (!id) return;

      // The editor has edits of their own; a refresh would throw them away.
      if (fingerprint(blocks) !== serverSignature) return;

      try {
        const story = await getStory(id);
        const fresh = story.blocks ?? [];
        setBlocks(fresh);
        setServerSignature(fingerprint(fresh));
      } catch {
        // The story could not be read. The editor keeps what they have.
      }
    };

    const onFocus = () => void refresh();

    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [blocks, editingStory?.id, isOpen, serverSignature, storyId]);

  /*
   * The drawer renders nothing when it is closed.
   *
   * This sits below every hook on purpose. A hook that only runs once the
   * drawer is open changes how many hooks the component has, and React
   * insists that number never changes — so the drawer would crash the
   * moment it was opened.
   */
  if (!isOpen) return null;

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) {
      alert('Please fill in the required fields: Title and Summary.');
      return;
    }

    const newBlocks = getAssembledBlocks();

    /*
     * The composer and the platform share one schema, so a block that fails
     * here is a block the platform would reject on publish. Better to say so
     * now, while the editor is still looking at it.
     */
    const blockIssues = validateStoryBlocks(newBlocks);
    if (blockIssues.length > 0) {
      alert(
        `Some blocks are not valid yet:\n\n${blockIssues
          .map((issue) => `• ${issue.blockType}: ${issue.message}`)
          .join('\n')}`
      );
      return;
    }

    try {
      const initialStatus = submitMode === 'DRAFT' ? 'DRAFT' : 'PUBLISHED';

      /*
       * The story may already exist on the server — it was created as a
       * draft the first time a block was added. Publishing it then means
       * updating that draft, not creating a second story beside it.
       */
      const targetId = storyId ?? editingStory?.id;

      if (targetId) {
        await updateUserStory(targetId, {
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
          await submitStoryForReview(targetId);
        } else if (submitMode === 'SCHEDULE' && scheduledAtInput) {
          const targetIso = new Date(scheduledAtInput).toISOString();
          await scheduleStory(targetId, targetIso);
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
        } else if (submitMode === 'SCHEDULE' && scheduledAtInput) {
          const targetIso = new Date(scheduledAtInput).toISOString();
          await scheduleStory(created.id, targetIso);
        }

        onSuccess(`Story "${title}" saved successfully as ${initialStatus}.`);
      }

      onClose();
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? `The story could not be saved:\n\n${err.message}`
          : 'The story could not be saved.'
      );
    }
  };

  const openInStudio = (block?: StoryBlock) => {
    const target = storyId ?? editingStory?.id;
    window.open(
      studioUrl(target, block?.id, target ? undefined : composerSession.current),
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              {editingStory ? `Edit Story: "${title}"` : 'Draft a New Story Dispatch'}
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {editingStory
              ? 'Every block this story has is loaded below, in the order it reads.'
              : 'Compose the story out of blocks. They are saved to the API as you go.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the editor"
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center justify-between gap-3 px-6 pt-4">
        <div className="inline-flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('compose')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'compose'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>✍️ Compose &amp; Blocks</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>👁️ Live Article Preview</span>
          </button>
        </div>

        {viewMode === 'preview' ? (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-time Block Rendering
          </span>
        ) : (
          <SaveIndicator state={saveState} message={saveError} />
        )}
      </div>

      <form onSubmit={handleCreateStory} className="space-y-6 p-6">
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

            <StoryBlockList
              blocks={blocks}
              onChange={(next, change) => changeBlocks(next, change)}
              onOpenInStudio={(block) => openInStudio(block)}
            />

            {/* The studio, for the blocks that are easier to build there. */}
            <a
              href={studioUrl(storyId ?? undefined, undefined, composerSession.current)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs transition-colors hover:border-blue-400 hover:bg-blue-50/60 dark:border-slate-700 dark:hover:border-blue-500 dark:hover:bg-blue-500/10"
            >
              <span className="text-slate-600 dark:text-slate-300">
                Need a chart, a map or a media block? Build it in the Block Studio and send it
                straight into this story.
              </span>
              <span className="flex shrink-0 items-center gap-1 font-bold text-blue-700 dark:text-blue-300">
                <ExternalLink className="w-3.5 h-3.5" />
                Open the Studio
              </span>
            </a>
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

/**
 * Whether the platform has the change.
 *
 * The composer writes a draft to the API as it is edited, so the editor is
 * told whether that worked rather than being left to wonder.
 */
function SaveIndicator({ state, message }: { state: string; message: string | null }) {
  if (state === 'error') {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
        <AlertCircle className="h-3.5 w-3.5" />
        {message ?? 'The change could not be saved.'}
      </span>
    );
  }

  if (state === 'saving') {
    return <span className="text-[11px] font-semibold text-slate-500">Saving to the API…</span>;
  }

  if (state === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Saved to the API
      </span>
    );
  }

  return null;
}
