'use client';

import { useState } from 'react';

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
  const { stories, isApiConnected } = useAllStories();
  const { metrics } = useNewsroomMetrics();
  const { trending } = useTrendingStories(10);
  const { staff } = useNewsroomStaff();
  const { sweep: sweepScheduled } = useScheduledStories();
  const { notifications } = useEditorialNotifications(20);

  const [activeTab, setActiveTab] = useState<AdminTab>('stories');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');

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
        storiesCount={stories.length}
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
            stories={stories}
            onSweepScheduled={async () => {
              await sweepScheduled();
              triggerSuccess('Triggered scheduled publishing sweep across all pending embargoes!');
            }}
          />

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <StoryFilterBar
              filterStatus={filterStatus}
              onSelectFilter={setFilterStatus}
              stories={stories}
            />
            <StoryTable
              stories={stories}
              filterStatus={filterStatus}
              onSuccess={triggerSuccess}
              onEditStory={handleEditStory}
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
