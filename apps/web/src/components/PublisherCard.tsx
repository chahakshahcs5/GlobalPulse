'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Publisher } from '@ai-news/schemas';
import { CheckCircle2, Globe, Users, Plus, Check } from 'lucide-react';
import { followTarget, unfollowTarget } from '../lib/api-client';

interface PublisherCardProps {
  publisher: Publisher;
  isInitiallyFollowing?: boolean;
  onFollowToggle?: (publisherId: string, isFollowing: boolean) => void;
}

export const PublisherCard: React.FC<PublisherCardProps> = ({
  publisher,
  isInitiallyFollowing = false,
  onFollowToggle,
}) => {
  const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing);
  const [followerCount, setFollowerCount] = useState(publisher.followerCount || 0);

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowerCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    // Update local storage for immediate cross-tab responsiveness
    try {
      const stored = localStorage.getItem('globalpulse_followed_sources');
      const followed: string[] = stored ? JSON.parse(stored) : [];
      const updated = nextState
        ? Array.from(new Set([...followed, publisher.id, publisher.slug]))
        : followed.filter((id) => id !== publisher.id && id !== publisher.slug);
      localStorage.setItem('globalpulse_followed_sources', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('globalpulse_sources_updated'));
    } catch {}

    // Call backend API
    if (nextState) {
      await followTarget('source', publisher.id);
    } else {
      await unfollowTarget('source', publisher.id);
    }

    if (onFollowToggle) {
      onFollowToggle(publisher.id, nextState);
    }
  };

  const domain =
    publisher.domain ||
    publisher.websiteUrl
      ?.replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0] ||
    '';

  return (
    <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all duration-300 hover:border-blue-500/40 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-blue-950/20 flex flex-col justify-between">
      <div>
        {/* Top Header: Logo + Follow Button */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/60 overflow-hidden flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300">
              {publisher.logoUrl ? (
                <img
                  src={publisher.logoUrl}
                  alt={publisher.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to text avatar
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              <span className="font-black text-lg text-blue-400 font-mono">
                {publisher.name.slice(0, 2).toUpperCase()}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/sources/${publisher.slug}`}
                  className="font-bold text-base text-white group-hover:text-blue-400 transition-colors line-clamp-1"
                >
                  {publisher.name}
                </Link>
                {publisher.isVerified && (
                  <span title="Verified Publication">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                <span className="text-slate-400 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-slate-500" />
                  {domain}
                </span>
                {publisher.country && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span>{publisher.country}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Follow Button */}
          <button
            onClick={handleFollowClick}
            type="button"
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              isFollowing
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40'
                : 'bg-white text-slate-900 hover:bg-slate-200 shadow-md font-bold'
            }`}
          >
            {isFollowing ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Following</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Follow</span>
              </>
            )}
          </button>
        </div>

        {/* Description */}
        {publisher.description && (
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
            {publisher.description}
          </p>
        )}
      </div>

      {/* Footer Meta */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-semibold bg-slate-800 text-slate-300 border border-slate-700/50">
            {publisher.category || 'General'}
          </span>
          <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
            <Users className="w-3 h-3 text-slate-500" />
            <span>{followerCount.toLocaleString()} followers</span>
          </div>
        </div>

        <Link
          href={`/sources/${publisher.slug}`}
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
        >
          <span>View Source</span>
          <span className="text-slate-500 group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>
    </div>
  );
};
