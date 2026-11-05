import { Module } from '@nestjs/common';
import { TipsController } from './tips.controller';

@Module({
  controllers: [TipsController],
})
export class TipsModule {}
