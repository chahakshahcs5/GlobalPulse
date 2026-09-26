import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { realtime } from './sse.service';
import { v4 as uuidv4 } from 'uuid';

export const sseRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/api/realtime/stream', async (request, reply) => {
    const channelsQuery = (request.query as any)?.channels;
    const channels = typeof channelsQuery === 'string' ? channelsQuery.split(',') : ['all'];
    const clientId = (request.query as any)?.clientId || uuidv4();

    realtime.registerClient(clientId, channels, reply);

    // Prevent Fastify from automatically closing response
    await new Promise(() => {});
  });

  app.get('/api/realtime/status', async () => {
    return {
      connectedClients: realtime.getConnectedClientsCount(),
      timestamp: new Date().toISOString(),
    };
  });
};
