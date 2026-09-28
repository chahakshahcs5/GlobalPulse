import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { OAuthService, AuthorizeRequest, TokenRequest, oauthService as defaultOAuthService } from './oauth.service';

@Controller('.well-known')
export class OAuthWellKnownController {
  private readonly oauthService: OAuthService;

  constructor() {
    this.oauthService = defaultOAuthService;
  }

  @Get('oauth-protected-resource')
  getProtectedResourceMetadata() {
    return this.oauthService.getProtectedResourceMetadata();
  }

  @Get('oauth-authorization-server')
  getAuthorizationServerMetadata() {
    return this.oauthService.getAuthorizationServerMetadata();
  }

  @Get('openid-configuration')
  getOpenIdConfiguration() {
    return this.oauthService.getAuthorizationServerMetadata();
  }
}

@Controller('oauth')
export class OAuthController {
  private readonly oauthService: OAuthService;

  constructor() {
    this.oauthService = defaultOAuthService;
  }

  @Get('authorize')
  handleAuthorizeGet(
    @Query() query: AuthorizeRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const result = this.oauthService.createAuthorizationCode(query);

    if (query.redirect_uri) {
      const url = new URL(query.redirect_uri);
      url.searchParams.set('code', result.code);
      if (result.state) {
        url.searchParams.set('state', result.state);
      }
      return reply.status(HttpStatus.FOUND).redirect(url.toString());
    }

    return result;
  }

  @Post('authorize')
  @HttpCode(HttpStatus.OK)
  handleAuthorizePost(
    @Body() body: AuthorizeRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const result = this.oauthService.createAuthorizationCode(body);

    if (body.redirect_uri) {
      const url = new URL(body.redirect_uri);
      url.searchParams.set('code', result.code);
      if (result.state) {
        url.searchParams.set('state', result.state);
      }
      return reply.status(HttpStatus.FOUND).redirect(url.toString());
    }

    return result;
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  handleToken(
    @Body() body: TokenRequest,
    @Headers('authorization') authHeader?: string
  ) {
    let clientId = body.client_id;
    let clientSecret = body.client_secret;

    if (authHeader && authHeader.toLowerCase().startsWith('basic ')) {
      try {
        const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('ascii');
        const [id, secret] = credentials.split(':');
        if (id) clientId = id;
        if (secret) clientSecret = secret;
      } catch {
        // Fall back to body credentials
      }
    }

    return this.oauthService.exchangeToken({
      ...body,
      client_id: clientId,
      client_secret: clientSecret,
    });
  }

  @Get('jwks')
  getJwks() {
    return {
      keys: [
        {
          kty: 'oct',
          use: 'sig',
          alg: 'HS256',
          kid: 'globalpulse-default-key-1',
        },
      ],
    };
  }
}
