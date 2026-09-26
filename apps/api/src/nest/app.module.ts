import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius';
import { typeDefs } from '@ai-news/graphql';
import { HealthModule } from './health/health.module';
import { OAuthModule } from './oauth/oauth.module';
import { StoriesModule } from './stories/stories.module';
import { EventsModule } from './events/events.module';
import { EntitiesModule } from './entities/entities.module';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { SourcesModule } from './sources/sources.module';
import { SearchModule } from './search/search.module';
import { MediaModule } from './media/media.module';
import { AuditModule } from './audit/audit.module';
import { RealtimeModule } from './realtime/realtime.module';
import { OpenApiModule } from './docs/openapi.module';

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
