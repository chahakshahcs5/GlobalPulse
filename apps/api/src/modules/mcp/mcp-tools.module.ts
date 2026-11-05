import { Module } from '@nestjs/common';
import { McpToolsController } from './mcp-tools.controller';

@Module({
  controllers: [McpToolsController],
})
export class McpToolsModule {}
