import { Controller, Get, Query, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { realtime } from '../../realtime/sse.service';
import { v4 as uuidv4 } from 'uuid';

@Controller('api/realtime')
export class RealtimeController {
  @Get('stream')
  async stream(
    @Query('channels') channelsQuery: string,
    @Query('clientId') queryClientId: string,
    @Res() reply: FastifyReply
  ) {
    const channels = typeof channelsQuery === 'string' ? channelsQuery.split(',') : ['all'];
    const clientId = queryClientId || uuidv4();

    realtime.registerClient(clientId, channels, reply);
    await new Promise(() => {});
  }

  @Get('status')
  getStatus() {
    return {
      connectedClients: realtime.getConnectedClientsCount(),
      timestamp: new Date().toISOString(),
    };
  }
}
