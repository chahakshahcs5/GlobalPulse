# OpenAI MCP Authentication & OAuth 2.1 Specification

## Standard-Compliant Remote Authorization

The News Platform implements standard **OAuth 2.1 with PKCE (S256)** and RFC 8414 OAuth 2.0 Protected Resource Metadata to integrate with OpenAI ChatGPT and enterprise MCP clients.

---

## 1. Protected Resource Metadata (`/.well-known/oauth-protected-resource`)

ChatGPT discovers the resource server requirements by requesting:

```http
GET /.well-known/oauth-protected-resource HTTP/1.1
Host: news.example.com
```

### Response:

```json
{
  "resource": "https://news.example.com/mcp",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": [
    "news:read",
    "news:search",
    "news:write",
    "news:publish",
    "news:media",
    "news:sources",
    "news:topics",
    "news:admin"
  ],
  "bearer_methods_supported": ["header"],
  "resource_documentation": "https://news.example.com/docs/mcp"
}
```

---

## 2. Authorization Code Flow with PKCE (S256)

1. **Authorization Request**:
   ChatGPT directs the journalist/user to the authorization server:

   ```
   https://auth.example.com/authorize?
     response_type=code&
     client_id=chatgpt_news_app&
     redirect_uri=https://chatgpt.com/aip/callback&
     scope=news:read%20news:search%20news:write%20news:publish%20news:media%20news:sources&
     code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
     code_challenge_method=S256
   ```

2. **User Consent**:
   The user logs into the identity provider and grants the requested scopes.

3. **Token Exchange**:
   ChatGPT exchanges the authorization code and `code_verifier` for an Access Token (JWT):
   ```http
   POST /oauth/token HTTP/1.1
   Host: auth.example.com
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code&
   code=SPLAT_AUTH_CODE&
   redirect_uri=https://chatgpt.com/aip/callback&
   client_id=chatgpt_news_app&
   code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
   ```

---

## 3. Resource Server Token Validation

Every incoming MCP request carries the bearer token in the `Authorization` header:

```http
POST /mcp HTTP/1.1
Host: news.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

The MCP Resource Server verifies:

1. **Signature**: Verified against the authorization server's JWKS endpoint.
2. **Issuer (`iss`)**: Matches `https://auth.example.com`.
3. **Audience (`aud`)**: Matches `https://news.example.com/mcp`.
4. **Expiration (`exp`)**: Validates the token is not expired.
5. **Scopes (`scope`)**: Enforces required scopes per tool invocation:
   - `search_stories` -> requires `news:search`
   - `create_story` -> requires `news:write`
   - `publish_story` -> requires `news:publish`
6. **Principal Resolution**: Extracts `userId` and `organizationId` for multi-tenant isolation.
