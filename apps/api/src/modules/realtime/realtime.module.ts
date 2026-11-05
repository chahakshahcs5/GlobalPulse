import { Module } from '@nestjs/common';
import { RealtimeController } from './realtime.controller';

/**
 * The realtime service is a process-wide singleton (`RealtimeService.getInstance`).
 *
 * It must not also be a Nest provider: Nest would construct a second instance,
 * the controller would subscribe on that one, and `main.ts` would broadcast on
 * the first — which is exactly the bug that made the SSE feed silent.
 */
@Module({
  controllers: [RealtimeController],
})
export class RealtimeModule {}
