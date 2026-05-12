import { Module } from '@nestjs/common';
import { MaterielsController } from './materiels.controller';
import { MaterielsService } from './materiels.service';
import { EvenementsModule } from '../evenements/evenements.module';
import { PdfModule } from '../pdf/pdf.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [EvenementsModule, PdfModule, NotificationsModule],
  controllers: [MaterielsController],
  providers: [MaterielsService],
  exports: [MaterielsService],
})
export class MaterielsModule {}
