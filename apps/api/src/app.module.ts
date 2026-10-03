import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius';
import { typeDefs } from '@ai-news/graphql';
import { HealthModule } from './modules/health/health.module';
import { OAuthModule } from './modules/oauth/oauth.module';
import { StoriesModule } from './modules/stories/stories.module';
import { EventsModule } from './modules/events/events.module';
import { EntitiesModule } from './modules/entities/entities.module';
import { TaxonomyModule } from './modules/taxonomy/taxonomy.module';
import { SourcesModule } from './modules/sources/sources.module';
import { SearchModule } from './modules/search/search.module';
import { MediaModule } from './modules/media/media.module';
import { AuditModule } from './modules/audit/audit.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { OpenApiModule } from './modules/docs/openapi.module';
import { EngagementModule } from './modules/engagement/engagement.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { NavigationModule } from './modules/navigation/navigation.module';
import { FeedsModule } from './modules/feeds/feeds.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UsersModule } from './modules/users/users.module';
import { ClusteringModule } from './modules/clustering/clustering.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { FactCheckModule } from './modules/fact-check/fact-check.module';
import { EditorialModule } from './modules/editorial/editorial.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { ProvenanceModule } from './modules/provenance/provenance.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { LocalizationModule } from './modules/localization/localization.module';
import { WeatherModule } from './modules/weather/weather.module';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import type { FastifyRequest } from 'fastify';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      typeDefs,
      graphiql: true,
      subscription: true,
      context: (req: FastifyRequest) => {
        let principal: AuthenticatedPrincipal | null = null;
        let authHeader = req?.headers?.authorization;
        if (!authHeader && req?.headers?.cookie) {
          const match = (req.headers.cookie as string).match(/(?:^|;\s*)gp_token=([^;]+)/);
          if (match && match[1]) {
            authHeader = `Bearer ${decodeURIComponent(match[1])}`;
          }
        }
        if (authHeader) {
          try {
            principal = AuthService.resolveBearerToken(authHeader);
          } catch {
            // invalid or expired token
          }
        }
        return {
          req,
          principal,
          userId: principal?.id,
          organizationId: principal?.organizationId,
          role: principal?.role,
          scopes: principal?.scopes,
          clientType: principal?.clientType,
        };
      },
    }),
    HealthModule,
    OAuthModule,
    StoriesModule,
    EventsModule,
    EntitiesModule,
    TaxonomyModule,
    SourcesModule,
    SearchModule,
    MediaModule,
    AuditModule,
    RealtimeModule,
    OpenApiModule,
    EngagementModule,
    CategoriesModule,
    NavigationModule,
    FeedsModule,
    AnalyticsModule,
    NotificationsModule,
    UsersModule,
    ClusteringModule,
    TemplatesModule,
    FactCheckModule,
    EditorialModule,
    NewsletterModule,
    CollectionsModule,
    ProvenanceModule,
    WebhooksModule,
    LocalizationModule,
    WeatherModule,
  ],
})
export class AppModule {}
