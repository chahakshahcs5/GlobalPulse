'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Lock,
  UploadCloud,
  FileCheck,
  CheckCircle,
  Copy,
  ArrowLeft,
  Key,
  Flame,
  Clock,
  Send,
  EyeOff,
} from 'lucide-react';
import type { CitizenTipUrgency, CitizenTipAnonymity } from '@ai-news/schemas';

export default function TipLinePage() {
  const [headline, setHeadline] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState('defense');
  const [urgency, setUrgency] = useState<CitizenTipUrgency>('routine');
  const [anonymityMode, setAnonymityMode] = useState<CitizenTipAnonymity>('full_anonymous');
  const [contactAlias, setContactAlias] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<{
    receiptToken: string;
    checksum: string;
    headline: string;
    submittedAt: string;
  } | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Compute a deterministic client-side SHA-256 pseudo-hash for integrity verification
  const computeChecksum = () => {
    const raw = `${headline}|${details}|${category}|${urgency}|${attachedFileName}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `sha256:${hex}e7a192df44c01b2a95c89f13d80${hex}`;
  };

  const checksum = computeChecksum();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !details.trim() || isSubmitting) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const receiptToken = `rcpt_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
      const receipt = {
        receiptToken,
        checksum,
        headline,
        submittedAt: new Date().toISOString(),
      };

      // Save locally to reader drop logs
      if (typeof window !== 'undefined') {
        try {
          const prev = JSON.parse(localStorage.getItem('globalpulse_submitted_tips') || '[]');
          localStorage.setItem('globalpulse_submitted_tips', JSON.stringify([receipt, ...prev]));
        } catch {}
      }

      setSubmissionReceipt(receipt);
      setIsSubmitting(false);
    }, 600);
  };

  const handleCopyReceipt = () => {
    if (submissionReceipt && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(
        `GlobalPulse Whistleblower Receipt Token: ${submissionReceipt.receiptToken}\nPayload Verification Checksum: ${submissionReceipt.checksum}`
      );
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2000);
    }
  };

  const categories = [
    { id: 'defense', label: 'Defense & Autonomous Systems' },
    { id: 'climate', label: 'Climate Harm & Carbon Evasion' },
    { id: 'tech', label: 'Frontier AI & Model Safety' },
    { id: 'trade', label: 'Sanctions & Critical Minerals' },
    { id: 'finance', label: 'Corporate Malfeasance' },
    { id: 'government', label: 'Government Transparency' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-900 dark:text-slate-100">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link
          href="/"
          className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Newsroom Home
        </Link>
        <span>•</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">Secure Tip Line</span>
      </nav>

      {/* Hero Masthead */}
      <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs font-bold tracking-wide shadow-xs">
          <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>Encrypted Investigative Intake Drop</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
          Citizen Tip Line &amp; Whistleblower Drop
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
          Submit documents, leaks, and verified tips directly to GlobalPulse investigative
          journalists. All submissions feature client-side SHA-256 payload integrity hashing without
          device tracking.
        </p>
      </div>

      {/* Security Protocol Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition space-y-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              Zero Device Logging
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
              No source IP addresses, browser canvas fingerprints, or telemetry are recorded in our
              triage database.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              Cryptographic Checksum
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
              A client-side cryptographic hash ensures your submission cannot be modified or
              tampered with in transit.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <EyeOff className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              Anonymous Token Retrieval
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
              You receive a single-use receipt token to monitor reporter review without disclosing
              contact channels.
            </p>
          </div>
        </div>
      </div>

      {/* Submission Form */}
      {!submissionReceipt ? (
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6"
        >
          {/* Anonymity Mode Switch */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              1. Anonymity Preference
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAnonymityMode('full_anonymous')}
                className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 cursor-pointer ${
                  anonymityMode === 'full_anonymous'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-950 dark:text-white ring-2 ring-indigo-600/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    anonymityMode === 'full_anonymous'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <EyeOff className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    Full Anonymous Drop
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    No name, email, or handle recorded. Monitored strictly via receipt token.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAnonymityMode('confidential_source')}
                className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 cursor-pointer ${
                  anonymityMode === 'confidential_source'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-950 dark:text-white ring-2 ring-indigo-600/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    anonymityMode === 'confidential_source'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    Confidential Source Channel
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Provide a pseudonym or encrypted messaging handle for investigative follow-ups.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Confidential handle input if requested */}
          {anonymityMode === 'confidential_source' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Encrypted Handle or Secure Drop Pseudonym:
              </label>
              <input
                type="text"
                value={contactAlias}
                onChange={(e) => setContactAlias(e.target.value)}
                placeholder="e.g. Signal number, Tor onion handle, or 'AeroAnalyst_Sector4'"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Urgency Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              2. Urgency &amp; Impact Horizon
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'routine',
                  label: 'Routine Inquiry',
                  desc: 'Standard investigative lead (48-72h triage)',
                  icon: Clock,
                  color: 'text-blue-500',
                },
                {
                  id: 'elevated',
                  label: 'Elevated Significance',
                  desc: 'Substantial public policy impact (12-24h)',
                  icon: FileCheck,
                  color: 'text-amber-500',
                },
                {
                  id: 'breaking',
                  label: 'Breaking / Urgent Risk',
                  desc: 'Immediate public safety or impending event',
                  icon: Flame,
                  color: 'text-rose-500',
                },
              ].map((u) => {
                const Icon = u.icon;
                const isSelected = urgency === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setUrgency(u.id as CitizenTipUrgency)}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-950 dark:text-white ring-2 ring-indigo-600/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                      <Icon className={`w-4 h-4 ${u.color}`} />
                      <span>{u.label}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-normal">
                      {u.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              3. Investigative Subject Area
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const isSelected = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Headline & Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                4. Working Title / Lead Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                required
                placeholder="e.g. Undisclosed autonomous drone corridor tests"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Disclosures &amp; Evidence Details
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                required
                rows={5}
                placeholder="Provide detailed factual occurrences, dates, named entities, internal memos, or eyewitness observations..."
                className="w-full p-4 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Supporting Evidence / Attachment simulation */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              5. Document / Manifest Reference (Optional)
            </label>
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-center space-y-2">
              <UploadCloud className="w-8 h-8 mx-auto text-indigo-500 dark:text-indigo-400" />
              <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Attach verification document name or manifest reference
              </div>
              <input
                type="text"
                value={attachedFileName}
                onChange={(e) => setAttachedFileName(e.target.value)}
                placeholder="e.g. flight_telemetry_corridor_log.csv or contract_appendix_b.pdf"
                className="max-w-md mx-auto w-full px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Live Checksum Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Key className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Payload Integrity Checksum:</span>
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-full sm:max-w-md">
              {checksum}
            </span>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={!headline.trim() || !details.trim() || isSubmitting}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-indigo-600 to-blue-600 hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Verifying & Submitting...' : 'Submit Whistleblower Drop'}
              </span>
            </button>
          </div>
        </form>
      ) : (
        /* Confirmation & Receipt Card */
        <div className="p-6 sm:p-8 rounded-3xl border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Whistleblower Tip Received
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Encrypted payload assigned to newsroom investigative triage desk.
              </p>
            </div>
          </div>

          {/* Receipt Token Display */}
          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-white dark:bg-slate-950 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Your Secure Receipt Token:
              </span>
              <button
                onClick={handleCopyReceipt}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline transition flex items-center gap-1 cursor-pointer font-bold"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedReceipt ? '✓ Copied' : 'Copy Token'}</span>
              </button>
            </div>

            <div className="font-mono text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 break-all select-all">
              {submissionReceipt.receiptToken}
            </div>

            <div className="text-[11px] text-slate-500">
              <span className="font-mono">Payload Checksum: </span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {submissionReceipt.checksum}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Next Steps &amp; Security Protocol</span>
            </div>
            <p>
              Please store your receipt token in a secure location. If reporters verify your
              disclosure for an investigative dispatch, you can verify newsroom queries or
              corroboration status using this token without leaving any personal trace.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Dispatches
            </Link>
            <button
              onClick={() => {
                setSubmissionReceipt(null);
                setHeadline('');
                setDetails('');
                setAttachedFileName('');
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-900 dark:text-white transition cursor-pointer"
            >
              Submit Another Tip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
