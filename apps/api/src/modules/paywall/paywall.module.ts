import { Module } from '@nestjs/common';
import { PaywallController } from './paywall.controller';

@Module({
  controllers: [PaywallController],
})
export class PaywallModule {}
