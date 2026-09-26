import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { MediaController } from './media.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requireScope } from '../../common/guards/scope.guard';

export const mediaRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('preHandler', authGuard);

  app.post('/api/media', { preHandler: [requireScope('news:media')] }, MediaController.registerMedia);
  app.get('/api/media/:id', { preHandler: [requireScope('news:read')] }, MediaController.getMedia);
};
