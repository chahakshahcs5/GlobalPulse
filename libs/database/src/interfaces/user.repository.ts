import type { NewsroomUser, FollowTargetType } from '@ai-news/schemas';

export interface FollowRecord {
  userId: string;
  targetType: FollowTargetType;
  targetId: string;
  createdAt: string;
}

export interface IUserRepository {
  findById(id: string, orgId?: string): Promise<NewsroomUser | null>;
  findByEmail(email: string, orgId?: string): Promise<NewsroomUser | null>;
  list(orgId?: string): Promise<NewsroomUser[]>;
  create(user: NewsroomUser): Promise<NewsroomUser>;
  update(user: NewsroomUser): Promise<NewsroomUser>;
  delete(id: string, orgId?: string): Promise<boolean>;

  // Following interests (F17)
  followTarget(
    userId: string,
    targetType: FollowTargetType,
    targetId: string
  ): Promise<FollowRecord>;
  unfollowTarget(userId: string, targetType: FollowTargetType, targetId: string): Promise<boolean>;
  listFollowing(userId: string, targetType?: FollowTargetType): Promise<FollowRecord[]>;
  /** Reverse lookup: everyone following a given target. */
  listFollowers(targetType: FollowTargetType, targetId: string): Promise<FollowRecord[]>;
  isFollowing(userId: string, targetType: FollowTargetType, targetId: string): Promise<boolean>;
}
