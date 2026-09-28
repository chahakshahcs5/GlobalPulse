import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { db } from '@ai-news/database';
import { UserService } from '@ai-news/stories';
import { NestAuthGuard, Principal } from '../../common/auth.guard';
import { RegisterUserInput, LoginInput, UpdatePreferencesInput } from '@ai-news/schemas';
import type { AuthenticatedPrincipal } from '@ai-news/auth';

@Controller('api/auth')
export class AuthController {
  private userService = new UserService(db);

  /**
   * F1: Register new account
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterUserInput, @Res({ passthrough: true }) reply: FastifyReply) {
    const result = await this.userService.register(body);

    // Set secure cookie for browser sessions
    reply.header(
      'Set-Cookie',
      `gp_token=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`
    );

    return result;
  }

  /**
   * F1: Login with email & password
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginInput, @Res({ passthrough: true }) reply: FastifyReply) {
    const result = await this.userService.login(body);

    reply.header(
      'Set-Cookie',
      `gp_token=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`
    );

    return result;
  }

  /**
   * F1: Logout and clear session cookie
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) reply: FastifyReply) {
    reply.header('Set-Cookie', 'gp_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return { success: true, message: 'Logged out successfully.' };
  }

  /**
   * F1: Current User Profile
   */
  @Get('me')
  @UseGuards(NestAuthGuard)
  async getProfile(@Principal() principal: AuthenticatedPrincipal) {
    const user = await this.userService.getUser(principal.id, principal.organizationId);
    const following = await this.userService.listFollowing(principal.id);
    const readingHistory = await db.engagement.listReadingHistory(principal.id);

    return {
      ...user,
      stats: {
        followingCount: following.length,
        articlesReadCount: readingHistory.length,
      },
    };
  }

  /**
   * F1: Update User Preferences
   */
  @Put('preferences')
  @UseGuards(NestAuthGuard)
  async updatePreferences(
    @Body() body: UpdatePreferencesInput,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    return this.userService.updatePreferences(principal.id, body, principal.organizationId);
  }
}
