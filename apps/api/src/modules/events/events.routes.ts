import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { EventsController } from './events.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requireScope } from '../../common/guards/scope.guard';

export const eventsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('preHandler', authGuard);

  app.get('/api/events', { preHandler: [requireScope('news:read')] }, EventsController.listEvents);
  app.get('/api/events/:id', { preHandler: [requireScope('news:read')] }, EventsController.getEvent);
  app.post('/api/events', { preHandler: [requireScope('news:write')] }, EventsController.createEvent);
};
