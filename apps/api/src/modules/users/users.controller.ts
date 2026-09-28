import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
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
  FollowTargetInputSchema,
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
  async getUser(@Param('id') id: string, @Principal() principal: AuthenticatedPrincipal) {
    AuthService.requireScope(principal, 'news:read');
    return this.userService.getUser(id, principal.organizationId);
  }

  @Post('invite')
  @HttpCode(HttpStatus.CREATED)
  async inviteUser(@Body() body: unknown, @Principal() principal: AuthenticatedPrincipal) {
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

  // ---------------------------------------------------------------------------
  // Following Interests (F17)
  // ---------------------------------------------------------------------------

  @Post('follow')
  @HttpCode(HttpStatus.OK)
  async followTarget(@Body() body: unknown, @Principal() principal: AuthenticatedPrincipal) {
    AuthService.requireScope(principal, 'news:read');
    const validated = FollowTargetInputSchema.parse(body);
    return this.userService.followTarget(principal.id, validated.targetType, validated.targetId);
  }

  @Delete('follow/:targetType/:targetId')
  @HttpCode(HttpStatus.OK)
  async unfollowTarget(
    @Param('targetType') targetType: 'topic' | 'entity' | 'author',
    @Param('targetId') targetId: string,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    AuthService.requireScope(principal, 'news:read');
    const success = await this.userService.unfollowTarget(principal.id, targetType, targetId);
    return { success, message: success ? 'Unfollowed successfully' : 'Not currently following' };
  }

  @Get('following')
  async listFollowing(
    @Query('targetType') targetType: 'topic' | 'entity' | 'author' | undefined,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    AuthService.requireScope(principal, 'news:read');
    return this.userService.listFollowing(principal.id, targetType);
  }

  @Get('following/:targetType/:targetId')
  async isFollowing(
    @Param('targetType') targetType: 'topic' | 'entity' | 'author',
    @Param('targetId') targetId: string,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    AuthService.requireScope(principal, 'news:read');
    const following = await this.userService.isFollowing(principal.id, targetType, targetId);
    return { targetType, targetId, following };
  }
}
