import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { EntitiesController } from './entities.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requireScope } from '../../common/guards/scope.guard';

export const entitiesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('preHandler', authGuard);

  app.get('/api/entities', { preHandler: [requireScope('news:read')] }, EntitiesController.listEntities);
  app.get('/api/entities/:id', { preHandler: [requireScope('news:read')] }, EntitiesController.getEntity);
  app.post('/api/entities', { preHandler: [requireScope('news:write')] }, EntitiesController.createEntity);
};
