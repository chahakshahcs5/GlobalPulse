import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { StoriesController } from './stories.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requireScope } from '../../common/guards/scope.guard';

export const storiesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Global auth guard for stories router
  app.addHook('preHandler', authGuard);

  // Read endpoints
  app.get('/api/stories', { preHandler: [requireScope('news:read')] }, StoriesController.listStories);
  app.get('/api/stories/:id', { preHandler: [requireScope('news:read')] }, StoriesController.getStoryById);
  app.get('/api/stories/slug/:slug', { preHandler: [requireScope('news:read')] }, StoriesController.getStoryBySlug);

  // Write & mutation endpoints
  app.post('/api/stories', { preHandler: [requireScope('news:write')] }, StoriesController.createStory);
  app.put('/api/stories/:id', { preHandler: [requireScope('news:write')] }, StoriesController.updateStory);

  // Blocks endpoints
  app.get('/api/stories/:id/blocks', { preHandler: [requireScope('news:read')] }, StoriesController.getBlocks);
  app.post('/api/stories/:id/blocks', { preHandler: [requireScope('news:write')] }, StoriesController.addBlock);
  app.put('/api/stories/:id/blocks/:blockId', { preHandler: [requireScope('news:write')] }, StoriesController.updateBlock);
  app.delete('/api/stories/:id/blocks/:blockId', { preHandler: [requireScope('news:write')] }, StoriesController.removeBlock);
  app.post('/api/stories/:id/blocks/reorder', { preHandler: [requireScope('news:write')] }, StoriesController.reorderBlocks);

  // Versions endpoints
  app.get('/api/stories/:id/versions', { preHandler: [requireScope('news:read')] }, StoriesController.getVersions);
  app.get('/api/stories/:id/versions/:versionNumber', { preHandler: [requireScope('news:read')] }, StoriesController.getVersion);
  app.post('/api/stories/:id/versions', { preHandler: [requireScope('news:write')] }, StoriesController.createVersion);

  // Publishing endpoint
  app.post('/api/stories/:id/publish', { preHandler: [requireScope('news:publish')] }, StoriesController.publishStory);
};
