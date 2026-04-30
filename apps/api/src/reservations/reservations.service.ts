import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateReservationInput,
  UpdateReservationInput,
} from '@ogade/shared';

const MATERIEL_SELECT = {
  id: true,
  reference: true,
  libelle: true,
  typeMateriel: true,
  modele: true,
  site: true,
  localisation: true,
} as const;

const DEMANDEUR_SELECT = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
} as const;

const ANNULE_PAR_SELECT = {
  id: true,
  nom: true,
  prenom: true,
} as const;

const RESERVATION_INCLUDE = {
  materiel: { select: MATERIEL_SELECT },
  demandeur: { select: DEMANDEUR_SELECT },
  annulePar: { select: ANNULE_PAR_SELECT },
} as const;

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    page: number;
    pageSize: number;
    statut?: string;
    type?: string;
    materielId?: number;
    demandeurId?: number;
    period?: 'actuelles' | 'venir' | 'passees';
    search?: string;
    dateMin?: Date;
    dateMax?: Date;
  }) {
    const {
      page,
      pageSize,
      statut,
      type,
      materielId,
      demandeurId,
      period,
      search,
      dateMin,
      dateMax,
    } = params;
    const skip = (page - 1) * pageSize;
    const now = new Date();

    const where: any = {};
    if (statut) where.statut = statut;
    if (type) where.type = type;
    if (materielId) where.materielId = materielId;
    if (demandeurId) where.demandeurId = demandeurId;
    if (period === 'actuelles') {
      where.statut = where.statut ?? 'CONFIRMEE';
      where.dateDebut = { lte: now };
      where.dateFin = { gte: now };
    } else if (period === 'venir') {
      where.statut = where.statut ?? 'CONFIRMEE';
      where.dateDebut = { gt: now };
    } else if (period === 'passees') {
      where.dateFin = { lt: now };
    }
    if (dateMin && dateMax) {
      // Overlap with [dateMin, dateMax]: dateDebut <= dateMax AND dateFin >= dateMin
      where.AND = [
        { dateDebut: { lte: dateMax } },
        { dateFin: { gte: dateMin } },
      ];
    } else if (dateMin) {
      where.dateFin = { ...(where.dateFin ?? {}), gte: dateMin };
    } else if (dateMax) {
      where.dateDebut = { ...(where.dateDebut ?? {}), lte: dateMax };
    }
    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { motif: { contains: search, mode: 'insensitive' } },
        {
          materiel: {
            OR: [
              { reference: { contains: search, mode: 'insensitive' } },
              { libelle: { contains: search, mode: 'insensitive' } },
              { modele: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { dateDebut: 'asc' },
        include: RESERVATION_INCLUDE,
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async stats(currentAgentId?: number) {
    const now = new Date();
    const inAWeek = new Date(now.getTime() + 7 * 86400000);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [total, actives, cetteSemaine, aujourdhui, mesReservations] =
      await Promise.all([
        this.prisma.reservation.count(),
        this.prisma.reservation.count({
          where: { statut: 'CONFIRMEE', dateFin: { gte: now } },
        }),
        this.prisma.reservation.count({
          where: {
            statut: 'CONFIRMEE',
            dateDebut: { gte: now, lte: inAWeek },
          },
        }),
        this.prisma.reservation.count({
          where: {
            statut: 'CONFIRMEE',
            dateDebut: { gte: startOfDay, lte: endOfDay },
          },
        }),
        currentAgentId
          ? this.prisma.reservation.count({
              where: { demandeurId: currentAgentId, statut: 'CONFIRMEE' },
            })
          : Promise.resolve(0),
      ]);

    return { total, actives, cetteSemaine, aujourdhui, mesReservations };
  }

  async findOne(id: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: RESERVATION_INCLUDE,
    });
    if (!reservation) {
      throw new NotFoundException(`Réservation #${id} introuvable`);
    }
    return reservation;
  }

  async findForMateriel(materielId: number) {
    return this.prisma.reservation.findMany({
      where: { materielId },
      orderBy: { dateDebut: 'desc' },
      include: RESERVATION_INCLUDE,
    });
  }

  async checkConflicts(params: {
    materielId: number;
    dateDebut: Date;
    dateFin: Date;
    excludeId?: number;
  }) {
    const { materielId, dateDebut, dateFin, excludeId } = params;
    const where: any = {
      materielId,
      statut: 'CONFIRMEE',
      dateDebut: { lte: dateFin },
      dateFin: { gte: dateDebut },
    };
    if (excludeId) where.id = { not: excludeId };

    const conflicts = await this.prisma.reservation.findMany({
      where,
      orderBy: { dateDebut: 'asc' },
      select: {
        id: true,
        numero: true,
        dateDebut: true,
        dateFin: true,
        type: true,
      },
    });
    return conflicts.map((c) => ({
      kind: 'reservation' as const,
      id: c.id,
      numero: c.numero,
      label: `${c.numero} · Réservation`,
      dateDebut: c.dateDebut,
      dateFin: c.dateFin,
    }));
  }

  async create(data: CreateReservationInput, demandeurId: number) {
    if (data.dateFin < data.dateDebut) {
      throw new BadRequestException(
        'La date de fin doit être postérieure à la date de début',
      );
    }
    const materiel = await this.prisma.materiel.findUnique({
      where: { id: data.materielId },
    });
    if (!materiel || materiel.deletedAt) {
      throw new NotFoundException(
        `Matériel #${data.materielId} introuvable`,
      );
    }

    const conflicts = await this.checkConflicts({
      materielId: data.materielId,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
    });
    if (conflicts.length > 0) {
      throw new BadRequestException({
        message:
          'Conflit avec une réservation existante sur la période demandée',
        conflicts,
      });
    }

    const numero = await this.generateNumero();
    return this.prisma.reservation.create({
      data: {
        numero,
        materielId: data.materielId,
        demandeurId,
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        type: data.type ?? 'AUTRE',
        motif: data.motif ?? null,
        commentaire: data.commentaire ?? null,
        statut: 'CONFIRMEE',
      },
      include: RESERVATION_INCLUDE,
    });
  }

  async update(id: number, data: UpdateReservationInput) {
    const existing = await this.findOne(id);

    if (data.dateDebut || data.dateFin) {
      const debut = data.dateDebut ?? existing.dateDebut;
      const fin = data.dateFin ?? existing.dateFin;
      if (fin < debut) {
        throw new BadRequestException(
          'La date de fin doit être postérieure à la date de début',
        );
      }
      const conflicts = await this.checkConflicts({
        materielId: existing.materielId,
        dateDebut: debut,
        dateFin: fin,
        excludeId: id,
      });
      if (conflicts.length > 0) {
        throw new BadRequestException({
          message:
            'Conflit avec une réservation existante sur la période demandée',
          conflicts,
        });
      }
    }

    return this.prisma.reservation.update({
      where: { id },
      data: {
        ...(data.dateDebut !== undefined ? { dateDebut: data.dateDebut } : {}),
        ...(data.dateFin !== undefined ? { dateFin: data.dateFin } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.motif !== undefined ? { motif: data.motif } : {}),
        ...(data.commentaire !== undefined
          ? { commentaire: data.commentaire }
          : {}),
        ...(data.statut !== undefined ? { statut: data.statut } : {}),
        ...(data.motifAnnulation !== undefined
          ? { motifAnnulation: data.motifAnnulation }
          : {}),
      },
      include: RESERVATION_INCLUDE,
    });
  }

  async cancel(id: number, agentId: number, motif?: string) {
    await this.findOne(id);
    return this.prisma.reservation.update({
      where: { id },
      data: {
        statut: 'ANNULEE',
        annuleParId: agentId,
        annuleLe: new Date(),
        motifAnnulation: motif ?? null,
      },
      include: RESERVATION_INCLUDE,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.reservation.delete({ where: { id } });
  }

  private async generateNumero(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RS-${year}-`;
    const last = await this.prisma.reservation.findFirst({
      where: { numero: { startsWith: prefix } },
      orderBy: { numero: 'desc' },
    });
    let next = 1;
    if (last) {
      const n = parseInt(last.numero.replace(prefix, ''), 10);
      if (!isNaN(n)) next = n + 1;
    }
    return `${prefix}${String(next).padStart(4, '0')}`;
  }
}
