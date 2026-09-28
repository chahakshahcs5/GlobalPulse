import { Module } from '@nestjs/common';
import { ClusteringController } from './clustering.controller';

@Module({
  controllers: [ClusteringController],
})
export class ClusteringModule {}
