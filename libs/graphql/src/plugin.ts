import { FastifyInstance } from 'fastify';
import mercurius from 'mercurius';
import { typeDefs } from './schema';
import { createResolvers } from './resolvers';
import { DatabaseService, db } from '@ai-news/database';
import { AuthService } from '@ai-news/auth';

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
    context: (req) => {
      let organizationId = 'org_default';
      let userId = 'usr_graphql_user';
      let clientType: any = 'human_web';

      const authHeader = req.headers?.authorization;
      if (authHeader) {
        try {
          const principal = AuthService.resolveBearerToken(authHeader);
          organizationId = principal.organizationId;
          userId = principal.id;
          clientType = principal.clientType;
        } catch {
          // fallback to public defaults
        }
      }

      return {
        organizationId,
        userId,
        clientType,
      };
    },
  });
}
