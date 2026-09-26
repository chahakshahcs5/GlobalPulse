# Security Architecture & Threat Mitigations (Section 136 Compliance)

This document details the security posture, threat modeling, tenant isolation, rate limiting, SSRF defense, and prompt injection mitigations of the **GlobalPulse** platform.

---

## 1. Threat Matrix & Mitigations

| Threat Category | Potential Attack Vector | Applied Mitigation |
|:---|:---|:---|
| **Prompt Injection** | Attacker injects malicious instruction inside news draft payload | **Application Decoupling**: The server never feeds story body text into LLM prompts. Blocks are strictly stored, indexed, and sanitized as structured data. |
| **SSRF (Server-Side Request Forgery)** | Malicious source URL (e.g. `http://169.254.169.254/latest/meta-data`) | **URL Validation Gate**: Primary source URLs must strictly use `http:` or `https:`. Private IPv4 ranges (RFC 1918), link-local (`169.254.0.0/16`), and loopback (`127.0.0.1`) are blocked. |
| **Unauthenticated Ingestion** | Spoofed dispatches submitted by untrusted actors | **OAuth 2.1 Mutual Auth**: Mandatory JWT verification with PKCE (S256). Every story version requires valid `client_id` attribution. |
| **Malicious File Uploads** | Executable scripts disguised as media assets | **MIME Sniffing & Magic Bytes**: Files undergo strict magic-byte inspection. Executables are rejected; only WebP, AVIF, PNG, JPEG, and MP4 are permitted. |
| **Denial of Service (DoS)** | Automated bots spamming `create_story` or search | **Token Bucket Rate Limiting**: 100 requests/minute per client ID, with burst allowance up to 150. |
| **Tenant Data Bleed** | Organization A inspecting unpublished drafts of Organization B | **Multi-Tenancy Scoping**: Every database query filters by `organizationId`. Cross-tenant retrieval throws `NotFoundError`. |

---

## 2. Prompt Injection Defense

Because **"The Application is NOT the AI"**, GlobalPulse has structural immunity against classic prompt injection vulnerabilities:
* The backend does **not** take user comments or incoming web wires and feed them into internal LLM completion prompts.
* Text content is treated as untrusted data strings, sanitized with DOMPurify when rendering HTML excerpts, and compiled into typed React components.

---

## 3. Immutable Compliance Audit Logging

Every mutation originating from an external AI agent or human editor triggers an immutable audit log entry:

```typescript
export interface AuditRecord {
  id: string;
  organizationId: string;
  action: 'STORY_CREATED' | 'VERSION_SNAPSHOT' | 'STORY_PUBLISHED' | 'STORY_RETRACTED' | 'SOURCE_ATTACHED';
  entityType: string;
  entityId: string;
  actorId: string;
  clientType: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
```

Audit entries are append-only. No user, agent, or administrator can edit or delete historical audit log records.
