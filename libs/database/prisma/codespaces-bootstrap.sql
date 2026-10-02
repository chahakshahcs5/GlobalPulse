INSERT INTO "organizations" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES ('org_default', 'GlobalPulse Local Development', 'globalpulse-local', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "users" (
  "id", "organizationId", "email", "name", "role", "scopes", "clientType", "status", "createdAt", "updatedAt"
)
VALUES
  (
    'usr_mcp_gemini', 'org_default', 'mcp-gemini@local.test', 'Local MCP Agent', 'ai_agent',
    ARRAY['news:read', 'news:search', 'news:write', 'news:publish', 'news:media', 'news:sources', 'news:topics'],
    'gemini', 'active', NOW(), NOW()
  ),
  (
    'usr_dev_admin', 'org_default', 'dev-admin@local.test', 'Local Development Admin', 'admin',
    ARRAY['news:read', 'news:search', 'news:write', 'news:publish', 'news:admin', 'news:media', 'news:sources', 'news:topics'],
    'internal_service', 'active', NOW(), NOW()
  )
ON CONFLICT ("id") DO NOTHING;
