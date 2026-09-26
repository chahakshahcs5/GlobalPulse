import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { SourcesController } from './sources.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requireScope } from '../../common/guards/scope.guard';

export const sourcesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('preHandler', authGuard);

  app.get('/api/sources', { preHandler: [requireScope('news:read')] }, SourcesController.listSources);
  app.get('/api/sources/:id', { preHandler: [requireScope('news:read')] }, SourcesController.getSource);
  app.post('/api/sources', { preHandler: [requireScope('news:sources')] }, SourcesController.createSource);
  app.post('/api/sources/attach', { preHandler: [requireScope('news:sources')] }, SourcesController.attachSource);
  app.post('/api/sources/citations', { preHandler: [requireScope('news:sources')] }, SourcesController.createCitation);
  app.get('/api/stories/:storyId/citations', { preHandler: [requireScope('news:read')] }, SourcesController.getCitations);
};
