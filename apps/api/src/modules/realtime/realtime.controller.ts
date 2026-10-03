import {
  Controller,
  Get,
  Sse,
  Query,
  Optional,
  Inject,
  Req,
  UseGuards,
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RealtimeService, RealtimeMessageEvent } from './realtime.service';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import type { FastifyRequest } from 'fastify';

function resolvePrincipalFromRequest(req?: FastifyRequest): AuthenticatedPrincipal | null {
  if (!req) return null;
  let authHeader = req.headers?.authorization;
  if (!authHeader && req.headers?.cookie) {
    const match = (req.headers.cookie as string).match(/(?:^|;\s*)gp_token=([^;]+)/);
    if (match && match[1]) {
      authHeader = `Bearer ${decodeURIComponent(match[1])}`;
    }
  }
  if (!authHeader && typeof (req.query as Record<string, unknown>)?.token === 'string') {
    authHeader = `Bearer ${(req.query as Record<string, unknown>).token}`;
  }

  if (authHeader) {
    try {
      return AuthService.resolveBearerToken(authHeader);
    } catch {
      return null;
    }
  }
  return null;
}

@Injectable()
export class RealtimeChannelGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const query = req?.query as Record<string, unknown> | undefined;
    const channelsQuery = query?.channels;
    const channels =
      typeof channelsQuery === 'string' && channelsQuery.trim().length > 0
        ? channelsQuery.split(',').map((c) => c.trim())
        : ['all'];

    const principal = resolvePrincipalFromRequest(req);
    const RESTRICTED_CHANNELS = new Set(['editorial', 'newsroom', 'internal', 'admin', 'drafts']);

    if (!principal) {
      for (const ch of channels) {
        if (RESTRICTED_CHANNELS.has(ch.toLowerCase()) || ch.toLowerCase().startsWith('org_')) {
          throw new UnauthorizedException(
            `Authentication required for restricted channel: "${ch}"`
          );
        }
      }
      return true;
    }

    for (const ch of channels) {
      const lower = ch.toLowerCase();

      // Check tenant channel (org_*)
      if (lower.startsWith('org_')) {
        const targetOrg = lower;
        const userOrg = principal.organizationId.toLowerCase();
        const userOrgChannel = userOrg.startsWith('org_') ? userOrg : `org_${userOrg}`;
        if (principal.role !== 'admin' && targetOrg !== userOrgChannel && targetOrg !== userOrg) {
          throw new ForbiddenException(`Access denied to tenant channel: "${ch}"`);
        }
      }

      // Check editorial/internal channels
      if (RESTRICTED_CHANNELS.has(lower)) {
        const canAccessEditorial =
          principal.role === 'admin' ||
          principal.role === 'editor' ||
          principal.scopes.includes('news:admin') ||
          principal.scopes.includes('news:write');

        if (!canAccessEditorial) {
          throw new ForbiddenException(`Insufficient privileges to subscribe to channel: "${ch}"`);
        }
      }
    }

    return true;
  }
}

@Controller('api/realtime')
export class RealtimeController {
  private readonly service: RealtimeService;

  constructor(@Optional() @Inject(RealtimeService) service?: RealtimeService) {
    this.service = service || RealtimeService.getInstance();
  }

  @UseGuards(RealtimeChannelGuard)
  @Sse('stream')
  stream(
    @Query('channels') channelsQuery?: string,
    @Req() req?: FastifyRequest
  ): Observable<RealtimeMessageEvent> {
    const principal = resolvePrincipalFromRequest(req);
    let channels =
      typeof channelsQuery === 'string' && channelsQuery.trim().length > 0
        ? channelsQuery.split(',').map((c) => c.trim())
        : ['all'];

    if (!principal && channels.includes('all')) {
      channels = ['public', 'breaking_news', 'stories'];
    }

    return this.service.getEventStream(channels);
  }

  @Get('status')
  getStatus(): { connectedClients: number; timestamp: string } {
    return {
      connectedClients: this.service.getConnectedClientsCount(),
      timestamp: new Date().toISOString(),
    };
  }
}
