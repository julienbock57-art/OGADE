import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.decorator';
import { MicrosoftTokenService } from './microsoft-token.service';
import { AuthController } from './auth.controller';

@Module({
  controllers: [AuthController],
  providers: [
    MicrosoftTokenService,
    AuthGuard,
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AuthGuard, RolesGuard, MicrosoftTokenService],
})
export class AuthModule {}
