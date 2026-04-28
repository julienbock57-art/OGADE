import { Module } from '@nestjs/common';
import { EvenementsService } from './evenements.service';

@Module({
  providers: [EvenementsService],
  exports: [EvenementsService],
})
export class EvenementsModule {}
