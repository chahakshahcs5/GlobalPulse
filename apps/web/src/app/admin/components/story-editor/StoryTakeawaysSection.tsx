'use client';

interface StoryTakeawaysSectionProps {
  leadParagraph: string;
  setLeadParagraph: (p: string) => void;
  bullet1: string;
  setBullet1: (b: string) => void;
  bullet2: string;
  setBullet2: (b: string) => void;
  bullet3: string;
  setBullet3: (b: string) => void;
}

export function StoryTakeawaysSection({
  leadParagraph,
  setLeadParagraph,
  bullet1,
  setBullet1,
  bullet2,
  setBullet2,
  bullet3,
  setBullet3,
}: StoryTakeawaysSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
          Lead Paragraph (Dispatch Body)
        </label>
        <textarea
          rows={4}
          value={leadParagraph}
          onChange={(e) => setLeadParagraph(e.target.value)}
          placeholder="Write the comprehensive opening dispatch and verified facts..."
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs leading-relaxed focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Key Takeaways */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
          Key Takeaways / Bullet Highlights
        </label>
        <div className="space-y-2">
          <input
            type="text"
            value={bullet1}
            onChange={(e) => setBullet1(e.target.value)}
            placeholder="• Primary breakthrough or core finding"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs"
          />
          <input
            type="text"
            value={bullet2}
            onChange={(e) => setBullet2(e.target.value)}
            placeholder="• Market or geopolitical impact"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs"
          />
          <input
            type="text"
            value={bullet3}
            onChange={(e) => setBullet3(e.target.value)}
            placeholder="• Next steps and upcoming timeline"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs"
          />
        </div>
      </div>
    </div>
  );
}
