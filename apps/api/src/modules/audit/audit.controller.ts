import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '@ai-news/database';
import { ApiResponse } from '../../common/response/api-response';

export class AuditController {
  static async queryAuditLogs(request: FastifyRequest, reply: FastifyReply) {
    const orgId = request.principal.organizationId;
    const filter = request.query as any;
    const logs = await db.audit.query(orgId, filter);
    return reply.send(logs);
  }

  static async getAuditLogById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const log = await db.audit.findById(id);
    if (!log) {
      return reply.status(404).send({ error: 'AuditLogNotFound', message: `Audit log ${id} not found` });
    }
    return reply.send(ApiResponse.success(log));
  }
}
