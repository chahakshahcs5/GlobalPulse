# Security Architecture & Threat Mitigations (Section 136 Compliance)

This document details the security posture, threat modeling, tenant isolation, rate limiting, SSRF defense, and prompt injection mitigations of the **GlobalPulse** platform.

---

## 1. Threat Matrix & Mitigations

| Threat Category                        | Potential Attack Vector                                                 | Applied Mitigation                                                                                                                                                                                                                         |
| :------------------------------------- | :---------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prompt Injection**                   | Attacker injects malicious instruction inside news draft payload        | **Application Decoupling**: The server never feeds story body text into LLM prompts. Blocks are strictly stored, indexed, and sanitized as structured data.                                                                                |
| **SSRF (Server-Side Request Forgery)** | Malicious source URL (e.g. `http://169.254.169.254/latest/meta-data`)   | **URL Validation Gate**: Only `http:`/`https:` is accepted; private IPv4 ranges, link-local, loopback, and DNS answers that resolve to them are blocked. Redirects are re-validated hop by hop.                                            |
| **Unauthenticated Ingestion**          | Spoofed dispatches submitted by untrusted actors                        | **OAuth 2.1 Mutual Auth**: Mandatory JWT verification with PKCE (S256). Every story version requires valid `client_id` attribution.                                                                                                        |
| **Malicious File Uploads**             | Executable scripts disguised as media assets                            | **Magic-byte inspection**: Inline uploads are sniffed before storage; the declared MIME type must match the file signature (PNG, JPEG, WebP, GIF, AVIF, MP4, MP3, WAV, PDF). Mismatches are rejected with `400`.                           |
| **Paywall Bypass**                     | Clearing storage or calling the API directly to read premium stories    | **Server-side entitlement**: `User.isSubscriber` and monthly reads live in the database. Locked story blocks are removed from API responses, and only a signed billing webhook can change entitlement.                                     |
| **Denial of Service (DoS)**            | Automated bots spamming `create_story` or search                        | **Token Bucket Rate Limiting**: 100 requests/minute per authenticated principal, or per connection IP when unauthenticated. The raw Authorization header is never used as a bucket key.                                                    |
| **Tenant Data Bleed**                  | Organization A inspecting unpublished drafts of Organization B          | **Multi-Tenancy Scoping**: Tenant-scoped repository calls require an `organizationId`; public feeds are pinned to `DEFAULT_ORG_ID`. Cross-tenant retrieval throws `NotFoundError`.                                                         |
| **Session Theft**                      | Script on the page reading the session out of a cookie or a storage key | **`HttpOnly` Session Cookie**: The session is carried by the API's `gp_token` cookie, which script cannot read. The token the client keeps in `sessionStorage` is per-tab and per-origin, and it is never written to a cookie from script. |

### Entitlement and authorization codes

- **Paywall**: `GET /api/paywall/access/:storyId` returns the server's decision;
  `POST /api/paywall/read/:storyId` meters a free read. Story list and detail
  responses redact blocks when the reader is not entitled. `User.isSubscriber`
  is changed only by the signed `POST /api/billing/webhook` event or by an
  administrator with `news:admin`.
- **OAuth codes**: authorization codes are single-use and short-lived. When
  `REDIS_URL` is configured they live in Redis (`PX` TTL, atomic `GETDEL`), so
  a code issued by one API replica can be exchanged by another. If Redis is
  unreachable the store falls back to process memory instead of failing the
  token endpoint; the memory store is only safe for a single replica.
- **Collections**: `StoryCollection` carries `organizationId`; list, slug,
  curator and mutation lookups all require the caller's organization.

---

## 1.1 One session for the whole product

The web portal, the Block Studio and the API are one product, and they
share one session. That is a deliberate design choice, and it has a security
consequence worth writing down.

The session lives in the `gp_token` cookie the API sets:

- **`HttpOnly`** — script cannot read it. The apps therefore ask the API who
  the user is (`GET /api/auth/me`) rather than sniffing the session out of
  the browser, and nothing in the client writes the cookie from script.
  Writing it from script would replace the `HttpOnly` cookie with a
  readable one and take the protection with it, while gaining nothing: the
  browser sends the cookie either way.

- **Scoped to the host, not the port** — this is what lets the session
  cross between the portal and the studio, which are the same product on
  the same machine. When they are deployed on sibling hosts, `COOKIE_DOMAIN`
  states the shared parent domain so the session follows the editor between
  them. It is unset by default, so the cookie stays host-only unless a
  deployment deliberately widens it.

- **`SameSite=Lax`, and `Secure` in production** — the cookie is not sent
  on cross-site requests, and it is not sent over plain HTTP in production.

The bearer token the client keeps in `sessionStorage` covers the cases a
cookie cannot: a request made from a server, and the moment between signing
in and the cookie being stored. It is per-tab, it never leaves the origin,
and it is cleared when the tab closes.

---

## 2. Prompt Injection Defense

Because **"The Application is NOT the AI"**, GlobalPulse has structural immunity against classic prompt injection vulnerabilities:

- The backend does **not** take user comments or incoming web wires and feed them into internal LLM completion prompts.
- Text content is treated as untrusted data strings, escaped at render time, and compiled into typed React components. Code-bearing blocks run in an opaque-origin sandboxed iframe.

---

## 3. Immutable Compliance Audit Logging

Every mutation originating from an external AI agent or human editor triggers an immutable audit log entry:

```typescript
export interface AuditRecord {
  id: string;
  organizationId: string;
  action:
    | 'STORY_CREATED'
    | 'VERSION_SNAPSHOT'
    | 'STORY_PUBLISHED'
    | 'STORY_RETRACTED'
    | 'SOURCE_ATTACHED';
  entityType: string;
  entityId: string;
  actorId: string;
  clientType: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
```

Audit entries are append-only. No user, agent, or administrator can edit or delete historical audit log records.
