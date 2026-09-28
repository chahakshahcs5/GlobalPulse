import type { NewsroomUser } from '@ai-news/schemas';

export interface IUserRepository {
  findById(id: string, orgId?: string): Promise<NewsroomUser | null>;
  findByEmail(email: string, orgId?: string): Promise<NewsroomUser | null>;
  list(orgId?: string): Promise<NewsroomUser[]>;
  create(user: NewsroomUser): Promise<NewsroomUser>;
  update(user: NewsroomUser): Promise<NewsroomUser>;
  delete(id: string, orgId?: string): Promise<boolean>;
}
