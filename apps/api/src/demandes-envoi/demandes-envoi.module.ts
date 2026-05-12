import { Module } from '@nestjs/common';
import { DemandesEnvoiController } from './demandes-envoi.controller';
import { DemandesEnvoiService } from './demandes-envoi.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [DemandesEnvoiController],
  providers: [DemandesEnvoiService],
  exports: [DemandesEnvoiService],
})
export class DemandesEnvoiModule {}
