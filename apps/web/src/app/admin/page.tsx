'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Trash2,
  Eye,
  PlusCircle,
  X,
  FileText,
  Image as ImageIcon,
  BarChart2,
  Clock,
  Quote,
  Video,
  Check,
  XCircle,
  Send,
  TrendingUp,
  Radio,
  Users,
  Bot,
  Zap,
  Bell,
  Calendar,
  Flame,
  Activity,
  UserPlus,
} from 'lucide-react';
import {
  useAllStories,
  saveUserStory,
  deleteUserStory,
  toggleStoryStatus,
  submitStoryForReview,
  reviewUserStory,
  useNewsroomMetrics,
  useTrendingStories,
  useNewsroomStaff,
  useScheduledStories,
  useEditorialNotifications,
} from '../../lib/news-store';
import type { StoryBlock } from '@ai-news/schemas';

interface MediaBlockDraft {
  id: string;
  type: 'image' | 'chart' | 'quote' | 'timeline' | 'video';
  data: any;
}

export default function EditorialCMSPage() {
  const { stories, isApiConnected } = useAllStories();
  const { metrics } = useNewsroomMetrics();
  const { trending } = useTrendingStories(10);
  const { staff, updateRole, inviteStaff } = useNewsroomStaff();
  const { scheduleStory, sweep: sweepScheduled } = useScheduledStories();
  const { notifications, broadcastBreaking } = useEditorialNotifications(20);

  // Active Admin View Tab
  const [activeTab, setActiveTab] = useState<'stories' | 'pulse' | 'breaking' | 'staff'>('stories');

  // UI state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'IN_REVIEW' | 'PUBLISHED' | 'SCHEDULED' | 'DRAFT'>('ALL');
  const [submitMode, setSubmitMode] = useState<'PUBLISH' | 'REVIEW' | 'DRAFT' | 'SCHEDULE'>('PUBLISH');
  const [scheduledAtInput, setScheduledAtInput] = useState('');

  // New Story Form State
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

  // Breaking News Dispatch Form State
  const [breakingStoryId, setBreakingStoryId] = useState('');
  const [breakingHeadline, setBreakingHeadline] = useState('');
  const [breakingUrgency, setBreakingUrgency] = useState<'urgent' | 'critical' | 'breaking'>('urgent');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Invite Staff Form State
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'journalist' | 'editor' | 'ai_agent' | 'admin'>('journalist');
  const [inviteClientType, setInviteClientType] = useState<'human' | 'ai_agent'>('human');

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

    const newBlocks: StoryBlock[] = [];

    if (leadParagraph.trim()) {
      newBlocks.push({
        id: `blk_lead_${Date.now()}`,
        blockType: 'paragraph',
        sortOrder: 0,
        data: { text: leadParagraph.trim() },
      } as any);
    }

    const keyTakeaways = [bullet1, bullet2, bullet3].filter((b) => b.trim().length > 0);
    if (keyTakeaways.length > 0) {
      newBlocks.push({
        id: `blk_takeaways_${Date.now()}`,
        blockType: 'bullet_list',
        sortOrder: 1,
        data: { items: keyTakeaways },
      } as any);
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
        } as any);
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
        } as any);
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
        } as any);
      } else if (m.type === 'timeline') {
        newBlocks.push({
          id: `time_${m.id}`,
          blockType: 'timeline',
          sortOrder,
          data: {
            title: m.data.title,
            items: m.data.items || [],
          },
        } as any);
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
        } as any);
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

      setIsEditorOpen(false);
      const actionLabel =
        submitMode === 'REVIEW'
          ? 'submitted for editorial review'
          : submitMode === 'DRAFT'
          ? 'saved as draft'
          : submitMode === 'SCHEDULE'
          ? `scheduled for publication at ${new Date(scheduledAtInput).toLocaleString()}`
          : 'published live';

      setSuccessMessage(
        `Story "${created.title}" ${actionLabel}!${isApiConnected ? '' : ' (Saved locally — API offline)'}`
      );

      // Reset Form
      setTitle('');
      setSummary('');
      setLeadParagraph('');
      setBullet1('');
      setBullet2('');
      setBullet3('');
      setMediaBlocks([]);
      setScheduledAtInput('');

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to create story:', err);
      alert('Failed to create story. Please check the console for details.');
    }
  };

  const handleBroadcastBreaking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakingHeadline.trim()) {
      alert('Please enter a breaking news headline.');
      return;
    }
    const storyIdToUse = breakingStoryId || (stories.length > 0 ? stories[0].id : 'story_manual');
    setIsBroadcasting(true);
    try {
      await broadcastBreaking(storyIdToUse, breakingHeadline.trim(), breakingUrgency);
      setSuccessMessage(`Breaking news alert broadcasted live across all reader streams!`);
      setBreakingHeadline('');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to broadcast breaking news:', err);
      alert('Failed to broadcast breaking news.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      alert('Please provide name and email.');
      return;
    }
    try {
      await inviteStaff({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        clientType: inviteClientType,
      });
      setIsInviteOpen(false);
      setSuccessMessage(`Staff member "${inviteName}" invited with role "${inviteRole}"!`);
      setInviteName('');
      setInviteEmail('');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to invite staff:', err);
      alert('Failed to invite staff member.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            <Radio className="w-4 h-4 animate-pulse text-rose-500" />
            <span>Autonomous Newsroom & Editorial CMS</span>
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {isApiConnected ? 'Gateway Connected (SSE Live)' : 'Local Engine'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            GlobalPulse Newsroom Control Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time human-AI collaborative journalism: authoring, embargo scheduling, virality analytics, and breaking broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition"
          >
            ← View Reader Feed
          </Link>
          <button
            onClick={() => setIsEditorOpen(!isEditorOpen)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isEditorOpen ? 'Close Editor' : '+ Write New Story'}</span>
          </button>
        </div>
      </div>

      {/* Main Admin Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('stories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'stories'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Stories & CMS</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
            {stories.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pulse')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'pulse'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-500" />
          <span>Newsroom Pulse & Analytics</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </button>

        <button
          onClick={() => setActiveTab('breaking')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'breaking'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Radio className="w-4 h-4 text-rose-500" />
          <span>Breaking News Broadcast</span>
          {notifications.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono font-bold">
              {notifications.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'staff'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-amber-500" />
          <span>Staff & AI Roster</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
            {staff.length}
          </span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <Link href="/" className="underline font-bold hover:text-emerald-900">
            View on Homepage →
          </Link>
        </div>
      )}

      {/* Journalist Writing Studio Modal / Expandable Form */}
      {isEditorOpen && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Draft a New Story Dispatch
              </h2>
            </div>
            <button
              onClick={() => setIsEditorOpen(false)}
              className="text-slate-400 hover:text-slate-600"
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
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> + Image
                  </button>
                  <button
                    type="button"
                    onClick={addChartBlock}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-emerald-500" /> + Chart
                  </button>
                  <button
                    type="button"
                    onClick={addQuoteBlock}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition"
                  >
                    <Quote className="w-3.5 h-3.5 text-purple-500" /> + Quote
                  </button>
                  <button
                    type="button"
                    onClick={addTimelineBlock}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-500" /> + Timeline
                  </button>
                  <button
                    type="button"
                    onClick={addVideoBlock}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition"
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
                          className="text-slate-400 hover:text-rose-500 transition"
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
                                placeholder="Chart title..."
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-500 mb-1">
                              Data Points (One pair per line, format: Label: Number)
                            </label>
                            <textarea
                              rows={3}
                              value={block.data.dataRows}
                              onChange={(e) => updateMediaBlockData(block.id, 'dataRows', e.target.value)}
                              placeholder="2024: 15&#10;2025: 35&#10;2026: 72&#10;2027: 120"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px]"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'quote' && (
                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block text-slate-500 mb-1">Quote Text</label>
                            <textarea
                              rows={2}
                              value={block.data.quote}
                              onChange={(e) => updateMediaBlockData(block.id, 'quote', e.target.value)}
                              placeholder="Direct quote..."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-serif-headline text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-500 mb-1">Speaker / Attribution</label>
                              <input
                                type="text"
                                value={block.data.attribution}
                                onChange={(e) => updateMediaBlockData(block.id, 'attribution', e.target.value)}
                                placeholder="e.g. Dr. Jane Doe"
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
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  onClick={() => setSubmitMode('REVIEW')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Review</span>
                </button>
                <button
                  type="submit"
                  onClick={() => setSubmitMode('SCHEDULE')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule Release</span>
                </button>
                <button
                  type="submit"
                  onClick={() => setSubmitMode('PUBLISH')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition"
                >
                  Publish Immediately
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: STORIES & CONTENT MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'stories' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <div className="text-xs text-slate-500">Total Stories</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stories.length}</div>
            </div>
            <div className={`p-4 rounded-xl border bg-white dark:bg-slate-900 shadow-xs ${
              stories.filter((s) => s.status === 'IN_REVIEW').length > 0
                ? 'border-amber-400 dark:border-amber-600 bg-amber-50/30'
                : 'border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-bold">
                <span>Review Queue</span>
                {stories.filter((s) => s.status === 'IN_REVIEW').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                )}
              </div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {stories.filter((s) => s.status === 'IN_REVIEW').length}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <div className="text-xs text-emerald-600">Published Live</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {stories.filter((s) => s.status === 'PUBLISHED').length}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 font-bold">
                <span>Scheduled</span>
                {stories.filter((s) => s.status === 'SCHEDULED').length > 0 && (
                  <button
                    onClick={() => sweepScheduled()}
                    className="text-[10px] underline hover:text-purple-700"
                    title="Publish due stories now"
                  >
                    Sweep
                  </button>
                )}
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {stories.filter((s) => s.status === 'SCHEDULED').length}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <div className="text-xs text-slate-400">Drafts</div>
              <div className="text-2xl font-bold text-slate-500 dark:text-slate-400 mt-1">
                {stories.filter((s) => s.status === 'DRAFT').length}
              </div>
            </div>
          </div>

          {/* Stories Management Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* Table Filter Tabs */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 sm:gap-2">
                {[
                  { id: 'ALL', label: `All (${stories.length})` },
                  {
                    id: 'IN_REVIEW',
                    label: `Review Queue (${stories.filter((s) => s.status === 'IN_REVIEW').length})`,
                    hasBadge: stories.filter((s) => s.status === 'IN_REVIEW').length > 0,
                  },
                  { id: 'PUBLISHED', label: `Published (${stories.filter((s) => s.status === 'PUBLISHED').length})` },
                  { id: 'SCHEDULED', label: `Scheduled (${stories.filter((s) => s.status === 'SCHEDULED').length})` },
                  { id: 'DRAFT', label: `Drafts (${stories.filter((s) => s.status === 'DRAFT').length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      filterStatus === tab.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.hasBadge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    )}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-500">
                {stories.filter((s) => filterStatus === 'ALL' || s.status === filterStatus).length} stories displayed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">Story Title</th>
                    <th className="p-3 font-semibold">Category</th>
                    <th className="p-3 font-semibold">Author / Agent</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stories
                    .filter((s) => filterStatus === 'ALL' || s.status === filterStatus)
                    .map((story) => {
                      const isPublished = story.status === 'PUBLISHED';
                      const isInReview = story.status === 'IN_REVIEW';
                      const isScheduled = story.status === 'SCHEDULED';
                      const isDraft = story.status === 'DRAFT';

                      return (
                        <tr key={story.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3 font-semibold text-slate-900 dark:text-white max-w-sm truncate">
                            <Link href={`/stories/${story.slug}`} className="hover:text-blue-600">
                              {story.title}
                            </Link>
                            {isScheduled && story.scheduledPublishAt && (
                              <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Release: {new Date(story.scheduledPublishAt).toLocaleString()}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300 uppercase font-mono text-[11px]">
                            {story.articleType.replace('_', ' ')}
                          </td>
                          <td className="p-3 text-slate-500">
                            <div className="flex items-center gap-1">
                              {story.authorId.includes('gemini') || story.authorId.includes('chatgpt') || story.authorId.includes('agent') ? (
                                <Bot className="w-3 h-3 text-indigo-500" />
                              ) : null}
                              <span>{story.authorId.replace('usr_', '').replace('_', ' ')}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            {isInReview ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                IN REVIEW
                              </span>
                            ) : isScheduled ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-800">
                                <Clock className="w-3 h-3 text-purple-500" />
                                SCHEDULED
                              </span>
                            ) : (
                              <button
                                onClick={() => toggleStoryStatus(story.id)}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                                  isPublished
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                                }`}
                              >
                                {story.status}
                              </button>
                            )}
                          </td>
                          <td className="p-3 text-right space-x-2">
                            {isInReview && (
                              <>
                                <button
                                  onClick={async () => {
                                    await reviewUserStory(story.id, 'approve');
                                    setSuccessMessage(`Approved and published "${story.title}"`);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-[11px] font-bold transition"
                                  title="Approve & Publish Story"
                                >
                                  <Check className="w-3 h-3 text-emerald-600" /> Approve
                                </button>
                                <button
                                  onClick={async () => {
                                    const feedback = prompt('Provide feedback for revision (optional):') || undefined;
                                    await reviewUserStory(story.id, 'reject', feedback);
                                    setSuccessMessage(`Returned "${story.title}" to draft with feedback`);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 text-[11px] font-bold transition"
                                  title="Reject back to Draft"
                                >
                                  <XCircle className="w-3 h-3 text-rose-600" /> Reject
                                </button>
                              </>
                            )}

                            {isDraft && (
                              <button
                                onClick={async () => {
                                  await submitStoryForReview(story.id);
                                  setSuccessMessage(`Submitted "${story.title}" for editorial review`);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-[11px] font-bold transition"
                                title="Submit for Review"
                              >
                                <Send className="w-3 h-3 text-blue-600" /> Submit
                              </button>
                            )}

                            {isScheduled && (
                              <button
                                onClick={async () => {
                                  await sweepScheduled();
                                  setSuccessMessage(`Triggered publishing sweep for "${story.title}"`);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 text-[11px] font-bold transition"
                                title="Release immediately"
                              >
                                <Zap className="w-3 h-3 text-purple-600" /> Release
                              </button>
                            )}

                            <Link
                              href={`/stories/${story.slug}`}
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </Link>
                            <button
                              onClick={() => deleteUserStory(story.id)}
                              className="text-slate-400 hover:text-rose-500 transition p-1"
                              title="Delete story"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NEWSROOM PULSE & LIVE ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'pulse' && (
        <div className="space-y-6">
          {/* Real-time KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-xs text-slate-500 font-medium">Estimated Readers</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {(metrics?.totalReads || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Real-time stream
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-xs text-slate-500 font-medium">Reader Reactions</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {(metrics?.totalReactions || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Like, Insightful, Heart</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-xs text-slate-500 font-medium">Comments & Debates</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {(metrics?.totalComments || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Community discussion</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-xs text-slate-500 font-medium">Avg Read Time</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {metrics?.avgReadingTimeMinutes || 3.5}m
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Across published corpus</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-xs text-slate-500 font-medium">Active Staff</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {metrics?.activeJournalists || 1}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Human editors</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-xs text-slate-500 font-medium">Autonomous AI</div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {metrics?.activeAiAgents || 2}
              </div>
              <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                <Bot className="w-3 h-3" /> MCP Connected
              </div>
            </div>
          </div>

          {/* Trending Leaderboard */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Trending Stories Leaderboard (Virality & Velocity Algorithm)
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Calculated across reads, comment depth, and reaction velocity
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {trending.map((t, idx) => {
                const virality = t.viralityScore || 50;
                const isHighViral = virality >= 70;
                return (
                  <div
                    key={t.storyId || idx}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        idx === 0
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 border border-amber-300 dark:border-amber-700'
                          : idx === 1
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          : idx === 2
                          ? 'bg-amber-900/10 text-amber-700 dark:text-amber-500'
                          : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <Link
                          href={`/stories/${t.slug || t.storyId}`}
                          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 line-clamp-1"
                        >
                          {t.title}
                        </Link>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span className="uppercase font-mono text-[10px] text-blue-600 dark:text-blue-400">
                            {t.articleType || 'news'}
                          </span>
                          <span>•</span>
                          <span>{(t.viewCount || 0).toLocaleString()} views</span>
                          <span>•</span>
                          <span>{t.totalReactions || 0} reactions</span>
                          <span>•</span>
                          <span>{t.commentCount || 0} comments</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1 text-xs font-bold">
                          {isHighViral && <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />}
                          <span className={isHighViral ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}>
                            {virality} / 100
                          </span>
                        </div>
                        <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isHighViral ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${virality}%` }}
                          ></div>
                        </div>
                      </div>

                      <Link
                        href={`/stories/${t.slug || t.storyId}`}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                        title="Open Story"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BREAKING NEWS BROADCASTER */}
      {/* ========================================================================= */}
      {activeTab === 'breaking' && (
        <div className="space-y-6">
          {/* Broadcaster Dispatch Card */}
          <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 shadow-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-900/40">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Emergency Breaking News Broadcast Terminal
                </h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-mono font-bold uppercase">
                Global Push Alert
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Dispatches an immediate high-priority breaking news flash across all active reader sessions via the SSE Realtime Gateway.
              The alert banner appears instantaneously on every connected device without a page reload.
            </p>

            <form onSubmit={handleBroadcastBreaking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Associate with Published Story (Optional)
                </label>
                <select
                  value={breakingStoryId}
                  onChange={(e) => {
                    setBreakingStoryId(e.target.value);
                    const selected = stories.find((s) => s.id === e.target.value);
                    if (selected && !breakingHeadline) {
                      setBreakingHeadline(`BREAKING: ${selected.title}`);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- Standalone Alert (No Story Link) --</option>
                  {stories.filter((s) => s.status === 'PUBLISHED').map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Breaking Headline Flash *
                </label>
                <input
                  type="text"
                  required
                  value={breakingHeadline}
                  onChange={(e) => setBreakingHeadline(e.target.value)}
                  placeholder="e.g. BREAKING: Central Banks Announce Coordinated Real-Time Liquidity Facility"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Urgency Level
                  </label>
                  <div className="flex items-center gap-2">
                    {(['urgent', 'critical', 'breaking'] as const).map((urg) => (
                      <button
                        key={urg}
                        type="button"
                        onClick={() => setBreakingUrgency(urg)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition ${
                          breakingUrgency === urg
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {urg}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ml-auto pt-4">
                  <button
                    type="submit"
                    disabled={isBroadcasting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition disabled:opacity-50"
                  >
                    <Radio className="w-4 h-4" />
                    <span>{isBroadcasting ? 'Broadcasting...' : 'Broadcast Flash Alert Live'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Broadcast History */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Broadcast Dispatch History
                </h3>
              </div>
              <span className="text-xs text-slate-400">Delivered over SSE</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No previous breaking broadcasts logged yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                          {n.urgency || 'urgent'}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {n.headline || n.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>Dispatched by {n.senderId || 'editor'}</span>
                        <span>•</span>
                        <span>{new Date(n.sentAt || n.createdAt || Date.now()).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Delivered
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: STAFF & AI ROSTER */}
      {/* ========================================================================= */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Newsroom Contributors & Autonomous Agents
              </h2>
              <p className="text-xs text-slate-500">
                Manage human editors, credentialed investigative journalists, and external AI agents connecting via Model Context Protocol.
              </p>
            </div>
            <button
              onClick={() => setIsInviteOpen(!isInviteOpen)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isInviteOpen ? 'Close' : '+ Register Contributor'}</span>
            </button>
          </div>

          {/* Invite / Register Contributor Drawer */}
          {isInviteOpen && (
            <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase text-blue-700 dark:text-blue-300">
                Register New Newsroom Contributor / Autonomous Agent
              </h3>
              <form onSubmit={handleInviteStaff} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">Full Name / Agent Alias</label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Elena Rostova or Gemini Flash Agent"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="elena@globalpulse.news"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="journalist">Journalist (Authoring)</option>
                    <option value="editor">Editor (Review & Publish)</option>
                    <option value="ai_agent">AI Agent (Autonomous MCP)</option>
                    <option value="admin">Newsroom Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Type</label>
                  <select
                    value={inviteClientType}
                    onChange={(e) => setInviteClientType(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="human">Human Contributor</option>
                    <option value="ai_agent">Autonomous AI Agent</option>
                  </select>
                </div>
                <div className="sm:col-span-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                  >
                    Grant Newsroom Credentials
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Staff Roster Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">User / Agent Name</th>
                    <th className="p-3 font-semibold">Email / Endpoint</th>
                    <th className="p-3 font-semibold">Client Type</th>
                    <th className="p-3 font-semibold">Assigned Role</th>
                    <th className="p-3 font-semibold text-right">Permissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {staff.map((u) => {
                    const isAi = u.clientType === 'ai_agent' || u.id.includes('agent');
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            {isAi ? (
                              <Bot className="w-4 h-4 text-indigo-500" />
                            ) : (
                              <Users className="w-4 h-4 text-slate-400" />
                            )}
                            <span>{u.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">{u.email}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isAi
                              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {isAi ? 'Autonomous AI' : 'Human Web'}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={u.role}
                            onChange={async (e) => {
                              await updateRole(u.id, e.target.value);
                              setSuccessMessage(`Updated role for "${u.name}" to ${e.target.value}`);
                              setTimeout(() => setSuccessMessage(null), 4000);
                            }}
                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                          >
                            <option value="journalist">journalist</option>
                            <option value="editor">editor</option>
                            <option value="ai_agent">ai_agent</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="p-3 text-right text-slate-400 text-[11px] font-mono">
                          {u.role === 'admin'
                            ? 'news:*'
                            : u.role === 'editor'
                            ? 'news:read, news:write, news:publish'
                            : 'news:read, news:write'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
