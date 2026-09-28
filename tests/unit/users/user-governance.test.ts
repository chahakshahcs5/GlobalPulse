import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@ai-news/database';
import { UserService } from '@ai-news/stories';

describe('Newsroom User & Role Governance (Unit Tests)', () => {
  let db: DatabaseService;
  let userService: UserService;

  beforeEach(() => {
    db = new DatabaseService({ memory: true });
    userService = new UserService(db);
  });

  it('lists pre-seeded newsroom staff and active AI agents', async () => {
    const users = await userService.listUsers('org_default');
    expect(users.length).toBeGreaterThanOrEqual(5);

    const roles = users.map((u) => u.role);
    expect(roles).toContain('admin');
    expect(roles).toContain('editor');
    expect(roles).toContain('journalist');
    expect(roles).toContain('ai_agent');
  });

  it('allows an administrator to reassign and update user roles', async () => {
    const updated = await userService.assignRole('usr_journalist_1', 'editor', {
      organizationId: 'org_default',
      authorId: 'usr_admin',
      clientType: 'human_web',
    });

    expect(updated.id).toBe('usr_journalist_1');
    expect(updated.role).toBe('editor');

    const fetched = await userService.getUser('usr_journalist_1', 'org_default');
    expect(fetched.role).toBe('editor');
  });

  it('invites a new staff member and prevents duplicate email registration', async () => {
    const invited = await userService.inviteUser(
      {
        name: 'David Mitchell',
        email: 'david.mitchell@news.platform',
        role: 'journalist',
        clientType: 'human_web',
        bio: 'Investigative climate reporter.',
      },
      {
        organizationId: 'org_default',
        authorId: 'usr_admin',
        clientType: 'human_web',
      }
    );

    expect(invited.id).toBeDefined();
    expect(invited.email).toBe('david.mitchell@news.platform');
    expect(invited.status).toBe('invited');

    // Attempt duplicate invite
    await expect(
      userService.inviteUser(
        {
          name: 'David Mitchell',
          email: 'david.mitchell@news.platform',
          role: 'journalist',
          clientType: 'human_web',
        },
        {
          organizationId: 'org_default',
          authorId: 'usr_admin',
          clientType: 'human_web',
        }
      )
    ).rejects.toThrow(/already exists/i);
  });
});
