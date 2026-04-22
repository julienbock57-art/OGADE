import { Module } from '@nestjs/common';
import { DemandesEnvoiController } from './demandes-envoi.controller';
import { DemandesEnvoiService } from './demandes-envoi.service';

@Module({
  controllers: [DemandesEnvoiController],
  providers: [DemandesEnvoiService],
  exports: [DemandesEnvoiService],
})
export class DemandesEnvoiModule {}
