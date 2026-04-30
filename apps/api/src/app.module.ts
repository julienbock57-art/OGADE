import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MaterielsModule } from './materiels/materiels.module';
import { MaquettesModule } from './maquettes/maquettes.module';
import { AgentsModule } from './agents/agents.module';
import { DemandesEnvoiModule } from './demandes-envoi/demandes-envoi.module';
import { ReservationsModule } from './reservations/reservations.module';
import { FichiersModule } from './fichiers/fichiers.module';
import { QrcodeModule } from './qrcode/qrcode.module';
import { ReferentielsModule } from './referentiels/referentiels.module';
import { SitesModule } from './sites/sites.module';
import { EntreprisesModule } from './entreprises/entreprises.module';
import { ChatModule } from './chat/chat.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MaterielsModule,
    MaquettesModule,
    AgentsModule,
    DemandesEnvoiModule,
    ReservationsModule,
    FichiersModule,
    QrcodeModule,
    ReferentielsModule,
    SitesModule,
    EntreprisesModule,
    ChatModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
