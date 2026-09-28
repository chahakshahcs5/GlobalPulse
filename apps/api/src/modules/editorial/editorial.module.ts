import { Module } from '@nestjs/common';
import { EditorialController } from './editorial.controller';

@Module({
  controllers: [EditorialController],
})
export class EditorialModule {}
