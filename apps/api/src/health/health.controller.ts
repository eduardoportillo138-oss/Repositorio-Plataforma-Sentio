import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Public()
  @Get()
  check(): { status: 'ok' | 'degraded'; mongo: string } {
    const mongoUp = this.connection.readyState === ConnectionStates.connected;
    return { status: mongoUp ? 'ok' : 'degraded', mongo: mongoUp ? 'up' : 'down' };
  }
}
