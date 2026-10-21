import { describe, it, expect } from 'vitest';
import {
  QuizBlockSchema,
  StoryBlockSchema,
  getBlockDefinition,
  listBlockTypes,
} from '@ai-news/schemas';
import { extractTextContent } from '@ai-news/content';

const base = { id: 'blk_quiz_test', sortOrder: 0 };

const validData = {
  title: 'Test your understanding',
  description: 'Three questions on what the report actually found.',
  questions: [
    {
      id: 'q1',
      question: 'What did the study measure?',
      options: [
        { id: 'a', text: 'Training cost only', correct: false },
        { id: 'b', text: 'Inference cost across three model sizes', correct: true },
      ],
      explanation: 'The report covers inference cost at 7B, 13B and 70B parameters.',
      sourceId: 'src_study',
    },
    {
      id: 'q2',
      question: 'Over what period were costs measured?',
      options: [
        { id: 'a', text: 'One week', correct: false },
        { id: 'b', text: 'Six months', correct: true },
        { id: 'c', text: 'Two years', correct: false },
      ],
    },
  ],
  showScore: true,
  allowRetry: true,
};

describe('Quiz block', () => {
  it('validates questions with options and a correct answer', () => {
    const block = QuizBlockSchema.parse({
      ...base,
      blockType: 'quiz',
      data: validData,
    });

    expect(block.data.questions).toHaveLength(2);
    expect(block.data.questions[0].options[1].correct).toBe(true);
  });

  it('is part of the story block union', () => {
    const parsed = StoryBlockSchema.parse({
      ...base,
      blockType: 'quiz',
      data: validData,
    });
    expect(parsed.blockType).toBe('quiz');
  });

  it('rejects a question with fewer than two options', () => {
    expect(() =>
      QuizBlockSchema.parse({
        ...base,
        blockType: 'quiz',
        data: {
          ...validData,
          questions: [
            {
              id: 'q1',
              question: 'Only one choice?',
              options: [{ id: 'a', text: 'Yes', correct: true }],
            },
          ],
        },
      })
    ).toThrow();
  });

  it('rejects a block with no questions', () => {
    expect(() =>
      QuizBlockSchema.parse({
        ...base,
        blockType: 'quiz',
        data: { ...validData, questions: [] },
      })
    ).toThrow();
  });

  it('is registered as an interactive block', () => {
    expect(listBlockTypes()).toContain('quiz');
    const definition = getBlockDefinition('quiz');
    expect(definition?.category).toBe('interactive');
    expect(definition?.example).toBeDefined();
  });

  it('contributes its questions and explanations to the extracted article body', () => {
    const text = extractTextContent([{ ...base, blockType: 'quiz', data: validData } as never]);

    expect(text).toContain('Test your understanding');
    expect(text).toContain('What did the study measure?');
    expect(text).toContain('Inference cost across three model sizes');
    expect(text).toContain('The report covers inference cost at 7B, 13B and 70B parameters.');
  });
});
