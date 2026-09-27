import { Controller, Get, Sse, Query, Optional, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RealtimeService, RealtimeMessageEvent } from './realtime.service';

@Controller('api/realtime')
export class RealtimeController {
  private readonly service: RealtimeService;

  constructor(@Optional() @Inject(RealtimeService) service?: RealtimeService) {
    this.service = service || RealtimeService.getInstance();
  }

  @Sse('stream')
  stream(@Query('channels') channelsQuery?: string): Observable<RealtimeMessageEvent> {
    const channels = typeof channelsQuery === 'string' && channelsQuery.trim().length > 0
      ? channelsQuery.split(',').map((c) => c.trim())
      : ['all'];

    return this.service.getEventStream(channels);
  }

  @Get('status')
  getStatus(): { connectedClients: number; timestamp: string } {
    return {
      connectedClients: this.service.getConnectedClientsCount(),
      timestamp: new Date().toISOString(),
    };
  }
}
