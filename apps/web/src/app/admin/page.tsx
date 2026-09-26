'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DEMO_STORIES } from '../../lib/demo-data';

export default function AdminDashboardPage() {
  const [stories, setStories] = useState(DEMO_STORIES);

  const togglePublish = (storyId: string) => {
    setStories((prev) =>
      prev.map((s) => {
        if (s.id === storyId) {
          const nextStatus = s.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
          return {
            ...s,
            status: nextStatus,
            publishedAt: nextStatus === 'PUBLISHED' ? new Date().toISOString() : s.publishedAt,
          };
        }
        return s;
      })
    );
  };

  const publishedCount = stories.filter((s) => s.status === 'PUBLISHED').length;
  const draftCount = stories.filter((s) => s.status === 'DRAFT').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* CMS Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
            <span>HUMAN EDITORIAL CONTROL</span>
            <span>•</span>
            <span>AI AGENT GOVERNANCE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            Newsroom Editorial CMS
          </h1>
          <p className="text-sm text-slate-400">
            Review, edit, publish, or override stories created by external AI agents via Remote MCP.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/audit"
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition"
          >
            VIEW MCP AUDIT LOGS
          </Link>
          <button
            onClick={() => alert('New draft story creation wizard')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition shadow-lg shadow-blue-500/20"
          >
            + NEW STORY DRAFT
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Total Stories</span>
          <div className="text-3xl font-extrabold text-white">{stories.length}</div>
          <span className="text-xs text-slate-500 font-mono">In Database Registry</span>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-400">Live Published</span>
          <div className="text-3xl font-extrabold text-emerald-400">{publishedCount}</div>
          <span className="text-xs text-slate-500 font-mono">Broadcasting to Readers</span>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-amber-400">Drafts / In-Review</span>
          <div className="text-3xl font-extrabold text-amber-400">{draftCount}</div>
          <span className="text-xs text-slate-500 font-mono">Awaiting Review</span>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-blue-400">Connected AI Clients</span>
          <div className="text-3xl font-extrabold text-blue-400">3 Agents</div>
          <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Gemini, ChatGPT, Claude
          </span>
        </div>
      </div>

      {/* Stories Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
            Stories Registry ({stories.length})
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Human Override Always Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-bold font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Headline</th>
                <th className="px-5 py-3">Format</th>
                <th className="px-5 py-3">Created By</th>
                <th className="px-5 py-3">Rev</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {stories.map((story) => (
                <tr key={story.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-5 py-4 font-semibold text-white max-w-md">
                    <Link
                      href={`/stories/${story.slug}`}
                      className="hover:text-blue-400 transition line-clamp-1"
                    >
                      {story.title}
                    </Link>
                    <span className="text-xs text-slate-500 font-mono block mt-0.5">ID: {story.id}</span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      {story.articleType.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {story.createdByClient}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-mono text-xs font-bold text-slate-300">
                    v{story.currentVersionNumber}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                        story.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {story.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right space-x-2 shrink-0">
                    <button
                      onClick={() => togglePublish(story.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        story.status === 'PUBLISHED'
                          ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500'
                      }`}
                    >
                      {story.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </button>
                    <Link
                      href={`/stories/${story.slug}`}
                      className="px-3 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
