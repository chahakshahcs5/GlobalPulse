import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { SearchController } from './search.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requireScope } from '../../common/guards/scope.guard';

export const searchRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('preHandler', authGuard);

  app.get('/api/search/stories', { preHandler: [requireScope('news:search')] }, SearchController.searchStories);
  app.post('/api/search/stories/similar', { preHandler: [requireScope('news:search')] }, SearchController.findSimilarStories);
  app.get('/api/search/federated', { preHandler: [requireScope('news:search')] }, SearchController.searchAll);
};
