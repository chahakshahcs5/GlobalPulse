import { z } from 'zod';

export const CommentStatusSchema = z.enum(['pending', 'approved', 'flagged', 'hidden']);
export type CommentStatus = z.infer<typeof CommentStatusSchema>;

export const CommentAuthorRoleSchema = z.enum([
  'reader',
  'subscriber',
  'journalist',
  'editor',
  'ai_agent',
]);
export type CommentAuthorRole = z.infer<typeof CommentAuthorRoleSchema>;

export const CommentSchema = z.object({
  id: z.string().min(1),
  storyId: z.string().min(1),
  organizationId: z.string().min(1),
  authorId: z.string().min(1),
  authorName: z.string().min(1).max(100),
  authorRole: CommentAuthorRoleSchema.default('reader'),
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
  status: CommentStatusSchema.default('approved'),
  likesCount: z.number().int().nonnegative().default(0),
  moderationReason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Comment = z.infer<typeof CommentSchema>;

export const CreateCommentInputSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment exceeds 2000 characters'),
  authorName: z.string().min(1).max(100).optional(),
  parentId: z.string().optional(),
});
export type CreateCommentInput = z.infer<typeof CreateCommentInputSchema>;

export const ModerateCommentInputSchema = z.object({
  status: CommentStatusSchema,
  reason: z.string().max(500).optional(),
});
export type ModerateCommentInput = z.infer<typeof ModerateCommentInputSchema>;

export const StoryReactionTypeSchema = z.enum(['like', 'insightful', 'important', 'heart']);
export type StoryReactionType = z.infer<typeof StoryReactionTypeSchema>;

export const StoryReactionSchema = z.object({
  id: z.string().min(1),
  storyId: z.string().min(1),
  userId: z.string().min(1),
  organizationId: z.string().min(1),
  reactionType: StoryReactionTypeSchema,
  createdAt: z.string(),
});
export type StoryReaction = z.infer<typeof StoryReactionSchema>;

export const StoryReactionsSummarySchema = z.object({
  storyId: z.string(),
  counts: z.record(z.string(), z.number()),
  userReactions: z.array(StoryReactionTypeSchema).default([]),
});
export type StoryReactionsSummary = z.infer<typeof StoryReactionsSummarySchema>;

export const BookmarkItemSchema = z.object({
  id: z.string().min(1),
  storyId: z.string().min(1),
  userId: z.string().min(1),
  organizationId: z.string().min(1),
  createdAt: z.string(),
});
export type BookmarkItem = z.infer<typeof BookmarkItemSchema>;
