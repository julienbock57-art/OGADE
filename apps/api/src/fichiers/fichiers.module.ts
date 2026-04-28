import { Module } from '@nestjs/common';
import { FichiersController } from './fichiers.controller';
import { FichiersService } from './fichiers.service';
import { EvenementsModule } from '../evenements/evenements.module';

@Module({
  imports: [EvenementsModule],
  controllers: [FichiersController],
  providers: [FichiersService],
  exports: [FichiersService],
})
export class FichiersModule {}
