import { Module } from '@nestjs/common';
import { OAuthWellKnownController, OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';

@Module({
  controllers: [OAuthWellKnownController, OAuthController],
  providers: [OAuthService],
  exports: [OAuthService],
})
export class OAuthModule {}
