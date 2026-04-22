import { Module } from '@nestjs/common';
import { MaquettesController } from './maquettes.controller';
import { MaquettesService } from './maquettes.service';

@Module({
  controllers: [MaquettesController],
  providers: [MaquettesService],
  exports: [MaquettesService],
})
export class MaquettesModule {}
