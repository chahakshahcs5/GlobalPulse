/**
 * The product's session.
 *
 * There is one session for the whole product, and the API owns it. Signing in
 * anywhere — the web portal, the Block Studio — sets the API's `gp_token`
 * cookie, and every app on the host then sends it with its requests. So a
 * sign-in in one app is a sign-in in all of them, and there is no second set
 * of credentials, token field or login form anywhere else in the product.
 *
 * The cookie is `HttpOnly`, so script cannot read it. That is deliberate: it
 * is why the session state is read from the API (`getCurrentUser`) rather
 * than sniffed out of the cookie in the browser.
 */

import { ApiError, request, setAuthToken } from './core';

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  token: string;
}

/**
 * Sign in.
 *
 * The API answers with the token and sets the session cookie on the way
 * through. The token is also kept in `sessionStorage` so that a request made
 * before the cookie has been stored — or made from a server, where cookies
 * do not exist — still carries the identity.
 */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const result = await request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  setAuthToken(result.token);
  return result;
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const result = await request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });

  setAuthToken(result.token);
  return result;
}

/**
 * Who is signed in?
 *
 * The API is the only honest answer — the cookie cannot be read from script,
 * and a token kept in one tab says nothing about the others. `null` means
 * there is no session, which is not an error.
 */
export async function getCurrentUser(): Promise<AuthResponse['user'] | null> {
  try {
    const user = await request<AuthResponse['user']>('/api/auth/me');
    return user ?? null;
  } catch (cause) {
    if (cause instanceof ApiError && (cause.status === 401 || cause.status === 403)) {
      return null;
    }
    // A network failure is not the same as "no session", but the caller
    // cannot tell the difference either, and treating it as signed out is
    // the safe answer.
    return null;
  }
}

/** Sign out, and end the session for every app on the host. */
export async function logoutUser(): Promise<void> {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } finally {
    setAuthToken(null);
  }
}
