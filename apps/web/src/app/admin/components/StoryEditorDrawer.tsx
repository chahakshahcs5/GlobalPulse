'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  saveUserStory,
  submitStoryForReview,
  useScheduledStories,
} from '../../../lib/news-store';

interface MediaBlockDraft {
  id: string;
  type: 'image' | 'chart' | 'quote' | 'timeline' | 'video';
  data: any;
}

interface StoryEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function StoryEditorDrawer({
  isOpen,
  onClose,
  onSuccess,
}: StoryEditorDrawerProps) {
  const { scheduleStory } = useScheduledStories();

  const [submitMode, setSubmitMode] = useState<'PUBLISH' | 'REVIEW' | 'DRAFT' | 'SCHEDULE'>('PUBLISH');
  const [scheduledAtInput, setScheduledAtInput] = useState('');

  // Story Form State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState<'technology' | 'business' | 'world' | 'science' | 'sports' | 'health'>('technology');
  const [authorName, setAuthorName] = useState('Senior Staff Journalist');
  const [heroImageUrl, setHeroImageUrl] = useState(
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80'
  );
  const [leadParagraph, setLeadParagraph] = useState('');
  const [bullet1, setBullet1] = useState('');
  const [bullet2, setBullet2] = useState('');
  const [bullet3, setBullet3] = useState('');
  const [mediaBlocks, setMediaBlocks] = useState<MediaBlockDraft[]>([]);

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
          items: [
            { date: 'Phase 1 • 09:00 AM', headline: 'Working Group Formal Convening', body: 'Delegations confirm multilateral agenda.' },
            { date: 'Phase 2 • 02:30 PM', headline: 'Technical Framework Approved', body: 'All parties ratify operational protocol.' },
          ],
        },
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

  const removeMediaBlock = (id: string) => {
    setMediaBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const updateMediaBlockData = (id: string, field: string, value: any) => {
    setMediaBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, data: { ...b.data, [field]: value } } : b))
    );
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

    const newBlocks: any[] = [];

    if (leadParagraph.trim()) {
      newBlocks.push({
        id: `blk_lead_${Date.now()}`,
        blockType: 'paragraph',
        sortOrder: 0,
        data: { text: leadParagraph.trim() },
      });
    }

    const keyTakeaways = [bullet1, bullet2, bullet3].filter((b) => b.trim().length > 0);
    if (keyTakeaways.length > 0) {
      newBlocks.push({
        id: `blk_takeaways_${Date.now()}`,
        blockType: 'bullet_list',
        sortOrder: 1,
        data: { items: keyTakeaways },
      });
    }

    mediaBlocks.forEach((m) => {
      const sortOrder = newBlocks.length;
      if (m.type === 'image') {
        newBlocks.push({
          id: `img_${m.id}`,
          blockType: 'image',
          sortOrder,
          data: {
            url: m.data.url,
            caption: m.data.caption,
            credit: m.data.credit,
            altText: m.data.altText,
          },
        });
      } else if (m.type === 'chart') {
        newBlocks.push({
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
        });
      } else if (m.type === 'quote') {
        newBlocks.push({
          id: `quote_${m.id}`,
          blockType: 'pull_quote',
          sortOrder,
          data: {
            quote: m.data.quote,
            attribution: m.data.attribution,
            title: m.data.title,
          },
        });
      } else if (m.type === 'timeline') {
        newBlocks.push({
          id: `time_${m.id}`,
          blockType: 'timeline',
          sortOrder,
          data: {
            title: m.data.title,
            items: m.data.items || [],
          },
        });
      } else if (m.type === 'video') {
        newBlocks.push({
          id: `vid_${m.id}`,
          blockType: 'video',
          sortOrder,
          data: {
            url: m.data.url,
            caption: m.data.caption,
            durationSeconds: Number(m.data.durationSeconds) || 120,
          },
        });
      }
    });

    try {
      const initialStatus = submitMode === 'DRAFT' ? 'DRAFT' : 'PUBLISHED';
      const created = await saveUserStory({
        title: title.trim(),
        summary: summary.trim(),
        status: initialStatus,
        articleType: category as any,
        topicIds: [`top_${category}`],
        entityIds: [],
        sourceIds: [],
        heroImageUrl: heroImageUrl.trim() || undefined,
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
      console.error('Failed to create story:', err);
      alert('Failed to create story. Please check the console for details.');
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Draft a New Story Dispatch
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleCreateStory} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
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
                Add supporting data charts, pull quotes, photo credits, timeline milestones, or video dispatches.
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
                          onChange={(e) => updateMediaBlockData(block.id, 'url', e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">Photo Credit</label>
                        <input
                          type="text"
                          value={block.data.credit}
                          onChange={(e) => updateMediaBlockData(block.id, 'credit', e.target.value)}
                          placeholder="e.g. Reuters / Bureau Staff"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-slate-500 mb-1">Caption</label>
                        <input
                          type="text"
                          value={block.data.caption}
                          onChange={(e) => updateMediaBlockData(block.id, 'caption', e.target.value)}
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
                            onChange={(e) => updateMediaBlockData(block.id, 'chartType', e.target.value)}
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
                            onChange={(e) => updateMediaBlockData(block.id, 'title', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">Data Rows (Label: Value)</label>
                        <textarea
                          rows={3}
                          value={block.data.dataRows}
                          onChange={(e) => updateMediaBlockData(block.id, 'dataRows', e.target.value)}
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
                          onChange={(e) => updateMediaBlockData(block.id, 'quote', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-500 mb-1">Attributed Person</label>
                          <input
                            type="text"
                            value={block.data.attribution}
                            onChange={(e) => updateMediaBlockData(block.id, 'attribution', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Speaker Role / Title</label>
                          <input
                            type="text"
                            value={block.data.title}
                            onChange={(e) => updateMediaBlockData(block.id, 'title', e.target.value)}
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
                          onChange={(e) => updateMediaBlockData(block.id, 'title', e.target.value)}
                          placeholder="e.g. Summit Timeline"
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
                          onChange={(e) => updateMediaBlockData(block.id, 'url', e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">Duration (Seconds)</label>
                        <input
                          type="number"
                          value={block.data.durationSeconds}
                          onChange={(e) => updateMediaBlockData(block.id, 'durationSeconds', e.target.value)}
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
              The automated background scheduler will automatically flip this story to PUBLISHED and broadcast it over SSE the moment this timestamp arrives.
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
              Save as Draft
            </button>
            <button
              type="submit"
              onClick={() => setSubmitMode('REVIEW')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Review</span>
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
              Publish Immediately
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
