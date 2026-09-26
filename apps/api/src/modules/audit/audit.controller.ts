import { Controller, Get, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { db } from '@ai-news/database';
import { ApiResponse } from '../../common/response/api-response';
import { NestAuthGuard, RequireScope, Principal } from '../../common/auth.guard';

@Controller('api/audit')
@UseGuards(NestAuthGuard)
export class AuditController {
  @Get(['', 'logs'])
  @RequireScope('news:admin')
  async queryAuditLogs(@Query() filter: any, @Principal() principal: any) {
    const orgId = principal.organizationId;
    return await db.audit.query(orgId, filter);
  }

  @Get([':id', 'logs/:id'])
  @RequireScope('news:admin')
  async getAuditLogById(@Param('id') id: string) {
    const log = await db.audit.findById(id);
    if (!log) {
      throw new NotFoundException(`Audit log ${id} not found`);
    }
    return ApiResponse.success(log);
  }
}
