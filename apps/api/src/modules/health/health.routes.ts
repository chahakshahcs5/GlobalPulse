import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { HealthController } from './health.controller';

export const healthRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/health', HealthController.getHealth);
  app.get('/health/live', HealthController.getLiveness);
  app.get('/health/ready', HealthController.getReadiness);
};
