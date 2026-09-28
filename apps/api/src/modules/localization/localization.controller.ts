import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { SUPPORTED_REGIONAL_EDITIONS, RegionalEdition } from '@ai-news/schemas';

@Controller('api/editions')
export class LocalizationController {
  @Get()
  listEditions(): RegionalEdition[] {
    return SUPPORTED_REGIONAL_EDITIONS;
  }

  @Get(':code')
  getEdition(@Param('code') code: string): RegionalEdition {
    const edition = SUPPORTED_REGIONAL_EDITIONS.find(
      (e) => e.code.toLowerCase() === code.toLowerCase()
    );
    if (!edition) {
      throw new NotFoundException(`Regional edition "${code}" is not supported.`);
    }
    return edition;
  }
}
