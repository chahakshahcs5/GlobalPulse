import { Controller, Get } from '@nestjs/common';

@Controller('.well-known')
export class OAuthController {
  @Get('oauth-protected-resource')
  getProtectedResourceMetadata() {
    return {
      resource: process.env.OAUTH_AUDIENCE || 'https://news.platform/mcp',
      authorization_servers: [process.env.OAUTH_ISSUER || 'http://localhost:4000/auth'],
      scopes_supported: [
        'news:read',
        'news:search',
        'news:write',
        'news:publish',
        'news:media',
        'news:sources',
        'news:topics',
        'news:admin',
      ],
      bearer_methods_supported: ['header'],
      resource_documentation: 'https://news.platform/docs',
    };
  }
}
