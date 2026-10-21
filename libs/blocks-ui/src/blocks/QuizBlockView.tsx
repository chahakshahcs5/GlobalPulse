'use client';

import React from 'react';
import type { QuizBlock } from '@ai-news/schemas';

/**
 * Knowledge check.
 *
 * Every answer reveals why it is right or wrong, so the quiz teaches rather
 * than just scores. The reader's answers are kept in their own browser —
 * unlike a poll, a knowledge check is about the reader, not about the
 * readership as a whole.
 */
export const QuizBlockView: React.FC<{ data: QuizBlock['data'] }> = ({ data }) => {
  const storageKey = `globalpulse_quiz_${data.title.replace(/\W+/g, '_').toLowerCase()}`;

  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [finished, setFinished] = React.useState(false);

  // Restore a previous attempt so a reader who comes back does not lose it.
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { answers?: Record<string, string> };
      if (parsed?.answers && Object.keys(parsed.answers).length > 0) {
        setAnswers(parsed.answers);
        setFinished(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, [storageKey]);

  const persist = (next: Record<string, string>) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ answers: next }));
    } catch {
      // ignore
    }
  };

  const answer = (questionId: string, optionId: string) => {
    if (finished) return;
    const next = { ...answers, [questionId]: optionId };
    setAnswers(next);
    persist(next);
  };

  const allAnswered = data.questions.every((q) => answers[q.id] !== undefined);

  const score = data.questions.reduce((total, question) => {
    const chosen = answers[question.id];
    if (!chosen) return total;
    const option = question.options.find((o) => o.id === chosen);
    return option?.correct ? total + 1 : total;
  }, 0);

  const restart = () => {
    setAnswers({});
    setFinished(false);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  return (
    <section
      aria-label={data.title}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        {data.description && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{data.description}</p>
        )}
      </header>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {data.questions.map((question, questionIndex) => {
          const chosen = answers[question.id];
          const isAnswered = chosen !== undefined;

          return (
            <div key={question.id} className="px-5 py-4">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  {questionIndex + 1}
                </span>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                  {question.question}
                </h4>
              </div>

              <div className="mt-3 space-y-2 pl-8">
                {question.options.map((option) => {
                  const isChosen = chosen === option.id;
                  // Once answered, the correct option is always shown, so the
                  // reader learns the answer rather than just their score.
                  const showAsCorrect = isAnswered && option.correct;
                  const showAsWrong = isAnswered && isChosen && !option.correct;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => answer(question.id, option.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors disabled:cursor-default ${
                        showAsCorrect
                          ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                          : showAsWrong
                            ? 'border-rose-300 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 text-rose-900 dark:text-rose-200'
                            : isChosen
                              ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500/40 dark:bg-indigo-500/10'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                      }`}
                    >
                      <span className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0">
                          {showAsCorrect ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              ✓
                            </span>
                          ) : showAsWrong ? (
                            <span className="text-rose-500 font-bold">✕</span>
                          ) : isChosen ? (
                            <span className="text-indigo-600 dark:text-indigo-400">●</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">○</span>
                          )}
                        </span>
                        <span className="font-medium">{option.text}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {isAnswered && question.explanation && (
                <p className="mt-2.5 pl-8 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {question.explanation}
                  {question.sourceId && (
                    <span className="ml-1 font-mono text-[10px] text-slate-400">
                      Source: {question.sourceId}
                    </span>
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {(finished || allAnswered) && data.showScore && (
        <footer className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              You scored {score} of {data.questions.length}
              {score === data.questions.length
                ? ' — a clean sweep.'
                : score >= data.questions.length / 2
                  ? '.'
                  : ' — worth another look at the story.'}
            </p>
            {data.allowRetry && (
              <button
                type="button"
                onClick={restart}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Try again
              </button>
            )}
          </div>
        </footer>
      )}

      {(data.methodology || data.sourceAttribution) && (
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
          {data.methodology && <p>{data.methodology}</p>}
          {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
        </div>
      )}
    </section>
  );
};
