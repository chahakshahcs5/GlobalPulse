'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import type { Story } from '@ai-news/schemas';
import {
  useAllStories,
  useNewsroomMetrics,
  useTrendingStories,
  useNewsroomStaff,
  useScheduledStories,
  useEditorialNotifications,
} from '../../lib/news-store';
import {
  AdminHeader,
  AdminNavTabs,
  AdminMetricsBar,
  StoryFilterBar,
  StoryEditorDrawer,
  StoryTable,
  NewsroomPulseTab,
  BreakingNewsTab,
  StaffManagementTab,
  McpDiscoveryTab,
  TaxonomyManagementTab,
  type AdminTab,
  type FilterStatus,
} from './components';

export default function EditorialCMSPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('stories');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('updated_desc');

  /*
   * The search waits for a pause in the typing.
   *
   * Every keystroke would otherwise be a request to the API, and a search
   * that asks for a list of stories on each letter is a search that feels
   * broken.
   */
  useEffect(() => {
    const handle = setTimeout(() => setQuery(searchInput.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  /*
   * The list is narrowed, searched and ordered by the API rather than in
   * the browser, so a status the API knows about and the browser has not
   * loaded yet is still counted, and the counts are the newsroom's rather
   * than the page's.
   *
   * The search is the API's too: a newsroom of two hundred stories cannot
   * be searched in the browser without fetching all two hundred.
   */
  const { stories, isApiConnected, total, hasMore, isLoadingMore, loadMore } = useAllStories({
    status: filterStatus === 'ALL' ? undefined : filterStatus,
    query: query.trim() || undefined,
    sort,
  });
  const { metrics } = useNewsroomMetrics();
  const { trending } = useTrendingStories(10);
  const { staff } = useNewsroomStaff();
  const { sweep: sweepScheduled } = useScheduledStories();
  const { notifications } = useEditorialNotifications(20);

  const triggerSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleEditStory = (story: Story) => {
    setEditingStory(story);
    setIsEditorOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingStory(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <AdminHeader
        isApiConnected={isApiConnected}
        isEditorOpen={isEditorOpen}
        onToggleEditor={() => {
          if (isEditorOpen) {
            handleCloseEditor();
          } else {
            setEditingStory(null);
            setIsEditorOpen(true);
          }
        }}
      />

      <AdminNavTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        storiesCount={total}
        notificationsCount={notifications.length}
        staffCount={staff.length}
      />

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

      <StoryEditorDrawer
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        onSuccess={triggerSuccess}
        editingStory={editingStory}
      />

      {activeTab === 'stories' && (
        <div className="space-y-6">
          <AdminMetricsBar
            metrics={metrics}
            onSweepScheduled={async () => {
              await sweepScheduled();
              triggerSuccess('Triggered scheduled publishing sweep across all pending embargoes!');
            }}
          />

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <StoryFilterBar
              filterStatus={filterStatus}
              onSelectFilter={setFilterStatus}
              metrics={metrics}
              displayedCount={stories.length}
              displayedTotal={total}
              query={searchInput}
              onQueryChange={setSearchInput}
              sort={sort}
              onSortChange={setSort}
            />
            <StoryTable
              stories={stories}
              filterStatus={filterStatus}
              onSuccess={triggerSuccess}
              onEditStory={handleEditStory}
              total={total}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={loadMore}
            />
          </div>
        </div>
      )}

      {activeTab === 'pulse' && <NewsroomPulseTab metrics={metrics} trending={trending} />}

      {activeTab === 'breaking' && (
        <BreakingNewsTab
          stories={stories}
          notifications={notifications}
          onSuccess={triggerSuccess}
        />
      )}

      {activeTab === 'staff' && <StaffManagementTab onSuccess={triggerSuccess} />}

      {activeTab === 'mcp' && <McpDiscoveryTab />}

      {activeTab === 'taxonomy' && <TaxonomyManagementTab onSuccess={triggerSuccess} />}
    </div>
  );
}
