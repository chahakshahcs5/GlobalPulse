import { FastifyInstance, FastifyRequest } from 'fastify';
import mercurius from 'mercurius';
import { typeDefs } from './schema';
import { createResolvers } from './resolvers';
import { DatabaseService, db } from '@ai-news/database';
import { AuthService, type ClientType, type AuthenticatedPrincipal } from '@ai-news/auth';

export interface GraphQLPluginOptions {
  database?: DatabaseService;
  graphiql?: boolean;
}

export async function registerGraphQL(app: FastifyInstance, options: GraphQLPluginOptions = {}) {
  const database = options.database || db;
  const resolvers = createResolvers(database);

  await app.register(mercurius, {
    schema: typeDefs,
    resolvers,
    subscription: true,
    graphiql: options.graphiql ?? true,
    context: (req: FastifyRequest) => {
      let principal: AuthenticatedPrincipal | null = null;
      let organizationId: string | undefined = undefined;
      let userId: string | undefined = undefined;
      let clientType: ClientType = 'human_web';

      let authHeader = req.headers?.authorization;
      if (!authHeader && req.headers?.cookie) {
        const match = (req.headers.cookie as string).match(/(?:^|;\s*)gp_token=([^;]+)/);
        if (match && match[1]) {
          authHeader = `Bearer ${decodeURIComponent(match[1])}`;
        }
      }

      if (authHeader) {
        try {
          principal = AuthService.resolveBearerToken(authHeader);
          organizationId = principal.organizationId;
          userId = principal.id;
          clientType = principal.clientType;
        } catch {
          // invalid or expired token
        }
      }

      return {
        principal,
        organizationId,
        userId,
        clientType,
      };
    },
  });
}
