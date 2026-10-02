import { Controller, Get, UseGuards } from '@nestjs/common';
import { db } from '@ai-news/database';
import { NestAuthGuard, RequireScope } from '../../common/auth.guard';
import type { NavTab } from '@ai-news/schemas';

@Controller('api/navigation')
@UseGuards(NestAuthGuard)
export class NavigationController {
  @Get('tabs')
  @RequireScope('news:read')
  async listNavTabs(): Promise<NavTab[]> {
    return await db.navTabs.list(true);
  }
}
