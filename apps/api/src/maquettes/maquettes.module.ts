import { Module } from '@nestjs/common';
import { MaquettesController } from './maquettes.controller';
import { MaquettesService } from './maquettes.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [MaquettesController],
  providers: [MaquettesService],
  exports: [MaquettesService],
})
export class MaquettesModule {}
