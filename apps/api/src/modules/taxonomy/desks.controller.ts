import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import type { SpecialDesk } from '@ai-news/schemas';
import { specialDeskService } from '@ai-news/topics';
import { NestAuthGuard } from '../../common/auth.guard';

/**
 * REST surface for the web client's special-desk features
 * (see apps/web/src/lib/api-client/taxonomy.ts).
 */
@Controller('api/desks')
@UseGuards(NestAuthGuard)
export class DesksController {
  @Get()
  async listDesks(): Promise<SpecialDesk[]> {
    return specialDeskService.listDesks(true);
  }

  @Get(':slugOrId')
  async getDesk(@Param('slugOrId') slugOrId: string): Promise<SpecialDesk> {
    const desk = await specialDeskService.getDesk(slugOrId);
    if (!desk) {
      throw new NotFoundException(`Special desk "${slugOrId}" was not found.`);
    }
    return desk;
  }
}
