import { Module } from '@nestjs/common';
import { MaterielsController } from './materiels.controller';
import { MaterielsService } from './materiels.service';
import { EvenementsModule } from '../evenements/evenements.module';

@Module({
  imports: [EvenementsModule],
  controllers: [MaterielsController],
  providers: [MaterielsService],
  exports: [MaterielsService],
})
export class MaterielsModule {}
