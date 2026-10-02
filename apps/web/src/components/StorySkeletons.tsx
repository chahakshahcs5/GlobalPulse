'use client';

import React from 'react';
import { Sparkles, TrendingUp, ShieldCheck, MapPin } from 'lucide-react';

/**
 * Single Bone block with active shimmer wave animation
 */
export function SkeletonBone({
  className = '',
  rounded = 'rounded-md',
  style,
}: {
  className?: string;
  rounded?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`bg-slate-200/80 dark:bg-slate-800/80 animate-shimmer ${rounded} ${className}`}
    />
  );
}

/**
 * 1:1 Shimmer Skeleton for GoogleNewsLeadCard
 */
export function LeadStoryCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs overflow-hidden p-5 sm:p-6 space-y-5 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column Text Skeleton */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Publisher metadata row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SkeletonBone className="h-4 w-28 rounded-md" />
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <SkeletonBone className="h-3 w-16 rounded-md" />
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <SkeletonBone className="h-4 w-20 rounded-full" />
              </div>
              <div className="flex items-center gap-1.5">
                <SkeletonBone className="h-6 w-6 rounded-full" />
                <SkeletonBone className="h-6 w-6 rounded-full" />
              </div>
            </div>

            {/* Headline (2 lines) */}
            <div className="space-y-2 pt-1">
              <SkeletonBone className="h-6 w-11/12 rounded-lg" />
              <SkeletonBone className="h-6 w-4/5 rounded-lg" />
            </div>

            {/* Excerpt (3 lines) */}
            <div className="space-y-1.5 pt-1">
              <SkeletonBone className="h-3.5 w-full rounded" />
              <SkeletonBone className="h-3.5 w-5/6 rounded" />
              <SkeletonBone className="h-3.5 w-2/3 rounded" />
            </div>
          </div>

          {/* Full Coverage Pill Button Skeleton */}
          <div className="pt-2">
            <SkeletonBone className="h-7 w-44 rounded-full" />
          </div>
        </div>

        {/* Right Column Thumbnail Skeleton */}
        <div className="md:col-span-5">
          <SkeletonBone className="w-full aspect-16/10 rounded-xl" />
        </div>
      </div>

      {/* Multi-perspective Related Sources Bottom Bar */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-3">
        <SkeletonBone className="h-3 w-28 rounded" />
        <div className="flex items-center gap-2 flex-wrap">
          <SkeletonBone className="h-5 w-32 rounded-full" />
          <SkeletonBone className="h-5 w-36 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * 1:1 Shimmer Skeleton for GoogleNewsClusterCard
 */
export function ClusterCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs p-4 sm:p-5 space-y-3 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        {/* Left Column Content */}
        <div className="flex-1 space-y-2.5">
          {/* Publisher & Timestamp */}
          <div className="flex items-center gap-2">
            <SkeletonBone className="h-4 w-24 rounded-md" />
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <SkeletonBone className="h-3 w-14 rounded-md" />
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <SkeletonBone className="h-3.5 w-16 rounded-full" />
          </div>

          {/* Headline (2 lines) */}
          <div className="space-y-1.5">
            <SkeletonBone className="h-5 w-11/12 rounded-lg" />
            <SkeletonBone className="h-5 w-3/4 rounded-lg" />
          </div>

          {/* Excerpt (2 lines) */}
          <div className="space-y-1.5 pt-0.5">
            <SkeletonBone className="h-3.5 w-full rounded" />
            <SkeletonBone className="h-3.5 w-4/5 rounded" />
          </div>
        </div>

        {/* Right Thumbnail */}
        <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28">
          <SkeletonBone className="w-full h-full rounded-xl" />
        </div>
      </div>

      {/* Indented related perspective items */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
        <div className="flex items-center gap-2">
          <SkeletonBone className="h-3 w-3 rounded-full shrink-0" />
          <SkeletonBone className="h-3 w-20 rounded" />
          <SkeletonBone className="h-3 w-48 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBone className="h-3 w-3 rounded-full shrink-0" />
          <SkeletonBone className="h-3 w-24 rounded" />
          <SkeletonBone className="h-3 w-40 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Shimmer Skeleton for Sidebar Weather Widget
 */
export function WeatherWidgetSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-blue-500/50" />
          <SkeletonBone className="h-4 w-32 rounded-md" />
        </div>
        <SkeletonBone className="h-4 w-12 rounded-full" />
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <SkeletonBone className="w-10 h-10 rounded-xl" />
          <div className="space-y-1">
            <SkeletonBone className="h-7 w-20 rounded-md" />
            <SkeletonBone className="h-3 w-24 rounded" />
          </div>
        </div>
        <div className="space-y-1.5 text-right">
          <SkeletonBone className="h-3 w-16 ml-auto rounded" />
          <SkeletonBone className="h-3 w-14 ml-auto rounded" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1 py-1">
            <SkeletonBone className="h-3 w-8 rounded" />
            <SkeletonBone className="w-6 h-6 rounded-md my-0.5" />
            <SkeletonBone className="h-3 w-6 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Shimmer Skeleton for Sidebar Picks For You Widget
 */
export function PicksForYouSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-blue-500/50" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Picks for you
          </span>
        </div>
        <SkeletonBone className="h-3 w-16 rounded" />
      </div>

      <div className="space-y-3 pt-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="space-y-1.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0 last:pb-0"
          >
            <div className="flex items-center justify-between">
              <SkeletonBone className="h-3 w-24 rounded" />
              <SkeletonBone className="h-3 w-12 rounded" />
            </div>
            <SkeletonBone className="h-4 w-full rounded" />
            <SkeletonBone className="h-4 w-3/4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Shimmer Skeleton for Sidebar Trending Topics
 */
export function TrendingTopicsSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
      <div className="flex items-center gap-1.5">
        <TrendingUp className="w-4 h-4 text-blue-500/50" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          In the News
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {[24, 32, 28, 36, 20, 30, 26, 34].map((w, idx) => (
          <SkeletonBone key={idx} className="h-6 rounded-full" style={{ width: `${w * 3}px` }} />
        ))}
      </div>
    </div>
  );
}

