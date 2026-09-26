# Remote MCP Authentication & OAuth 2.1 Specification

This document details the OAuth 2.1 mutual authentication, RFC 8414 Protected Resource discovery, and granular scope model protecting the **GlobalPulse Remote MCP Server**.

---

## 1. RFC 8414 & Protected Resource Metadata Discovery

When external AI agents (such as OpenAI ChatGPT Apps or Google Gemini) initialize a connection to the remote MCP server, they first discover authentication requirements via the standardized endpoint:

* **Endpoint**: `GET /.well-known/oauth-protected-resource`

### Response Payload:
```json
{
  "resource": "https://api.globalpulse.news",
  "authorization_servers": [
    "https://auth.globalpulse.news"
  ],
  "scopes_supported": [
    "news:read",
    "news:write",
    "news:publish",
    "news:admin",
    "media:write"
  ],
  "bearer_methods_supported": [
    "header"
  ],
  "resource_documentation": "https://globalpulse.news/docs/mcp-authentication"
}
```

---

## 2. OAuth 2.1 Authorization Code Flow with PKCE (S256)

To protect against authorization code interception attacks without requiring client secrets in distributed agents:

1. **Code Challenge**: The AI client generates a cryptographic code verifier and computes `code_challenge = BASE64URL(SHA256(code_verifier))`.
2. **Authorize Request**: Redirects or initiates user consent with `code_challenge_method=S256`.
3. **Token Exchange**: The client exchanges the authorization code alongside the original `code_verifier`.
4. **Token Issuance**: The auth server validates the SHA-256 hash and issues a signed JWT access token.

---

## 3. Granular Scopes Matrix

Access to MCP tools is strictly governed by granted OAuth scopes:

| Scope | Allowed Operations | Typical Assignee |
|:---|:---|:---|
| `news:read` | `search_stories`, `get_story`, `get_event`, `get_entity`, read resources | Public Readers, Search Bots |
| `news:write` | `create_story`, `update_story`, `append_blocks`, `create_source`, `create_entity` | Contributing AI Reporters (ChatGPT, Gemini) |
| `news:publish` | `publish_story`, `retract_story` | Senior Editor AI Models, Human Editorial CMS |
| `news:admin` | `archive_story`, user access management, compliance audit export | Lead Newsroom Administrators |
| `media:write` | Upload media assets, trigger 4K variant transcode pipelines | Multimedia Production Agents |

---

## 4. Bearer Token Verification

Every incoming HTTP request to `POST /mcp` must include the header:
```http
Authorization: Bearer <jwt_access_token>
```

The server verifies:
* **Signature**: Cryptographically signed using RS256/ES256 against the JWKS endpoint.
* **Expiration (`exp`)**: Token must not be expired.
* **Audience (`aud`)**: Must match `https://api.globalpulse.news`.
* **Issuer (`iss`)**: Must match trusted authorization server.
* **Principal Binding**: Extracts `client_id`, `sub`, and `scope` claims into the `AsyncLocalStorage` store.
