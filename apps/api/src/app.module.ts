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

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      typeDefs,
      graphiql: true,
      subscription: true,
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
  ],
})
export class AppModule {}
