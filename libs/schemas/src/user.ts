import { z } from 'zod';
import { ClientTypeSchema } from './story';

export const UserRoleSchema = z.enum(['admin', 'editor', 'journalist', 'reader', 'ai_agent']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(['active', 'invited', 'suspended']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const NewsroomUserSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  role: UserRoleSchema,
  clientType: ClientTypeSchema,
  status: UserStatusSchema,
  avatarUrl: z.string().url().optional(),
  bio: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type NewsroomUser = z.infer<typeof NewsroomUserSchema>;

export const AssignUserRoleInputSchema = z.object({
  userId: z.string().min(1),
  role: UserRoleSchema,
});
export type AssignUserRoleInput = z.infer<typeof AssignUserRoleInputSchema>;

export const InviteUserInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: UserRoleSchema.default('journalist'),
  clientType: ClientTypeSchema.default('human_web'),
  bio: z.string().optional(),
});
export type InviteUserInput = z.infer<typeof InviteUserInputSchema>;
