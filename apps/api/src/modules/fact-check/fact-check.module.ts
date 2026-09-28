import { Module } from '@nestjs/common';
import { FactCheckController } from './fact-check.controller';

@Module({
  controllers: [FactCheckController],
})
export class FactCheckModule {}
