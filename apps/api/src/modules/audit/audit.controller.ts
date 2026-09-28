import { Controller, Get, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { db } from '@ai-news/database';
import { ApiResponse } from '../../common/response/api-response';
import { NestAuthGuard, RequireScope, Roles, Principal } from '../../common/auth.guard';
import { AuthenticatedPrincipal } from '@ai-news/auth';

@Controller('api/audit')
@UseGuards(NestAuthGuard)
export class AuditController {
  @Get(['', 'logs'])
  @Roles('admin')
  @RequireScope('news:admin')
  async queryAuditLogs(
    @Query() filter: Record<string, unknown>,
    @Principal() principal: AuthenticatedPrincipal
  ) {
    const orgId = principal.organizationId;
    return await db.audit.query(orgId, filter);
  }

  @Get([':id', 'logs/:id'])
  @Roles('admin')
  @RequireScope('news:admin')
  async getAuditLogById(@Param('id') id: string) {
    const log = await db.audit.findById(id);
    if (!log) {
      throw new NotFoundException(`Audit log ${id} not found`);
    }
    return ApiResponse.success(log);
  }
}
