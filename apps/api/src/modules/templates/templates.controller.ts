import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { TemplateService } from '@ai-news/stories';
import { db } from '@ai-news/database';
import { NestAuthGuard, RequireScope, Roles, Principal } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { InstantiateTemplateInputSchema } from '@ai-news/schemas';
import type { ContentTemplate, Story } from '@ai-news/schemas';

@Controller('api/templates')
@UseGuards(NestAuthGuard)
export class TemplatesController {
  private templateService: TemplateService;

  constructor() {
    this.templateService = new TemplateService(db);
  }

  @Get()
  @RequireScope('news:read')
  listTemplates(): ContentTemplate[] {
    return this.templateService.listTemplates();
  }

  @Get(':id')
  @RequireScope('news:read')
  getTemplate(@Param('id') id: string): ContentTemplate | null {
    return this.templateService.getTemplate(id);
  }

  @Post('instantiate')
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'editor', 'journalist', 'ai_agent')
  @RequireScope('news:write')
  async instantiateTemplate(
    @Body() body: unknown,
    @Principal() principal: AuthenticatedPrincipal
  ): Promise<Story> {
    const validated = InstantiateTemplateInputSchema.parse(body);
    return await this.templateService.instantiateStory(validated, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'api',
    });
  }
}
