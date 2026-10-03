'use client';

import React, { useEffect, useState } from 'react';
import {
  Layers,
  X,
  ExternalLink,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Newspaper,
  AlertCircle,
} from 'lucide-react';
import { getStoryFullCoverage } from '../lib/api-client';

interface FullCoverageModalProps {
  slug: string | null;
  onClose: () => void;
}

export interface CoveragePerspective {
  publisher: string;
  timeAgo?: string;
  headline: string;
  excerpt?: string;
  stance?: string;
  url?: string;
  isWire?: boolean;
  sourceType?: string;
}

export interface CoverageTimelineItem {
  time?: string;
  date?: string;
  headline?: string;
  event?: string;
  detail?: string;
  source?: string;
}

export interface CoverageFactCheck {
  verdict: string;
  confidence?: number;
  verificationNote?: string;
  officialSources?: string[];
}

export interface CoverageData {
  title?: string;
  leadHeadline?: string;
  summary?: string;
  articleCount?: number;
  biasSpectrum?: {
    leftPercent?: number;
    centerPercent?: number;
    rightPercent?: number;
  };
  perspectives?: CoveragePerspective[];
  timeline?: CoverageTimelineItem[];
  factCheck?: CoverageFactCheck;
}

export const FullCoverageModal: React.FC<FullCoverageModalProps> = ({ slug, onClose }) => {
  const [cluster, setCluster] = useState<CoverageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setCluster(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    getStoryFullCoverage(slug)
      .then((data) => {
        if (!isMounted) return;
        if (data && (data.perspectives?.length || data.title)) {
          setCluster(data as unknown as CoverageData);
        } else {
          setCluster(null);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setCluster(null);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (!slug) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md transition-opacity cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 cursor-default"
      >
        {/* Modal Masthead */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Layers className="w-4 h-4" />
              <span>Full Story Coverage Cluster</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Multi-Source Verified
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {cluster ? cluster.title : `Coverage: ${slug}`}
            </h2>
            {cluster?.summary && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {cluster.summary}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isLoading && (
          <div className="p-12 text-center text-slate-400 text-sm animate-pulse space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
            <p>Aggregating multi-source coverage perspectives...</p>
          </div>
        )}

        {!isLoading && !cluster && (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Coverage Cluster Available
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              A full-coverage multi-source cluster has not been compiled for this dispatch yet.
            </p>
          </div>
        )}

        {!isLoading && cluster && (
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Column 1: Multi-Publisher Perspectives */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-blue-500" />
                Multi-Source Editorial Perspectives ({cluster.perspectives?.length || 0})
              </h3>

              <div className="space-y-3">
                {(cluster.perspectives || []).map((p: CoveragePerspective, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-blue-700 dark:text-blue-400">
                        {p.publisher}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{p.timeAgo}</span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                      {p.headline}
                    </h4>

                    {p.excerpt && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-2 border-slate-300 dark:border-slate-700 pl-2.5">
                        "{p.excerpt}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {p.sourceType || 'reporting'}
                      </span>
                      {p.url && p.url !== '#' && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                        >
                          Read Source <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Timeline & Fact-Check Audit */}
            <div className="lg:col-span-5 space-y-6">
              {/* Fact Check Card */}
              {cluster.factCheck && (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Fact-Check Verification</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      Official Verdict:
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-black bg-emerald-600 text-white uppercase tracking-wider">
                      {cluster.factCheck.verdict} (
                      {Math.round((cluster.factCheck.confidence || 1) * 100)}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {cluster.factCheck.verificationNote}
                  </p>
                  {cluster.factCheck.officialSources && (
                    <div className="text-[11px] text-slate-500 pt-1 space-y-1">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                        Audited Sources:
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 pl-1">
                        {cluster.factCheck.officialSources.map((s: string, idx: number) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Developing Timeline */}
              {cluster.timeline && cluster.timeline.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    Event Development Timeline
                  </h3>
                  <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-2 space-y-4 py-1">
                    {cluster.timeline.map((item: CoverageTimelineItem, idx: number) => (
                      <div key={idx} className="relative pl-5">
                        <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-600"></span>
                        <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                          {item.time || item.date}
                        </span>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">
                          {item.headline || item.event}
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.detail || item.source}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between text-xs text-slate-500">
          <span>Continuous multi-source aggregation active.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            Close Full Coverage
          </button>
        </div>
      </div>
    </div>
  );
};
