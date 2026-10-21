/**
 * The session cookie.
 *
 * One cookie, one session, for the whole product.
 *
 * The web portal, the Block Studio and the API are the same product. A
 * sign-in in any of them has to be a sign-in in all of them, so the session
 * travels in a cookie rather than in a token that each app keeps to itself.
 *
 * Two details make that work:
 *
 *  - The cookie is `HttpOnly`, so script cannot read it. Nothing in the
 *    browser can steal the session by reading a variable; the apps ask the
 *    API who they are talking to instead.
 *
 *  - The cookie is scoped to the host, and not to the port, so the portal
 *    and the studio — the same product, served on two ports in development
 *    — are the same session. When they are deployed on sibling hosts, set
 *    `COOKIE_DOMAIN` to the shared parent domain (`.example.com`) and the
 *    session follows them there too.
 */

const SEVEN_DAYS = 7 * 24 * 3600;

/**
 * The cookie that carries the session.
 *
 * `maxAge` of zero clears it, which is how a sign-out is expressed.
 */
export function sessionCookie(token: string, maxAge: number = SEVEN_DAYS): string {
  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd ? '; Secure' : '';

  // The domain is only stated when it has been configured. Leaving it out
  // makes the cookie host-only, which is the right default: the session
  // should not reach a host it was not given to.
  const domain = process.env.COOKIE_DOMAIN ? `; Domain=${process.env.COOKIE_DOMAIN}` : '';

  const parts = [
    `gp_token=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    domain,
    secure,
  ];

  return parts.filter(Boolean).join('; ');
}
