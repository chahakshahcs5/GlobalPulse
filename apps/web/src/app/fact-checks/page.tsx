'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Copy,
  Check,
  FileCheck2,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { listFactChecks } from '../../lib/api-client';
import type { FactCheckClaim } from '@ai-news/schemas';

type VerdictFilter = 'ALL' | 'FALSE' | 'TRUE' | 'MIXTURE' | 'UNVERIFIED';

interface FactCheckExtended extends FactCheckClaim {
  verdict?: string;
  explanation?: string;
}

export default function FactChecksPage() {
  const [factChecks, setFactChecks] = useState<FactCheckExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVerdict, setSelectedVerdict] = useState<VerdictFilter>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeHash, setActiveHash] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    listFactChecks()
      .then((data) => {
        if (isMounted) {
          setFactChecks(Array.isArray(data) ? (data as FactCheckExtended[]) : []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFactChecks([]);
          setIsLoading(false);
        }
      });

    if (typeof window !== 'undefined') {
      setActiveHash(window.location.hash.replace('#', ''));
      const handleHashChange = () => {
        setActiveHash(window.location.hash.replace('#', ''));
      };
      window.addEventListener('hashchange', handleHashChange);
      return () => {
        isMounted = false;
        window.removeEventListener('hashchange', handleHashChange);
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const copyClaimLink = (id: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const url = `${window.location.origin}/fact-checks#${id}`;
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getRatingConfig = (rawRating?: string) => {
    const r = (rawRating || 'UNVERIFIED').toUpperCase();
    if (r === 'FALSE' || r === 'MOSTLY_FALSE') {
      return {
        key: 'FALSE',
        label: r.replace('_', ' '),
        badgeClass:
          'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        cardBorder: 'hover:border-rose-300 dark:hover:border-rose-900',
        icon: XCircle,
        iconColor: 'text-rose-600 dark:text-rose-400',
      };
    }
    if (r === 'TRUE' || r === 'MOSTLY_TRUE') {
      return {
        key: 'TRUE',
        label: r.replace('_', ' '),
        badgeClass:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        cardBorder: 'hover:border-emerald-300 dark:hover:border-emerald-900',
        icon: CheckCircle2,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
      };
    }
    if (r === 'MIXTURE') {
      return {
        key: 'MIXTURE',
        label: 'MIXTURE',
        badgeClass:
          'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        cardBorder: 'hover:border-amber-300 dark:hover:border-amber-900',
        icon: AlertTriangle,
        iconColor: 'text-amber-600 dark:text-amber-400',
      };
    }
    return {
      key: 'UNVERIFIED',
      label: 'UNVERIFIED',
      badgeClass:
        'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      cardBorder: 'hover:border-slate-300 dark:hover:border-slate-700',
      icon: HelpCircle,
      iconColor: 'text-slate-500 dark:text-slate-400',
    };
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = factChecks.length;
    if (total === 0) return { total: 0, falseCount: 0, trueCount: 0, mixtureCount: 0, falsePct: 0 };
    const falseCount = factChecks.filter((fc) => {
      const r = (fc.verdict || fc.rating || '').toUpperCase();
      return r === 'FALSE' || r === 'MOSTLY_FALSE';
    }).length;
    const trueCount = factChecks.filter((fc) => {
      const r = (fc.verdict || fc.rating || '').toUpperCase();
      return r === 'TRUE' || r === 'MOSTLY_TRUE';
    }).length;
    const mixtureCount = factChecks.filter((fc) => {
      const r = (fc.verdict || fc.rating || '').toUpperCase();
      return r === 'MIXTURE';
    }).length;
    const falsePct = Math.round((falseCount / total) * 100);
    return { total, falseCount, trueCount, mixtureCount, falsePct };
  }, [factChecks]);

  // Filtering
  const filteredChecks = useMemo(() => {
    return factChecks.filter((fc) => {
      const rating = (fc.verdict || fc.rating || 'UNVERIFIED').toUpperCase();

      if (selectedVerdict === 'FALSE' && rating !== 'FALSE' && rating !== 'MOSTLY_FALSE') {
        return false;
      }
      if (selectedVerdict === 'TRUE' && rating !== 'TRUE' && rating !== 'MOSTLY_TRUE') {
        return false;
      }
      if (selectedVerdict === 'MIXTURE' && rating !== 'MIXTURE') {
        return false;
      }
      if (selectedVerdict === 'UNVERIFIED' && rating !== 'UNVERIFIED') {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesClaim = fc.claim?.toLowerCase().includes(q);
        const matchesClaimant = fc.claimant?.toLowerCase().includes(q);
        const matchesSummary = (fc.explanation || fc.summary || '').toLowerCase().includes(q);
        const matchesChecker = fc.checker?.toLowerCase().includes(q);
        const matchesSource = fc.sources?.some((s) => s.toLowerCase().includes(q));
        return matchesClaim || matchesClaimant || matchesSummary || matchesChecker || matchesSource;
      }

      return true;
    });
  }, [factChecks, selectedVerdict, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-slate-900 dark:text-slate-100">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link
          href="/"
          className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Newsroom Home
        </Link>
        <span>•</span>
        <Link href="/explore" className="hover:text-slate-900 dark:hover:text-white transition">
          Explore
        </Link>
        <span>•</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          Independent Fact Check Bureau
        </span>
      </nav>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-850 to-indigo-950 text-white p-8 sm:p-10 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Independent Verification Desk</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Fact Check Bureau &amp; Verified Ledger
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
            Every viral dispatch, social claim, and disputed narrative is investigated against
            primary evidence, scientific consensus, and authenticated wire records. Explore complete
            debunks, verifications, and citation trails.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/tips"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Submit Disputed Claim to Tip Line</span>
            </Link>
            <a
              href="#dossiers"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-xs transition-all"
            >
              <span>Explore All Verified Claims</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Verification Ledger Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Claims Evaluated
          </span>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{metrics.total}</div>
          <p className="text-[11px] text-slate-500">Cross-referenced with primary records</p>
        </div>

        <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs space-y-1">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Debunked False
          </span>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
            {metrics.falseCount}
          </div>
          <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-medium">
            {metrics.falsePct}% of flagged claims
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs space-y-1">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Certified Authentic
          </span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {metrics.trueCount}
          </div>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
            Supported by empirical records
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs space-y-1">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Mixture / Context Needed
          </span>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {metrics.mixtureCount}
          </div>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium">
            Partial truths or missing context
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div id="dossiers" className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Investigative Dossiers
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Showing {filteredChecks.length} of {factChecks.length} verified claims
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search claims, sources, claimants..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Verdict Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'ALL', label: 'All Verdicts' },
              { id: 'FALSE', label: 'Debunked (False)' },
              { id: 'TRUE', label: 'Verified True' },
              { id: 'MIXTURE', label: 'Mixture' },
            ] as const
          ).map((tab) => {
            const isActive = selectedVerdict === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedVerdict(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredChecks.length === 0 && (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Claims Match Your Filter
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try resetting your search query or verdict category to browse all verified dossiers.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedVerdict('ALL');
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Fact Check Cards Grid */}
      {!isLoading && filteredChecks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredChecks.map((fc) => {
            const ratingConfig = getRatingConfig(fc.verdict || fc.rating);
            const RatingIcon = ratingConfig.icon;
            const isAnchorActive = activeHash === fc.id;

            return (
              <article
                key={fc.id}
                id={fc.id}
                className={`relative rounded-2xl border bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-300 space-y-4 ${
                  isAnchorActive
                    ? 'ring-2 ring-emerald-500 border-emerald-500 dark:border-emerald-500 shadow-lg'
                    : 'border-slate-200 dark:border-slate-800 hover:shadow-md ' +
                      ratingConfig.cardBorder
                }`}
              >
                {/* Top strip */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">
                      Claim by:{' '}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {fc.claimant || 'Viral Posts'}
                      </strong>
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                      Investigated on{' '}
                      {new Date(fc.checkedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border whitespace-nowrap ${ratingConfig.badgeClass}`}
                  >
                    <RatingIcon className="w-3.5 h-3.5" />
                    <span>{ratingConfig.label}</span>
                  </span>
                </div>

                {/* Claim headline */}
                <blockquote className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug pl-3 border-l-2 border-slate-300 dark:border-slate-700">
                  "{fc.claim}"
                </blockquote>

                {/* Verification Explanation */}
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <strong className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Bureau Finding:
                  </strong>
                  <p>{fc.explanation || fc.summary}</p>
                </div>

                {/* Evidence and Primary Sources */}
                {fc.sources && fc.sources.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Verified Primary Sources:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {fc.sources.map((src, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          <FileCheck2 className="w-3 h-3 text-slate-400" />
                          <span>{src}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{fc.checker || 'GlobalPulse Verification Desk'}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {fc.url && (
                      <a
                        href={fc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span>Evidence</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    <button
                      onClick={() => copyClaimLink(fc.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Copy link to this verification dossier"
                    >
                      {copiedId === fc.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Tip Line Callout Footer Banner */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Community Watchdog Network</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Spotted a suspicious viral rumor or false claim?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
            Submit screenshots, audio dispatches, or documents to our investigative reporters. All
            intakes are cryptographically hashed with zero device telemetry.
          </p>
        </div>

        <Link
          href="/tips"
          className="shrink-0 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-sm shadow-md transition-all active:scale-95"
        >
          Send Evidence to Tip Line →
        </Link>
      </div>
    </div>
  );
}
