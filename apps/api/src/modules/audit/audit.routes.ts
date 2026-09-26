import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AuditController } from './audit.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requireScope } from '../../common/guards/scope.guard';

export const auditRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('preHandler', authGuard);

  app.get('/api/audit', { preHandler: [requireScope('news:admin')] }, AuditController.queryAuditLogs);
  app.get('/api/audit/:id', { preHandler: [requireScope('news:admin')] }, AuditController.getAuditLogById);
};
