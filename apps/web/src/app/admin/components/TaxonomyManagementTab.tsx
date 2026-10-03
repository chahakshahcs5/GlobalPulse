'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layers, Tag, Plus, Trash2, ExternalLink, FolderPlus, BookOpen, Hash } from 'lucide-react';
import { useTaxonomy } from '../../../lib/news-store';
import { DynamicIcon } from '../../../components/DynamicIcon';

interface TaxonomyManagementTabProps {
  onSuccess: (message: string) => void;
}

export function TaxonomyManagementTab({ onSuccess }: TaxonomyManagementTabProps) {
  const {
    categories,
    topics,
    addCategory,
    deleteCategory,
    addDesk,
    removeDesk,
    addTopic,
    deleteTopic,
  } = useTaxonomy();

  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'topics'>('categories');
  const [addingDeskForSlug, setAddingDeskForSlug] = useState<string | null>(null);
  const [deskInputValue, setDeskInputValue] = useState('');

  // Category form state
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catIcon, setCatIcon] = useState('📁');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // Topic form state
  const [topicName, setTopicName] = useState('');
  const [topicSlug, setTopicSlug] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [topicParentCat, setTopicParentCat] = useState('Technology');
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const created = addCategory({
      name: catName,
      slug: catSlug || undefined,
      description: catDescription,
      icon: catIcon,
    });

    setCatName('');
    setCatSlug('');
    setCatDescription('');
    setIsCreatingCat(false);
    onSuccess(`Category "${created.name}" created successfully and published to navigation!`);
  };

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return;

    const created = addTopic({
      name: topicName,
      slug: topicSlug || undefined,
      description: topicDescription,
      parentCategory: topicParentCat,
    });

    setTopicName('');
    setTopicSlug('');
    setTopicDescription('');
    setIsCreatingTopic(false);
    onSuccess(`Topic "${created.name}" created and synced with AI newsroom taxonomy!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Taxonomy Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              News Categories
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {categories.length}
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
              Top-level navigation hubs
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Indexed Topics
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {topics.length}
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
              Semantic clustering tags
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Reader Hub
            </div>
            <Link
              href="/topics"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline mt-2"
            >
              <span>Explore Directory</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <div className="text-[11px] text-slate-400 mt-0.5">Public consumer browse view</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Categories vs Topics */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'categories'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('topics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'topics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Topics ({topics.length})</span>
          </button>
        </div>

        {activeSubTab === 'categories' ? (
          <button
            onClick={() => setIsCreatingCat(!isCreatingCat)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        ) : (
          <button
            onClick={() => setIsCreatingTopic(!isCreatingTopic)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Topic</span>
          </button>
        )}
      </div>

      {/* CREATE CATEGORY MODAL / EXPANDABLE FORM */}
      {isCreatingCat && activeSubTab === 'categories' && (
        <form
          onSubmit={handleCreateCategory}
          className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-blue-600" />
              <span>Create New News Category</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsCreatingCat(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value);
                  if (!catSlug)
                    setCatSlug(
                      e.target.value
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]+/g, '-')
                    );
                }}
                placeholder="e.g. Geopolitics"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                URL Slug
              </label>
              <input
                type="text"
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
                placeholder="e.g. geopolitics"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Icon (Lucide name or Emoji)
              </label>
              <input
                type="text"
                value={catIcon}
                onChange={(e) => setCatIcon(e.target.value)}
                placeholder="e.g. globe, cpu, shield, or 🌐"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={catDescription}
              onChange={(e) => setCatDescription(e.target.value)}
              placeholder="Brief description of stories and beats covered by this category..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingCat(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Publish Category
            </button>
          </div>
        </form>
      )}

      {/* CREATE TOPIC MODAL / EXPANDABLE FORM */}
      {isCreatingTopic && activeSubTab === 'topics' && (
        <form
          onSubmit={handleCreateTopic}
          className="p-5 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-600" />
              <span>Create New News Topic</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsCreatingTopic(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Topic Name *
              </label>
              <input
                type="text"
                required
                value={topicName}
                onChange={(e) => {
                  setTopicName(e.target.value);
                  if (!topicSlug)
                    setTopicSlug(
                      e.target.value
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]+/g, '-')
                    );
                }}
                placeholder="e.g. Neuromorphic Chips"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                URL Slug
              </label>
              <input
                type="text"
                value={topicSlug}
                onChange={(e) => setTopicSlug(e.target.value)}
                placeholder="e.g. neuromorphic-chips"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Parent Category
              </label>
              <select
                value={topicParentCat}
                onChange={(e) => setTopicParentCat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={topicDescription}
              onChange={(e) => setTopicDescription(e.target.value)}
              placeholder="Scope of events and dispatches aggregated under this topic tag..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingTopic(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Create Topic
            </button>
          </div>
        </form>
      )}

      {/* CATEGORIES TABLE / LIST */}
      {activeSubTab === 'categories' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Category Taxonomy ({categories.length})
            </span>
            <span className="text-xs text-slate-400">
              Public routes accessible via /category/[slug]
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <DynamicIcon
                        name={cat.icon}
                        fallback="Folder"
                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
                      />
                    </span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {cat.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      /{cat.slug}
                    </span>
                    {cat.isCustom && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{cat.description}</p>

                  {/* Desks / Subcategories */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">
                      Desks ({cat.subCategories?.length || 0}):
                    </span>
                    {(cat.subCategories || []).map((desk) => (
                      <span
                        key={desk}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-medium"
                      >
                        <span>{desk}</span>
                        <button
                          type="button"
                          onClick={() => {
                            removeDesk(cat.slug, desk);
                            onSuccess(`Desk "${desk}" removed from ${cat.name}.`);
                          }}
                          className="hover:text-rose-500 p-0.5 text-xs font-bold leading-none"
                          title={`Remove ${desk} desk`}
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    {addingDeskForSlug === cat.slug ? (
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          autoFocus
                          value={deskInputValue}
                          onChange={(e) => setDeskInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (deskInputValue.trim()) {
                                addDesk(cat.slug, deskInputValue.trim());
                                onSuccess(`Desk "${deskInputValue}" added to ${cat.name}!`);
                                setDeskInputValue('');
                                setAddingDeskForSlug(null);
                              }
                            } else if (e.key === 'Escape') {
                              setAddingDeskForSlug(null);
                              setDeskInputValue('');
                            }
                          }}
                          placeholder="New desk..."
                          className="px-2 py-0.5 rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-28"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (deskInputValue.trim()) {
                              addDesk(cat.slug, deskInputValue.trim());
                              onSuccess(`Desk "${deskInputValue}" added to ${cat.name}!`);
                              setDeskInputValue('');
                              setAddingDeskForSlug(null);
                            }
                          }}
                          className="px-2 py-0.5 text-[11px] bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingDeskForSlug(null);
                            setDeskInputValue('');
                          }}
                          className="text-[11px] text-slate-400 hover:text-slate-600 px-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingDeskForSlug(cat.slug);
                          setDeskInputValue('');
                        }}
                        className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline px-1.5 py-0.5 rounded border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400"
                      >
                        + Add Desk
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/category/${cat.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <span>View Hub</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  {cat.isCustom && (
                    <button
                      onClick={() => {
                        deleteCategory(cat.id);
                        onSuccess(`Category "${cat.name}" removed.`);
                      }}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Delete custom category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOPICS TABLE / LIST */}
      {activeSubTab === 'topics' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Topic Index ({topics.length})
            </span>
            <span className="text-xs text-slate-400">
              Semantic topics available to MCP AI agents & readers
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topics.map((t) => (
              <div
                key={t.id}
                className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {t.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      #{t.slug}
                    </span>
                    {t.parentCategory && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                        {t.parentCategory}
                      </span>
                    )}
                    {t.isCustom && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/topics/${t.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <span>View Dispatches</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  {t.isCustom && (
                    <button
                      onClick={() => {
                        deleteTopic(t.id);
                        onSuccess(`Topic "${t.name}" removed.`);
                      }}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Delete custom topic"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
