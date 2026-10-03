'use client';

interface StoryAudioBarProps {
  isSpeaking: boolean;
  audioRate: number;
  changeAudioSpeed: (rate: number) => void;
}

export function StoryAudioBar({ isSpeaking, audioRate, changeAudioSpeed }: StoryAudioBarProps) {
  if (!isSpeaking) return null;

  return (
    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-1">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
        <span className="font-bold text-blue-700 dark:text-blue-300">Audio Briefing Playing:</span>
        <span className="text-slate-600 dark:text-slate-300">Neural Newsroom Anchor (English)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-slate-400 text-[11px] font-medium mr-1">Speed:</span>
        {[0.75, 1.0, 1.25, 1.5].map((rate) => (
          <button
            key={rate}
            onClick={() => changeAudioSpeed(rate)}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
              audioRate === rate
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            {rate}x
          </button>
        ))}
      </div>
    </div>
  );
}
