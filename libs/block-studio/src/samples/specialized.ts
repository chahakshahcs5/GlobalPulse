/**
 * Sample payloads for the specialized blocks.
 *
 * Each entry is a named, ready-made treatment of one block type. They are
 * deliberately realistic: a chart that says "cases" and "year" tells an
 * editor far more about how the block reads in a story than
 * "Category 1 / 42" does.
 *
 * Every variant is validated against its block's schema by
 * `tests/unit/blocks/block-studio-samples.test.ts`, so a sample can never
 * drift away from the block it demonstrates.
 */
import type { StudioVariant } from '../types';

export const SPECIALIZED_SAMPLES: Record<string, StudioVariant[]> = {
  interview: [
    {
      id: 'interview',
      label: 'Interview',
      description: 'Structured Q&A with a transcript.',
      data: {
        title: 'An interview with the review director',
        interviewee: {
          name: 'Ada Okafor',
          role: 'Director, Independent Grid Review',
          entityId: 'ent_ada_okafor',
        },
        format: 'text',
        mediaUrl: '/audio/sample-briefing.mp3',
        transcript: 'A full transcript of the interview is available on request.',
        segments: [
          {
            question: 'When did you first suspect the numbers were wrong?',
            answer:
              'A site analyst asked for a verification step and was told none existed. That was the moment.',
            speaker: 'Interviewer',
            timestampSeconds: 12,
          },
          {
            question: 'Was the overstatement deliberate?',
            answer:
              'We found no evidence of intent. What we found was a guidance document that made the check optional.',
            speaker: 'Ada Okafor',
            timestampSeconds: 48,
            sourceId: 'src_review_report',
          },
          {
            question: 'What changes now?',
            answer:
              'A mandatory second sign-off, and quarterly publication so the public can check for themselves.',
            speaker: 'Ada Okafor',
            timestampSeconds: 91,
          },
        ],
        sourceAttribution: 'GlobalPulse interviews',
      },
    },
  ],
};
