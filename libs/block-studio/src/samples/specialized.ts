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
    {
      id: 'audio',
      label: 'An audio interview',
      description: 'An interview published as audio, with the recording attached.',
      data: {
        title: 'An interview with the review director',
        interviewee: {
          name: 'Ada Okafor',
          role: 'Director, Independent Grid Review',
          entityId: 'ent_ada_okafor',
        },
        format: 'audio',
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
    {
      id: 'video',
      label: 'A video interview',
      description: 'An interview published as video, with the film attached.',
      data: {
        title: 'An interview with the review director',
        interviewee: {
          name: 'Ada Okafor',
          role: 'Director, Independent Grid Review',
          entityId: 'ent_ada_okafor',
        },
        format: 'video',
        mediaUrl: '/videos/sample-video.mp4',
        transcript: 'A full transcript of the interview is available on request.',
        segments: [
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
    {
      id: 'with-sources',
      label: 'With sources on the answers',
      description: 'Each answer that rests on a document names it.',
      data: {
        title: 'An interview with the review director',
        interviewee: {
          name: 'Ada Okafor',
          role: 'Director, Independent Grid Review',
          entityId: 'ent_ada_okafor',
        },
        format: 'text',
        mediaUrl: '/audio/sample-briefing.mp3',
        segments: [
          {
            question: 'When did you first suspect the numbers were wrong?',
            answer:
              'A site analyst asked for a verification step and was told none existed. That was the moment.',
            speaker: 'Interviewer',
            timestampSeconds: 12,
            sourceId: 'src_review_report',
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
            sourceId: 'src_regulator_directive',
          },
        ],
        sourceAttribution: 'GlobalPulse interviews',
      },
    },
    {
      id: 'many-segments',
      label: 'Six questions',
      description: 'A longer interview, with the questions and answers together.',
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
            question: 'What did you expect to find?',
            answer: 'Honestly, a smaller number than we found, and a cause we could name.',
            speaker: 'Interviewer',
            timestampSeconds: 30,
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
            question: 'Which site surprised you most?',
            answer:
              'The one that signed every filing and still ran nearly twelve per cent high. Signing is not the same as reading.',
            speaker: 'Ada Okafor',
            timestampSeconds: 71,
          },
          {
            question: 'What did the operators say?',
            answer:
              'That the guidance was ambiguous. Looking back at paragraph 3.2, they were right.',
            speaker: 'Ada Okafor',
            timestampSeconds: 104,
            sourceId: 'src_operator_statement',
          },
          {
            question: 'What changes now?',
            answer:
              'A mandatory second sign-off, and quarterly publication so the public can check for themselves.',
            speaker: 'Ada Okafor',
            timestampSeconds: 131,
          },
        ],
        sourceAttribution: 'GlobalPulse interviews',
      },
    },
  ],
};
