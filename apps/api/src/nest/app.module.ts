import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius';
import { typeDefs } from '@ai-news/graphql';
import { StoriesResolver } from './stories/stories.resolver';
import { TaxonomyResolver } from './taxonomy/taxonomy.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      typeDefs,
      graphiql: true,
      subscription: true,
    }),
  ],
  providers: [StoriesResolver, TaxonomyResolver],
})
export class AppModule {}
