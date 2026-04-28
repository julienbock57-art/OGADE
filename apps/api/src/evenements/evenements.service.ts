import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EvenementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    entityType: string;
    entityId: number;
    eventType: string;
    payload?: Record<string, any>;
    acteurId?: number | null;
  }) {
    return this.prisma.evenement.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        eventType: params.eventType,
        payload: params.payload ? JSON.stringify(params.payload) : null,
        acteurId: params.acteurId ?? null,
      },
    });
  }

  async findByEntity(entityType: string, entityId: number) {
    const events = await this.prisma.evenement.findMany({
      where: { entityType, entityId },
      orderBy: { occurredAt: 'desc' },
      include: {
        acteur: { select: { id: true, nom: true, prenom: true } },
      },
    });
    return events.map((e) => ({
      ...e,
      payload: e.payload ? JSON.parse(e.payload) : null,
    }));
  }
}
