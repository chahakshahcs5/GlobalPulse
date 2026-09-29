import { z } from 'zod';
import { ClientTypeSchema } from './story';

export const UserRoleSchema = z.enum(['admin', 'editor', 'journalist', 'reader', 'ai_agent']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(['active', 'invited', 'suspended']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const DepthPreferenceSchema = z.enum(['quick', 'balanced', 'deep_dive']);
export type DepthPreference = z.infer<typeof DepthPreferenceSchema>;

export const AlgorithmTuningSchema = z.object({
  depthPreference: DepthPreferenceSchema.default('balanced'),
  serendipityWeight: z.number().min(0).max(100).default(30),
  localVsGlobalWeight: z.number().min(0).max(100).default(50),
  editorialStrictness: z.number().min(0).max(100).default(70),
});
export type AlgorithmTuning = z.infer<typeof AlgorithmTuningSchema>;

export const AttributionSignalTypeSchema = z.enum([
  'followed_topic',
  'category_affinity',
  'entity_interest',
  'followed_author',
  'serendipity_discovery',
  'breaking_urgency',
  'reading_depth',
  'resume_reading',
]);
export type AttributionSignalType = z.infer<typeof AttributionSignalTypeSchema>;

export const AttributionSignalSchema = z.object({
  type: AttributionSignalTypeSchema,
  target: z.string(),
  contribution: z.number().nonnegative(),
  explanation: z.string(),
});
export type AttributionSignal = z.infer<typeof AttributionSignalSchema>;

export const ReaderConsumptionProfileSchema = z.object({
  userId: z.string(),
  totalReadingMinutes: z.number().nonnegative(),
  storiesReadCount: z.number().int().nonnegative(),
  categoryDistribution: z.record(z.number()),
  topicDistribution: z.record(z.number()),
  diversityScore: z.number().min(0).max(100),
  depthHabit: DepthPreferenceSchema,
});
export type ReaderConsumptionProfile = z.infer<typeof ReaderConsumptionProfileSchema>;

export const UserPreferencesSchema = z.object({
  categories: z.array(z.string()).default([]),
  emailFrequency: z.enum(['none', 'daily', 'weekly']).default('daily'),
  readingHistoryEnabled: z.boolean().default(true),
  theme: z.enum(['system', 'light', 'dark']).default('system'),
  depthPreference: DepthPreferenceSchema.optional(),
  serendipityWeight: z.number().min(0).max(100).optional(),
  localVsGlobalWeight: z.number().min(0).max(100).optional(),
  editorialStrictness: z.number().min(0).max(100).optional(),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const NewsroomUserSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  role: UserRoleSchema,
  clientType: ClientTypeSchema,
  status: UserStatusSchema,
  passwordHash: z.string().optional(),
  preferences: UserPreferencesSchema.optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type NewsroomUser = z.infer<typeof NewsroomUserSchema>;

export const RegisterUserInputSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organizationId: z.string().default('org_default'),
});
export type RegisterUserInput = z.infer<typeof RegisterUserInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  organizationId: z.string().default('org_default'),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const UpdatePreferencesInputSchema = z.object({
  categories: z.array(z.string()).optional(),
  emailFrequency: z.enum(['none', 'daily', 'weekly']).optional(),
  readingHistoryEnabled: z.boolean().optional(),
  theme: z.enum(['system', 'light', 'dark']).optional(),
  depthPreference: DepthPreferenceSchema.optional(),
  serendipityWeight: z.number().min(0).max(100).optional(),
  localVsGlobalWeight: z.number().min(0).max(100).optional(),
  editorialStrictness: z.number().min(0).max(100).optional(),
});
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesInputSchema>;

export const FollowTargetTypeSchema = z.enum(['topic', 'entity', 'author']);
export type FollowTargetType = z.infer<typeof FollowTargetTypeSchema>;

export const FollowTargetInputSchema = z.object({
  targetType: FollowTargetTypeSchema,
  targetId: z.string().min(1),
});
export type FollowTargetInput = z.infer<typeof FollowTargetInputSchema>;

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
