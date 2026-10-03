'use client';

import React, { useState } from 'react';
import { Scale, ThumbsUp, Quote, ExternalLink, Send } from 'lucide-react';
import type { StoryPerspective, StoryPerspectiveStance } from '@ai-news/schemas';
import { formatDeterministicDateTime } from '../../lib/date-utils';

interface StoryPerspectivesProps {
  storyId: string;
  perspectives: StoryPerspective[];
  onSubmitPerspective: (p: {
    stance: StoryPerspectiveStance;
    quote?: string;
    argument: string;
    evidenceUrl?: string;
    authorName?: string;
  }) => void;
  onUpvotePerspective: (id: string) => void;
}

export function StoryPerspectives({
  perspectives,
  onSubmitPerspective,
  onUpvotePerspective,
}: StoryPerspectivesProps) {
  const [stanceFilter, setStanceFilter] = useState<string>('all');
  const [perspectiveStance, setPerspectiveStance] = useState<StoryPerspectiveStance>('analytical');
  const [perspectiveQuote, setPerspectiveQuote] = useState('');
  const [perspectiveArgument, setPerspectiveArgument] = useState('');
  const [perspectiveEvidence, setPerspectiveEvidence] = useState('');
  const [perspectiveAuthor, setPerspectiveAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perspectiveArgument.trim() || isSubmitting) return;

    setIsSubmitting(true);
    onSubmitPerspective({
      stance: perspectiveStance,
      quote: perspectiveQuote.trim() || undefined,
      argument: perspectiveArgument.trim(),
      evidenceUrl: perspectiveEvidence.trim() || undefined,
      authorName: perspectiveAuthor.trim() || undefined,
    });

    setPerspectiveArgument('');
    setPerspectiveQuote('');
    setPerspectiveEvidence('');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Stance Filter Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium mr-1">Filter Stance:</span>
        {[
          { id: 'all', label: 'All Perspectives' },
          { id: 'in_favor', label: '✓ In Favor' },
          { id: 'dissenting', label: '✗ Dissenting' },
          { id: 'analytical', label: '⚡ Analytical' },
          { id: 'question', label: '? Questions' },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setStanceFilter(filter.id)}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition cursor-pointer ${
              stanceFilter === filter.id
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Perspective Contribution Card */}
      <form
        onSubmit={handleSubmit}
        className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Scale className="w-4 h-4 text-indigo-500" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Contribute Reader Perspective
          </h4>
        </div>

        {/* Stance Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Select Your Stance:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                { id: 'in_favor', label: 'In Favor', icon: '✓', color: 'border-emerald-500' },
                {
                  id: 'dissenting',
                  label: 'Dissenting',
                  icon: '✗',
                  color: 'border-rose-500',
                },
                {
                  id: 'analytical',
                  label: 'Analytical',
                  icon: '⚡',
                  color: 'border-indigo-500',
                },
                {
                  id: 'question',
                  label: 'Clarifying Question',
                  icon: '?',
                  color: 'border-amber-500',
                },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setPerspectiveStance(s.id)}
                className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  perspectiveStance === s.id
                    ? `bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ${s.color} ring-1 ring-indigo-500`
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quoted Passage (optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Quoted Article Passage or Claim (optional):
          </label>
          <input
            type="text"
            value={perspectiveQuote}
            onChange={(e) => setPerspectiveQuote(e.target.value)}
            placeholder="Paste specific sentence from article being annotated..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Argument details */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Your Argument & Factual Analysis:
          </label>
          <textarea
            value={perspectiveArgument}
            onChange={(e) => setPerspectiveArgument(e.target.value)}
            rows={3}
            required
            placeholder="Provide structured reasoning, counter-arguments, or domain insight..."
            className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Evidence URL & Author */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Supporting Documentation / Source URL (optional):
            </label>
            <input
              type="url"
              value={perspectiveEvidence}
              onChange={(e) => setPerspectiveEvidence(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Your Name or Handle (optional):
            </label>
            <input
              type="text"
              value={perspectiveAuthor}
              onChange={(e) => setPerspectiveAuthor(e.target.value)}
              placeholder="Dr. Specialist, Verified Subscriber..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!perspectiveArgument.trim() || isSubmitting}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Submitting...' : 'Publish Perspective'}</span>
          </button>
        </div>
      </form>

      {/* List of Perspectives */}
      <div className="space-y-4">
        {perspectives
          .filter((p) => stanceFilter === 'all' || p.stance === stanceFilter)
          .map((psp) => {
            const stanceStyles: Record<string, { badge: string; label: string; icon: string }> = {
              in_favor: {
                badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                label: 'In Favor',
                icon: '✓',
              },
              dissenting: {
                badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                label: 'Dissenting',
                icon: '✗',
              },
              analytical: {
                badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                label: 'Analytical',
                icon: '⚡',
              },
              question: {
                badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                label: 'Clarifying Question',
                icon: '?',
              },
            };
            const currentStance = stanceStyles[psp.stance] || stanceStyles.analytical;

            return (
              <div
                key={psp.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3"
              >
                {/* Top Bar: Stance Badge + Upvotes + Author */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${currentStance.badge}`}
                    >
                      <span>{currentStance.icon}</span>
                      <span>{currentStance.label}</span>
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {psp.authorName}
                    </span>
                    <span className="text-[10px] text-slate-400" suppressHydrationWarning>
                      • {formatDeterministicDateTime(psp.createdAt)}
                    </span>
                  </div>

                  <button
                    onClick={() => onUpvotePerspective(psp.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    title="Upvote perspective"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{psp.upvotes}</span>
                  </button>
                </div>

                {/* Quoted article context if any */}
                {psp.targetParagraphQuote && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <Quote className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="italic font-serif">"{psp.targetParagraphQuote}"</p>
                  </div>
                )}

                {/* Argument Body */}
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {psp.argument}
                </p>

                {/* Evidence Link */}
                {psp.evidenceUrl && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <a
                      href={psp.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 font-medium hover:underline"
                    >
                      <span>Supporting Evidence Document</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
