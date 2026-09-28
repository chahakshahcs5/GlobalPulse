'use client';

import React, { useEffect, useState } from 'react';

const EDITION_LABELS: Record<string, string> = {
  global: 'Global Edition (English)',
  india: 'India Edition (English)',
  us: 'United States (English)',
  europe: 'Europe Edition (English)',
  asia: 'Asia-Pacific (English)',
  mideast: 'Middle East & Gulf (English)',
};

export const EditionBadge: React.FC = () => {
  const [edition, setEdition] = useState<string>('global');

  useEffect(() => {
    const loadEdition = () => {
      try {
        const stored = localStorage.getItem('globalpulse_edition');
        if (stored) setEdition(stored);
      } catch {}
    };

    loadEdition();
    window.addEventListener('globalpulse_edition_updated', loadEdition);
    return () => window.removeEventListener('globalpulse_edition_updated', loadEdition);
  }, []);

  const label = EDITION_LABELS[edition] || EDITION_LABELS.global;

  return (
    <span
      className="font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded cursor-pointer hover:text-blue-600 transition"
      title="Active regional edition"
    >
      {label}
    </span>
  );
};
