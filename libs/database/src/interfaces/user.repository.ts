import type { NewsroomUser } from '@ai-news/schemas';

export interface FollowRecord {
  userId: string;
  targetType: 'topic' | 'entity' | 'author' | 'source';
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
    targetType: 'topic' | 'entity' | 'author' | 'source',
    targetId: string
  ): Promise<FollowRecord>;
  unfollowTarget(
    userId: string,
    targetType: 'topic' | 'entity' | 'author' | 'source',
    targetId: string
  ): Promise<boolean>;
  listFollowing(
    userId: string,
    targetType?: 'topic' | 'entity' | 'author' | 'source'
  ): Promise<FollowRecord[]>;
  isFollowing(
    userId: string,
    targetType: 'topic' | 'entity' | 'author' | 'source',
    targetId: string
  ): Promise<boolean>;
}
