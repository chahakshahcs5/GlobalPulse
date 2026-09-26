'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DEMO_STORIES } from '../../lib/demo-data';
import { D3ChartRenderer, MapRenderer, TimelineRenderer } from '@ai-news/media';

export default function LargeDisplayPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [timeStr, setTimeStr] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentStory = DEMO_STORIES[currentIndex] || DEMO_STORIES[0];

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
          ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotation every 25 seconds
  useEffect(() => {
    if (!autoRotate) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % DEMO_STORIES.length);
    }, 25000);
    return () => clearInterval(timer);
  }, [autoRotate]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Find chart and map blocks from the current story or use fallbacks
  const chartBlock = currentStory.blocks.find((b: any) => b.blockType === 'chart');
  const mapBlock = currentStory.blocks.find((b: any) => b.blockType === 'map');
  const timelineBlock = currentStory.blocks.find((b: any) => b.blockType === 'timeline');

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col justify-between overflow-hidden select-none p-4 sm:p-6 lg:p-8">
      {/* 4K / Ultrawide Header Banner */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/30">
            N
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider uppercase text-white flex items-center gap-2">
              GLOBALPULSE NEWS WALL
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                4K DISPLAY MODE
              </span>
            </h1>
            <p className="text-xs font-mono text-slate-400">
              Autonomous AI Ingestion via Remote MCP • Real-Time Broadcast
            </p>
          </div>
        </div>

        {/* Status Center */}
        <div className="flex items-center gap-6 font-mono text-xs">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-400 font-bold">STREAM ACTIVE</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-bold text-sm">
            {timeStr || '12:00:00 UTC'}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                autoRotate
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-slate-700 bg-slate-800 text-slate-400'
              }`}
            >
              {autoRotate ? 'AUTO-CYCLE: ON (25s)' : 'AUTO-CYCLE: PAUSED'}
            </button>
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
            >
              {isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}
            </button>
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition"
            >
              EXIT WALL
            </Link>
          </div>
        </div>
      </header>

      {/* Main Responsive Grid Layout (4K & Ultrawide Optimized) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 flex-1 items-stretch">
        {/* Left Column (6 Cols): Lead Story Headline, Summary & Narrative */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 sm:p-8 flex flex-col justify-between backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="space-y-5">
            {/* Story Meta Badges */}
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white">
                BREAKING COVERAGE
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {currentStory.articleType.replace('_', ' ')}
              </span>
              <span className="text-xs font-mono text-slate-400 ml-auto">
                Story {currentIndex + 1} of {DEMO_STORIES.length}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl 2xl:text-5xl font-black text-white tracking-tight leading-tight">
              {currentStory.title}
            </h2>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed font-normal">
              {currentStory.summary}
            </p>

            {/* Timeline if present */}
            {timelineBlock && (
              <div className="pt-4 border-t border-slate-800">
                <div
                  className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950/60"
                  dangerouslySetInnerHTML={{
                    __html: TimelineRenderer.renderSvgTrack(
                      (timelineBlock as any).data,
                      'horizontal',
                      700,
                      200,
                      'dark'
                    ),
                  }}
                />
              </div>
            )}
          </div>

          {/* Footer Provenance */}
          <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Agent: <strong className="text-slate-200">{currentStory.createdByClient.toUpperCase()}</strong> via MCP
            </span>
            <span>Revision: Version {currentStory.currentVersionNumber}</span>
          </div>
        </div>

        {/* Right Column (6 Cols): Split Visual Data (Chart + Map) */}
        <div className="lg:col-span-6 grid grid-cols-1 gap-6">
          {/* Top Panel: D3 Data Chart */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-md shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="text-xs font-bold font-mono uppercase text-slate-400 mb-2 px-2 flex justify-between">
              <span>Programmatic D3 Visualization</span>
              <span className="text-blue-400">LIVE RENDERED</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              {chartBlock ? (
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{
                    __html: D3ChartRenderer.renderToSvg((chartBlock as any).data, {
                      width: 760,
                      height: 320,
                      theme: 'dark',
                    }),
                  }}
                />
              ) : (
                <div className="text-slate-500 font-mono text-xs">No chart attached to this briefing.</div>
              )}
            </div>
          </div>

          {/* Bottom Panel: MapLibre Map Representation */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-md shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="text-xs font-bold font-mono uppercase text-slate-400 mb-2 px-2 flex justify-between">
              <span>Geospatial Intelligence Map</span>
              <span className="text-indigo-400">COORDINATES ACTIVE</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              {mapBlock ? (
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{
                    __html: MapRenderer.renderSvgFallback((mapBlock as any).data, 760, 300, 'dark'),
                  }}
                />
              ) : (
                <div className="text-slate-500 font-mono text-xs">No geospatial coordinates for this story.</div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Live News Ticker */}
      <footer className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden h-10 flex items-center">
        <div className="bg-rose-600 text-white font-black px-4 py-2 uppercase tracking-widest text-xs shrink-0 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
          LIVE WIRE
        </div>
        <div className="overflow-hidden whitespace-nowrap flex-1">
          <div className="ticker-track text-xs">
            {DEMO_STORIES.map((s) => (
              <span key={s.id} className="inline-flex items-center gap-3 mx-8 text-slate-300 font-medium">
                <span className="font-bold text-blue-400 font-mono uppercase">[{s.articleType}]</span>
                <span>{s.title}</span>
                <span className="text-slate-500 font-mono text-[11px]">(Version {s.currentVersionNumber})</span>
                <span className="text-slate-700 ml-4">•</span>
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
