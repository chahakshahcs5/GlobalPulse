import { Module } from '@nestjs/common';
import { BlockVariantController } from './block-variant.controller';

@Module({
  controllers: [BlockVariantController],
})
export class BlockVariantModule {}
