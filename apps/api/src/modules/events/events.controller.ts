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
import { EventService } from '@ai-news/events';
import { db } from '@ai-news/database';
import { ApiResponse } from '../../common/response/api-response';
import { NestAuthGuard, RequireScope, Principal } from '../../common/auth.guard';
import type { AuthenticatedPrincipal } from '@ai-news/auth';
import type { CreateEventInput } from '@ai-news/schemas';

/** Parses a comma-separated query parameter into a list. */
function splitList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Parses `west,south,east,north` into a bounding box tuple. */
function parseBbox(value?: string): [number, number, number, number] | undefined {
  if (!value) return undefined;
  const parts = value.split(',').map((entry) => Number(entry.trim()));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return undefined;
  return [parts[0], parts[1], parts[2], parts[3]];
}

@Controller('api/events')
@UseGuards(NestAuthGuard)
export class EventsController {
  private eventService: EventService;

  constructor() {
    this.eventService = new EventService(db);
  }

  @Get()
  @RequireScope('news:read')
  async listEvents(@Query('query') query: string, @Principal() principal: AuthenticatedPrincipal) {
    const orgId = principal.organizationId;
    if (query) {
      const events = await this.eventService.searchEvents(query, orgId);
      return ApiResponse.success(events);
    }
    return await this.eventService.listEvents(orgId);
  }

  @Get('map')
  @RequireScope('news:read')
  async listEventMap(
    @Query('categories') categories: string | undefined,
    @Query('severities') severities: string | undefined,
    @Query('statuses') statuses: string | undefined,
    @Query('fromDate') fromDate: string | undefined,
    @Query('toDate') toDate: string | undefined,
    @Query('bbox') bbox: string | undefined,
    @Query('limit') limit: string | undefined,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    const points = await this.eventService.listEventsForMap(principal.organizationId, {
      categories: splitList(categories),
      severities: splitList(severities) as never,
      statuses: splitList(statuses) as never,
      fromDate,
      toDate,
      bbox: parseBbox(bbox),
      limit: limit ? Math.min(2000, Math.max(1, Number(limit) || 500)) : 500,
    });

    return { count: points.length, points };
  }

  @Get('map/heatmap')
  @RequireScope('news:read')
  async getEventHeatmap(
    @Query('categories') categories: string | undefined,
    @Query('severities') severities: string | undefined,
    @Query('fromDate') fromDate: string | undefined,
    @Query('toDate') toDate: string | undefined,
    @Query('precision') precision: string | undefined,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    return await this.eventService.getEventHeatmap(principal.organizationId, {
      categories: splitList(categories),
      severities: splitList(severities) as never,
      fromDate,
      toDate,
      precision: precision ? Math.min(10, Math.max(0.1, Number(precision) || 1)) : 1,
    });
  }

  @Get(':id')
  @RequireScope('news:read')
  async getEvent(@Param('id') id: string, @Principal() principal: AuthenticatedPrincipal) {
    return await this.eventService.getEvent(id, principal.organizationId);
  }

  @Post()
  @RequireScope('news:write')
  async createEvent(
    @Body() body: CreateEventInput,
    @Principal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const event = await this.eventService.createEvent(body, principal.organizationId);
    reply.status(HttpStatus.CREATED);
    return event;
  }
}
