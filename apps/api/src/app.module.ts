import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MaterielsModule } from './materiels/materiels.module';
import { MaquettesModule } from './maquettes/maquettes.module';
import { AgentsModule } from './agents/agents.module';
import { DemandesEnvoiModule } from './demandes-envoi/demandes-envoi.module';
import { FichiersModule } from './fichiers/fichiers.module';
import { QrcodeModule } from './qrcode/qrcode.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MaterielsModule,
    MaquettesModule,
    AgentsModule,
    DemandesEnvoiModule,
    FichiersModule,
    QrcodeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
