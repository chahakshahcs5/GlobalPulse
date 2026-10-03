import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../../apps/api/src/server';
import { db } from '@ai-news/database';

describe('End-to-End Authentication & Cookie Session Flow', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
    db.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  let registeredToken: string;
  let sessionCookie: string;
  const testUser = {
    name: 'Jane Journalist',
    email: 'jane.journalist@globalpulse.news',
    password: 'SecurePassword2026!',
    organizationId: 'org_default',
  };

  it('registers a new user, hashes password, and issues JWT with secure session cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: testUser,
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(testUser.email.toLowerCase());
    expect(body.user.passwordHash).toBeUndefined(); // ensure password hash is never leaked
    expect(body.token).toBeDefined();

    registeredToken = body.token;

    // Verify Set-Cookie header is issued
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookieStr = Array.isArray(setCookie) ? setCookie[0] : (setCookie as string);
    expect(cookieStr).toContain('gp_token=');
    expect(cookieStr).toContain('HttpOnly');

    // Extract cookie for subsequent session requests
    sessionCookie = cookieStr.split(';')[0];
  });

  it('rejects duplicate registration with 409 Conflict', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: testUser,
    });

    expect(res.statusCode).toBe(409);
  });

  it('authenticates user on login with correct password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: testUser.email,
        password: testUser.password,
        organizationId: 'org_default',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.token).toBeDefined();
    expect(body.user.name).toBe(testUser.name);
  });

  it('rejects login with incorrect password with 401 Unauthorized', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: testUser.email,
        password: 'WrongPassword!',
        organizationId: 'org_default',
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it('authenticates protected profile endpoint using Bearer token header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: `Bearer ${registeredToken}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.email).toBe(testUser.email.toLowerCase());
    expect(body.stats).toBeDefined();
  });

  it('authenticates protected profile endpoint using browser session cookie without Authorization header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        cookie: sessionCookie,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.email).toBe(testUser.email.toLowerCase());
  });

  it('updates and persists user preferences', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/auth/preferences',
      headers: {
        cookie: sessionCookie,
      },
      payload: {
        categories: ['technology', 'science'],
        emailFrequency: 'weekly',
        theme: 'dark',
      },
    });

    expect(res.statusCode).toBe(200);
    const updated = JSON.parse(res.body);
    expect(updated.preferences?.theme).toBe('dark');
    expect(updated.preferences?.emailFrequency).toBe('weekly');
    expect(updated.preferences?.categories).toContain('technology');
  });

  it('clears session cookie on logout', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: {
        cookie: sessionCookie,
      },
    });

    expect(res.statusCode).toBe(200);
    const setCookie = res.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookie) ? setCookie[0] : (setCookie as string);
    expect(cookieStr).toContain('Max-Age=0');
  });
});
