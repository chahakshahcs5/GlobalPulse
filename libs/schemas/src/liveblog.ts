import { z } from 'zod';

export const LiveblogAuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().optional(),
});
export type LiveblogAuthor = z.infer<typeof LiveblogAuthorSchema>;

export const LiveblogEntrySchema = z.object({
  id: z.string(),
  storyId: z.string(),
  headline: z.string().min(1),
  content: z.string().min(1),
  isKeyEvent: z.boolean().default(false),
  author: LiveblogAuthorSchema,
  timestamp: z.string(),
});
export type LiveblogEntry = z.infer<typeof LiveblogEntrySchema>;

export const CreateLiveblogEntryInputSchema = z.object({
  headline: z.string().min(1),
  content: z.string().min(1),
  isKeyEvent: z.boolean().optional().default(false),
});
export type CreateLiveblogEntryInput = z.infer<typeof CreateLiveblogEntryInputSchema>;
