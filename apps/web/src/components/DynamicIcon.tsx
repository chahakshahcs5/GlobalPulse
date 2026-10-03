'use client';

import * as LucideIcons from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';

export interface DynamicIconProps extends Omit<LucideProps, 'ref' | 'name'> {
  name?: string | null | LucideIcon;
  fallback?: string;
}

/**
 * Common category & domain aliases to standard Lucide icons
 */
const ICON_ALIASES: Record<string, string> = {
  'top-stories': 'Star',
  top: 'Star',
  breaking: 'Zap',
  technology: 'Cpu',
  tech: 'Cpu',
  business: 'TrendingUp',
  markets: 'TrendingUp',
  world: 'Globe',
  global: 'Globe',
  science: 'Atom',
  health: 'HeartPulse',
  sports: 'Trophy',
  entertainment: 'Film',
  culture: 'Film',
  politics: 'Landmark',
  india: 'Globe',
  us: 'Globe',
  general: 'Newspaper',
  weather: 'CloudSun',
  'for-you': 'Sparkles',
  following: 'BookmarkCheck',
  explore: 'Compass',
  'fact-checks': 'ShieldCheck',
  desks: 'Radio',
};

/**
 * Normalizes hyphenated, underscored, or camelCase strings to PascalCase.
 * e.g. 'trending-up' -> 'TrendingUp', 'cpu' -> 'Cpu', 'folder-plus' -> 'FolderPlus'
 */
function toPascalCase(str: string): string {
  const cleaned = str.trim();
  if (ICON_ALIASES[cleaned.toLowerCase()]) {
    return ICON_ALIASES[cleaned.toLowerCase()];
  }
  return cleaned
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

/**
 * Detects if a string consists primarily of an emoji or Unicode pictograph
 */
function isEmojiString(str: string): boolean {
  return /\p{Extended_Pictographic}/u.test(str);
}

/**
 * DynamicIcon Component
 * Resolves icon identifiers dynamically from Lucide, Unicode emojis, or aliases with fallback.
 */
export function DynamicIcon({
  name,
  fallback = 'Folder',
  className = 'w-4 h-4',
  ...props
}: DynamicIconProps) {
  // If a LucideIcon component was passed directly as function
  if (typeof name === 'function') {
    const Component = name as LucideIcon;
    return <Component className={className} {...props} />;
  }

  if (!name || typeof name !== 'string') {
    const Fallback =
      ((LucideIcons as Record<string, unknown>)[fallback] as LucideIcon) || LucideIcons.Folder;
    return <Fallback className={className} {...props} />;
  }

  const trimmed = name.trim();

  // If raw emoji is provided
  if (isEmojiString(trimmed)) {
    return (
      <span
        className={`inline-flex items-center justify-center select-none ${className}`}
        aria-hidden="true"
      >
        {trimmed}
      </span>
    );
  }

  // Lookup in Lucide icons
  const pascalName = toPascalCase(trimmed);
  const IconComponent =
    ((LucideIcons as Record<string, unknown>)[pascalName] as LucideIcon) ||
    ((LucideIcons as Record<string, unknown>)[`${pascalName}Icon`] as LucideIcon) ||
    ((LucideIcons as Record<string, unknown>)[trimmed] as LucideIcon);

  if (IconComponent && typeof IconComponent === 'function') {
    return <IconComponent className={className} {...props} />;
  }

  // Fallback icon
  const Fallback =
    ((LucideIcons as Record<string, unknown>)[fallback] as LucideIcon) || LucideIcons.Folder;
  return <Fallback className={className} {...props} />;
}
