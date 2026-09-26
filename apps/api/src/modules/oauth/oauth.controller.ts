import { Controller, Get } from '@nestjs/common';
import { appConfig } from '../../config/configuration';

@Controller('.well-known')
export class OAuthController {
  @Get('oauth-protected-resource')
  getProtectedResourceMetadata() {
    return {
      resource: appConfig.jwtAudience,
      authorization_servers: [appConfig.jwtIssuer],
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
      resource_documentation: appConfig.docsUrl,
    };
  }
}
