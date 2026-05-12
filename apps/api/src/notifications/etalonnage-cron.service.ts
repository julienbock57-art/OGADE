import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Cron quotidien (08:00) qui parcourt les matériels soumis à vérification
 * et notifie le responsable :
 *  - ETALONNAGE_PROCHE  : date prochaine entre aujourd'hui et J+30
 *  - ETALONNAGE_ECHU    : date prochaine déjà dépassée
 *
 * Anti-doublon : on ne crée pas de notif si une notif du même type sur le
 * même matériel existe déjà dans les 24 dernières heures (évite le spam
 * quotidien).
 */
@Injectable()
export class EtalonnageCronService {
  private readonly logger = new Logger(EtalonnageCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron('0 8 * * *', { name: 'etalonnage-daily' })
  async runDaily(): Promise<void> {
    const now = new Date();
    const horizon = new Date(now.getTime() + THIRTY_DAYS_MS);
    const yesterday = new Date(now.getTime() - ONE_DAY_MS);

    const materiels = await this.prisma.materiel.findMany({
      where: {
        deletedAt: null,
        soumisVerification: true,
        etat: { notIn: ['HS', 'PERDU'] },
        responsableId: { not: null },
        OR: [
          { dateProchainEtalonnage: { lt: now } },
          { dateProchainEtalonnage: { gte: now, lte: horizon } },
        ],
      },
      select: {
        id: true,
        reference: true,
        libelle: true,
        responsableId: true,
        dateProchainEtalonnage: true,
      },
    });

    let created = 0;
    let skipped = 0;

    for (const m of materiels) {
      if (!m.responsableId || !m.dateProchainEtalonnage) continue;

      const echu = m.dateProchainEtalonnage < now;
      const type = echu ? 'ETALONNAGE_ECHU' : 'ETALONNAGE_PROCHE';

      const recent = await this.prisma.notification.findFirst({
        where: {
          type,
          entityType: 'Materiel',
          entityId: m.id,
          createdAt: { gte: yesterday },
        },
        select: { id: true },
      });
      if (recent) {
        skipped++;
        continue;
      }

      const dateStr = m.dateProchainEtalonnage.toISOString().slice(0, 10);
      const title = echu
        ? `Étalonnage échu - ${m.reference}`
        : `Étalonnage proche - ${m.reference}`;
      const message = echu
        ? `L'étalonnage de ${m.libelle} était prévu le ${dateStr}.`
        : `L'étalonnage de ${m.libelle} est prévu le ${dateStr}.`;

      await this.notifications.create({
        recipientId: m.responsableId,
        type,
        title,
        message,
        link: `/materiels/${m.id}`,
        entityType: 'Materiel',
        entityId: m.id,
      });
      created++;
    }

    this.logger.log(
      `Cron étalonnages : ${materiels.length} matériels examinés, ${created} notifs créées, ${skipped} doublons évités.`,
    );
  }
}
