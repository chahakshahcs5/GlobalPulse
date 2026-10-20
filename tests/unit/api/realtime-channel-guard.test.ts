import { describe, it, expect } from 'vitest';
import { RealtimeChannelGuard } from '../../../apps/api/src/modules/realtime/realtime.controller';
import { AuthService } from '@ai-news/auth';

/**
 * Unit tests for the Realtime SSE channel authorization guard.
 *
 * The guard protects restricted channels (editorial, newsroom, internal, admin,
 * drafts) and per-organization channels (org_*) from unauthenticated /
 * unauthorized subscribers, and resolves principals from Bearer headers,
 * `gp_token` cookies, or `?token=` query strings.
 */
describe('RealtimeChannelGuard — SSE channel authorization', () => {
  const guard = new RealtimeChannelGuard();

  function makeContext(query: Record<string, string | undefined> = {}, cookie?: string): never {
    const req = {
      query,
      headers: { cookie },
    };
    return {
      switchToHttp: () => ({ getRequest: () => req }),
    } as never;
  }

  const adminToken = AuthService.generateToken({
    id: 'usr_admin_marcus',
    organizationId: 'org_default',
    role: 'admin',
    clientType: 'human_web',
    scopes: ['news:read', 'news:write', 'news:admin'],
  });

  const editorToken = AuthService.generateToken({
    id: 'usr_editor_elena',
    organizationId: 'org_default',
    role: 'editor',
    clientType: 'human_web',
    scopes: ['news:read', 'news:write'],
  });

  const readerToken = AuthService.generateToken({
    id: 'usr_reader_raj',
    organizationId: 'org_default',
    role: 'reader',
    clientType: 'human_mobile',
    scopes: ['news:read'],
  });

  const rivalToken = AuthService.generateToken({
    id: 'usr_rival',
    organizationId: 'org_other_tenant',
    role: 'reader',
    clientType: 'human_web',
    scopes: ['news:read'],
  });

  it('allows anonymous subscribers on public channels', () => {
    expect(guard.canActivate(makeContext({ channels: 'all' }))).toBe(true);
    expect(guard.canActivate(makeContext({ channels: 'public,breaking_news,stories' }))).toBe(true);
    expect(guard.canActivate(makeContext({}))).toBe(true); // defaults to public channels
  });

  it('rejects anonymous subscribers on restricted channels', () => {
    expect(() => guard.canActivate(makeContext({ channels: 'editorial' }))).toThrowError(
      /Authentication required for restricted channel/
    );
    expect(() => guard.canActivate(makeContext({ channels: 'admin' }))).toThrowError(
      /Authentication required/
    );
    expect(() => guard.canActivate(makeContext({ channels: 'newsroom' }))).toThrowError(
      /Authentication required/
    );
  });

  it('rejects anonymous subscribers on per-organization channels', () => {
    expect(() => guard.canActivate(makeContext({ channels: 'org_default' }))).toThrowError(
      /Authentication required for restricted channel/
    );
  });

  it('enforces channel matching case-insensitively', () => {
    expect(() => guard.canActivate(makeContext({ channels: 'EDITORIAL' }))).toThrowError(
      /Authentication required/
    );
  });

  it('allows admins and editors (news:write scope) on restricted editorial channels', () => {
    expect(guard.canActivate(makeContext({ channels: 'editorial', token: adminToken }))).toBe(true);
    expect(guard.canActivate(makeContext({ channels: 'editorial', token: editorToken }))).toBe(
      true
    );
  });

  it('rejects readers on restricted channels', () => {
    expect(() =>
      guard.canActivate(makeContext({ channels: 'editorial', token: readerToken }))
    ).toThrowError(/Insufficient privileges to subscribe to channel/);
  });

  it('allows subscribers on their own organization channel but rejects foreign tenants', () => {
    expect(guard.canActivate(makeContext({ channels: 'org_default', token: readerToken }))).toBe(
      true
    );
    expect(() =>
      guard.canActivate(makeContext({ channels: 'org_default', token: rivalToken }))
    ).toThrowError(/Access denied to tenant channel/);
  });

  it('allows admins on foreign organization channels', () => {
    expect(
      guard.canActivate(makeContext({ channels: 'org_other_tenant', token: adminToken }))
    ).toBe(true);
  });

  it('resolves principals from the ?token= query parameter using dev tokens', () => {
    expect(guard.canActivate(makeContext({ channels: 'editorial', token: 'dev-admin' }))).toBe(
      true
    );
    expect(() =>
      guard.canActivate(makeContext({ channels: 'editorial', token: 'dev-reader' }))
    ).toThrowError(/Insufficient privileges/);
  });

  it('resolves principals from a gp_token cookie', () => {
    const ctx = makeContext({ channels: 'admin' }, 'gp_token=dev-admin; other=1');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows multiple channels when the most restricted one is authorized', () => {
    expect(guard.canActivate(makeContext({ channels: 'all,editorial', token: adminToken }))).toBe(
      true
    );
    expect(() =>
      guard.canActivate(makeContext({ channels: 'all,editorial', token: readerToken }))
    ).toThrowError(/Insufficient privileges/);
  });
});
