import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { NewsletterService } from '@ai-news/stories';
import { db } from '@ai-news/database';
import { NestAuthGuard, RequireScope, Roles, Principal } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import {
  SubscribeNewsletterInputSchema,
  UnsubscribeNewsletterInputSchema,
  GenerateDigestInputSchema,
} from '@ai-news/schemas';
import type { NewsletterSubscription, NewsletterDigest } from '@ai-news/schemas';

@Controller('api/newsletter')
export class NewsletterController {
  private newsletterService: NewsletterService;

  constructor() {
    this.newsletterService = new NewsletterService(db);
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(
    @Body() body: unknown
  ): Promise<{ success: boolean; subscription: NewsletterSubscription }> {
    const input = SubscribeNewsletterInputSchema.parse(body);
    const subscription = await this.newsletterService.subscribe(
      input.email,
      input.frequency,
      input.categories
    );
    return { success: true, subscription };
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  async unsubscribe(@Body() body: unknown): Promise<{ success: boolean }> {
    const input = UnsubscribeNewsletterInputSchema.parse(body);
    const success = await this.newsletterService.unsubscribe(input.email);
    return { success };
  }

  @Post('generate-digest')
  @HttpCode(HttpStatus.OK)
  @UseGuards(NestAuthGuard)
  @Roles('admin', 'editor', 'ai_agent')
  @RequireScope('news:write')
  async generateDigest(
    @Body() body: unknown,
    @Principal() principal?: AuthenticatedPrincipal
  ): Promise<NewsletterDigest> {
    const input = GenerateDigestInputSchema.parse(body || {});
    const orgId = principal?.organizationId || 'org_default';
    return await this.newsletterService.generateDigest(
      input.frequency,
      input.category,
      input.targetDate,
      orgId
    );
  }

  @Get('latest')
  async getLatestDigest(
    @Query('frequency') frequency?: 'daily' | 'weekly',
    @Query('category') category?: string
  ): Promise<NewsletterDigest | null> {
    return await this.newsletterService.getLatestDigest(frequency, category);
  }
}
