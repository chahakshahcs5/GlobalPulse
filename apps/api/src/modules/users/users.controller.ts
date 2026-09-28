import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { db } from '@ai-news/database';
import { UserService, type StoryContext } from '@ai-news/stories';
import { NestAuthGuard, Principal } from '../../common/auth.guard';
import {
  AssignUserRoleInputSchema,
  InviteUserInputSchema,
} from '@ai-news/schemas';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';

@Controller('api/users')
@UseGuards(NestAuthGuard)
export class UsersController {
  private userService = new UserService(db);

  @Get()
  async listUsers(@Principal() principal: AuthenticatedPrincipal) {
    AuthService.requireScope(principal, 'news:read');
    return this.userService.listUsers(principal.organizationId);
  }

  @Get(':id')
  async getUser(
    @Param('id') id: string,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    AuthService.requireScope(principal, 'news:read');
    return this.userService.getUser(id, principal.organizationId);
  }

  @Post('invite')
  @HttpCode(HttpStatus.CREATED)
  async inviteUser(
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    AuthService.requireRole(principal, 'admin', 'editor');

    const validated = InviteUserInputSchema.parse(body);
    const ctx: StoryContext = {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
    };

    return this.userService.inviteUser(validated, ctx);
  }

  @Put(':id/role')
  @HttpCode(HttpStatus.OK)
  async assignRole(
    @Param('id') id: string,
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    AuthService.requireRole(principal, 'admin');
    AuthService.requireScope(principal, 'news:admin');

    const validated = AssignUserRoleInputSchema.parse({ ...((body as any) || {}), userId: id });
    const ctx: StoryContext = {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
    };

    return this.userService.assignRole(id, validated.role, ctx);
  }
}
