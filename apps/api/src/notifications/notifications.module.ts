import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EtalonnageCronService } from './etalonnage-cron.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, EtalonnageCronService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
