import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { EntityService } from '@ai-news/entities';
import { db } from '@ai-news/database';
import { ApiResponse } from '../../common/response/api-response';
import { NestAuthGuard, RequireScope, Principal } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import type { CreateEntityInput } from '@ai-news/schemas';

@Controller('api/entities')
@UseGuards(NestAuthGuard)
export class EntitiesController {
  private entityService: EntityService;

  constructor() {
    this.entityService = new EntityService(db);
  }

  @Get()
  @RequireScope('news:read')
  async listEntities(
    @Query('query') query: string,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    const orgId = principal.organizationId;
    if (query) {
      const entities = await this.entityService.searchEntities(query, orgId);
      return ApiResponse.success(entities);
    }
    return await this.entityService.listEntities(orgId);
  }

  @Get(':id')
  @RequireScope('news:read')
  async getEntity(@Param('id') id: string, @Principal() principal: AuthenticatedPrincipal) {
    return await this.entityService.getEntity(id, principal.organizationId);
  }

  @Post()
  @RequireScope('news:write')
  async createEntity(
    @Body() body: CreateEntityInput,
    @Principal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const entity = await this.entityService.createEntity(body, principal.organizationId);
    reply.status(HttpStatus.CREATED);
    return entity;
  }
}
