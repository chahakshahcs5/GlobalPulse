'use client';

import { FileText, Activity, Radio, Users, Bot } from 'lucide-react';

export type AdminTab = 'stories' | 'pulse' | 'breaking' | 'staff' | 'mcp';

interface AdminNavTabsProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  storiesCount: number;
  notificationsCount: number;
  staffCount: number;
}

export function AdminNavTabs({
  activeTab,
  onSelectTab,
  storiesCount,
  notificationsCount,
  staffCount,
}: AdminNavTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
      <button
        onClick={() => onSelectTab('stories')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
          activeTab === 'stories'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <FileText className="w-4 h-4" />
        <span>Stories & CMS</span>
        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
          {storiesCount}
        </span>
      </button>

      <button
        onClick={() => onSelectTab('pulse')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
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
        onClick={() => onSelectTab('breaking')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
          activeTab === 'breaking'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Radio className="w-4 h-4 text-rose-500" />
        <span>Breaking News Broadcast</span>
        {notificationsCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono font-bold">
            {notificationsCount}
          </span>
        )}
      </button>

      <button
        onClick={() => onSelectTab('staff')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
          activeTab === 'staff'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Users className="w-4 h-4 text-amber-500" />
        <span>Staff & AI Roster</span>
        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
          {staffCount}
        </span>
      </button>

      <button
        onClick={() => onSelectTab('mcp')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
          activeTab === 'mcp'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Bot className="w-4 h-4 text-purple-400" />
        <span>MCP & Autonomous AI</span>
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
      </button>
    </div>
  );
}
