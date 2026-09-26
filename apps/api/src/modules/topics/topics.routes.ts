import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { TopicsController } from './topics.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requireScope } from '../../common/guards/scope.guard';

export const topicsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('preHandler', authGuard);

  app.get('/api/topics', { preHandler: [requireScope('news:read')] }, TopicsController.listTopics);
  app.get('/api/topics/:id', { preHandler: [requireScope('news:read')] }, TopicsController.getTopic);
  app.post('/api/topics', { preHandler: [requireScope('news:topics')] }, TopicsController.createTopic);
};
