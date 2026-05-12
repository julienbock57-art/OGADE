import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type CreateNotificationInput = {
  recipientId: number;
  type: string;
  title: string;
  message?: string | null;
  link?: string | null;
  entityType?: string | null;
  entityId?: number | null;
  payload?: unknown;
};

/**
 * NotificationsService
 *
 * Service central pour créer / lister / marquer-lu les notifications
 * in-app. Tous les autres services (DemandesEnvoi, Materiels, Maquettes,
 * cron étalonnages…) appellent `create()` pour pousser une notif à un
 * utilisateur — le service vérifie les préférences avant de stocker.
 *
 * Idempotent : si on essaie de notifier un destinataire qui n'existe pas
 * (id null/0), on no-op silencieusement plutôt que de planter.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée une notification. Retourne null si le destinataire a désactivé
   * ce type ou si l'id est invalide.
   */
  async create(input: CreateNotificationInput) {
    if (!input.recipientId || input.recipientId < 1) return null;

    const pref = await this.prisma.notificationPreference.findUnique({
      where: {
        agentId_notifType: {
          agentId: input.recipientId,
          notifType: input.type,
        },
      },
    });
    // Par défaut (pas de préférence enregistrée) → in-app activé.
    if (pref && pref.inApp === false) return null;

    return this.prisma.notification.create({
      data: {
        recipientId: input.recipientId,
        type: input.type,
        title: input.title,
        message: input.message ?? null,
        link: input.link ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        payload: (input.payload as any) ?? undefined,
      },
    });
  }

  /**
   * Crée plusieurs notifications en un seul appel (déduplique sur
   * recipientId pour ne pas spammer un même utilisateur).
   */
  async createMany(inputs: CreateNotificationInput[]) {
    const seen = new Set<string>();
    const out = [];
    for (const i of inputs) {
      const k = `${i.recipientId}:${i.type}:${i.entityType ?? ""}:${i.entityId ?? ""}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const n = await this.create(i);
      if (n) out.push(n);
    }
    return out;
  }

  async list(agentId: number, params: { page: number; pageSize: number; unread?: boolean }) {
    const { page, pageSize, unread } = params;
    const skip = (page - 1) * pageSize;
    const where: any = { recipientId: agentId };
    if (unread) where.readAt = null;
    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { recipientId: agentId, readAt: null },
      }),
    ]);
    return {
      data,
      total,
      unreadCount,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async unreadCount(agentId: number): Promise<number> {
    return this.prisma.notification.count({
      where: { recipientId: agentId, readAt: null },
    });
  }

  async markRead(agentId: number, id: number) {
    await this.prisma.notification.updateMany({
      where: { id, recipientId: agentId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(agentId: number) {
    await this.prisma.notification.updateMany({
      where: { recipientId: agentId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async remove(agentId: number, id: number) {
    await this.prisma.notification.deleteMany({
      where: { id, recipientId: agentId },
    });
  }

  async getPreferences(agentId: number) {
    return this.prisma.notificationPreference.findMany({
      where: { agentId },
    });
  }

  /**
   * Update en upsert : pour chaque type fourni, met à jour ou crée la
   * préférence. Les types non fournis restent inchangés (défaut = ON).
   */
  async updatePreferences(
    agentId: number,
    prefs: { notifType: string; inApp: boolean; email?: boolean }[],
  ) {
    for (const p of prefs) {
      await this.prisma.notificationPreference.upsert({
        where: {
          agentId_notifType: { agentId, notifType: p.notifType },
        },
        create: {
          agentId,
          notifType: p.notifType,
          inApp: p.inApp,
          email: p.email ?? false,
        },
        update: {
          inApp: p.inApp,
          email: p.email ?? false,
        },
      });
    }
    return this.getPreferences(agentId);
  }
}
