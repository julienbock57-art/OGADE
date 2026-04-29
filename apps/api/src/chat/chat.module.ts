import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MaterielsModule } from '../materiels/materiels.module';
import { MaquettesModule } from '../maquettes/maquettes.module';
import { SitesModule } from '../sites/sites.module';

@Module({
  imports: [MaterielsModule, MaquettesModule, SitesModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