/**
 * Shimmer Skeleton for Fact Check Widget
 */
export function FactCheckWidgetSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500/50" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Fact Check Bureau
          </span>
        </div>
        <SkeletonBone className="h-3 w-14 rounded" />
      </div>

      <div className="space-y-2.5 pt-1">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
          >
            <div className="flex items-center justify-between">
              <SkeletonBone className="h-3 w-28 rounded" />
              <SkeletonBone className="h-4 w-16 rounded" />
            </div>
            <SkeletonBone className="h-3.5 w-full rounded" />
            <SkeletonBone className="h-3.5 w-4/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full-fidelity Home Page Shimmer Skeleton Layout
 * Used for both Suspense fallback and initial async feed loading
 */
export function HomePageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Header Row Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <SkeletonBone className="h-8 w-44 rounded-xl" />
          <SkeletonBone className="h-3.5 w-64 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBone className="h-8 w-24 rounded-full" />
          <SkeletonBone className="h-8 w-32 rounded-full" />
        </div>
      </div>

      {/* Main Grid: Left Feed (8 cols) + Right Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column Feed */}
        <div className="lg:col-span-8 space-y-5">
          <LeadStoryCardSkeleton />
          <ClusterCardSkeleton />
          <ClusterCardSkeleton />
          <ClusterCardSkeleton />
        </div>

        {/* Right Column Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <WeatherWidgetSkeleton />
          <PicksForYouSkeleton />
          <TrendingTopicsSkeleton />
          <FactCheckWidgetSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * Story Detail Page Shimmer Skeleton
 * Shown while story and blocks are asynchronously resolving
 */
export function StoryDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Navigation Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <SkeletonBone className="h-3 w-20 rounded" />
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <SkeletonBone className="h-3 w-28 rounded" />
      </div>

      {/* Masthead Header Skeleton */}
      <header className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        {/* Top metadata pill row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SkeletonBone className="h-4 w-36 rounded-md" />
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <SkeletonBone className="h-3 w-24 rounded" />
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <SkeletonBone className="h-3 w-16 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBone className="h-6 w-16 rounded-full" />
            <SkeletonBone className="h-6 w-32 rounded-full" />
          </div>
        </div>

        {/* Large Headline (3 lines) */}
        <div className="space-y-2.5 pt-2">
          <SkeletonBone className="h-8 sm:h-10 w-full rounded-xl" />
          <SkeletonBone className="h-8 sm:h-10 w-11/12 rounded-xl" />
          <SkeletonBone className="h-8 sm:h-10 w-2/3 rounded-xl" />
        </div>

        {/* Provenance Badge Bar */}
        <div className="pt-1">
          <SkeletonBone className="h-8 w-80 rounded-xl" />
        </div>

        {/* Executive Summary Card Skeleton */}
        <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
          <SkeletonBone className="h-4 w-full rounded" />
          <SkeletonBone className="h-4 w-11/12 rounded" />
          <SkeletonBone className="h-4 w-3/4 rounded" />
        </div>

        {/* Author Byline & Reader Toolbar */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <SkeletonBone className="w-8 h-8 rounded-full" />
            <div className="space-y-1">
              <SkeletonBone className="h-3.5 w-28 rounded" />
              <SkeletonBone className="h-2.5 w-20 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBone className="h-7 w-20 rounded-full" />
            <SkeletonBone className="h-7 w-24 rounded-full" />
            <SkeletonBone className="h-7 w-7 rounded-full" />
            <SkeletonBone className="h-7 w-7 rounded-full" />
          </div>
        </div>
      </header>

      {/* Hero Visual Asset Skeleton */}
      <SkeletonBone className="w-full aspect-16/9 max-h-[460px] rounded-2xl shadow-md" />

      {/* Reading Depth Selector Bar Skeleton */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <SkeletonBone className="h-7 w-56 rounded-xl" />
        <SkeletonBone className="h-7 w-28 rounded-xl" />
      </div>

      {/* Multi-block Body Paragraphs Skeleton */}
      <div className="space-y-6 pt-4">
        {/* Paragraph 1 */}
        <div className="space-y-2.5">
          <SkeletonBone className="h-4 w-full rounded" />
          <SkeletonBone className="h-4 w-full rounded" />
          <SkeletonBone className="h-4 w-11/12 rounded" />
          <SkeletonBone className="h-4 w-4/5 rounded" />
        </div>

        {/* Large Quote / Callout Block */}
        <div className="p-6 rounded-2xl border-l-4 border-blue-600 bg-slate-50 dark:bg-slate-900/60 space-y-2.5">
          <SkeletonBone className="h-5 w-5/6 rounded-lg" />
          <SkeletonBone className="h-5 w-2/3 rounded-lg" />
          <SkeletonBone className="h-3 w-40 rounded pt-1" />
        </div>

        {/* Paragraph 2 */}
        <div className="space-y-2.5">
          <SkeletonBone className="h-4 w-full rounded" />
          <SkeletonBone className="h-4 w-full rounded" />
          <SkeletonBone className="h-4 w-5/6 rounded" />
        </div>

        {/* Paragraph 3 */}
        <div className="space-y-2.5">
          <SkeletonBone className="h-4 w-full rounded" />
          <SkeletonBone className="h-4 w-11/12 rounded" />
          <SkeletonBone className="h-4 w-3/4 rounded" />
        </div>
      </div>

      {/* Fact Check Card Skeleton */}
      <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <SkeletonBone className="h-4 w-48 rounded" />
        <SkeletonBone className="h-20 w-full rounded-2xl" />
      </div>

      {/* Related Stories Grid Skeleton */}
      <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <SkeletonBone className="h-5 w-44 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
            >
              <SkeletonBone className="h-3 w-20 rounded" />
              <SkeletonBone className="h-4 w-full rounded" />
              <SkeletonBone className="h-4 w-3/4 rounded" />
              <SkeletonBone className="h-3 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
