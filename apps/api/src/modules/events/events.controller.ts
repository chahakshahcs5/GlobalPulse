import { Controller, Get, Post, Param, Query, Body, UseGuards, HttpStatus, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { EventService } from '@ai-news/events';
import { db } from '@ai-news/database';
import { ApiResponse } from '../../common/response/api-response';
import { NestAuthGuard, RequireScope, Principal } from '../../common/auth.guard';

@Controller('api/events')
@UseGuards(NestAuthGuard)
export class EventsController {
  private eventService: EventService;

  constructor() {
    this.eventService = new EventService(db);
  }

  @Get()
  @RequireScope('news:read')
  async listEvents(@Query('query') query: string, @Principal() principal: any) {
    const orgId = principal.organizationId;
    if (query) {
      const events = await this.eventService.searchEvents(query, orgId);
      return ApiResponse.success(events);
    }
    return await this.eventService.listEvents(orgId);
  }

  @Get(':id')
  @RequireScope('news:read')
  async getEvent(@Param('id') id: string, @Principal() principal: any) {
    return await this.eventService.getEvent(id, principal.organizationId);
  }

  @Post()
  @RequireScope('news:write')
  async createEvent(
    @Body() body: any,
    @Principal() principal: any,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const event = await this.eventService.createEvent(body, principal.organizationId);
    reply.status(HttpStatus.CREATED);
    return event;
  }
}
