import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDemandeEnvoiInput, UpdateDemandeEnvoiInput } from '@ogade/shared';

@Injectable()
export class DemandesEnvoiService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    page: number;
    pageSize: number;
    statut?: string;
    type?: string;
  }) {
    const { page, pageSize, statut, type } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (statut) {
      where.statut = statut;
    }
    if (type) {
      where.type = type;
    }

    const [data, total] = await Promise.all([
      this.prisma.demandeEnvoi.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          demandeur: { select: { id: true, nom: true, prenom: true, email: true } },
          _count: { select: { lignes: true } },
        },
      }),
      this.prisma.demandeEnvoi.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    const demande = await this.prisma.demandeEnvoi.findUnique({
      where: { id },
      include: {
        demandeur: { select: { id: true, nom: true, prenom: true, email: true } },
        lignes: {
          include: {
            materiel: { select: { id: true, reference: true, libelle: true } },
            maquette: { select: { id: true, reference: true, libelle: true } },
          },
        },
      },
    });
    if (!demande) {
      throw new NotFoundException(`Demande d'envoi #${id} not found`);
    }
    return demande;
  }

  async create(data: CreateDemandeEnvoiInput, demandeurId: number) {
    const numero = await this.generateNumero();
    const { lignes, ...demandeData } = data;

    return this.prisma.demandeEnvoi.create({
      data: {
        ...demandeData,
        numero,
        demandeurId,
        lignes: {
          create: lignes.map((ligne) => ({
            materielId: ligne.materielId ?? null,
            maquetteId: ligne.maquetteId ?? null,
            quantite: ligne.quantite,
          })),
        },
      },
      include: {
        demandeur: { select: { id: true, nom: true, prenom: true, email: true } },
        lignes: {
          include: {
            materiel: { select: { id: true, reference: true, libelle: true } },
            maquette: { select: { id: true, reference: true, libelle: true } },
          },
        },
      },
    });
  }

  async update(id: number, data: UpdateDemandeEnvoiInput) {
    await this.findOne(id);
    return this.prisma.demandeEnvoi.update({
      where: { id },
      data,
      include: {
        demandeur: { select: { id: true, nom: true, prenom: true, email: true } },
        lignes: {
          include: {
            materiel: { select: { id: true, reference: true, libelle: true } },
            maquette: { select: { id: true, reference: true, libelle: true } },
          },
        },
      },
    });
  }

  async addLigne(demandeId: number, ligne: { materielId?: number; maquetteId?: number; quantite?: number }) {
    await this.findOne(demandeId);
    return this.prisma.demandeEnvoiLigne.create({
      data: {
        demandeId,
        materielId: ligne.materielId ?? null,
        maquetteId: ligne.maquetteId ?? null,
        quantite: ligne.quantite ?? 1,
      },
      include: {
        materiel: { select: { id: true, reference: true, libelle: true } },
        maquette: { select: { id: true, reference: true, libelle: true } },
      },
    });
  }

  async removeLigne(demandeId: number, ligneId: number) {
    await this.findOne(demandeId);
    const ligne = await this.prisma.demandeEnvoiLigne.findFirst({
      where: { id: ligneId, demandeId },
    });
    if (!ligne) {
      throw new NotFoundException(`Ligne #${ligneId} not found in demande #${demandeId}`);
    }
    await this.prisma.demandeEnvoiLigne.delete({ where: { id: ligneId } });
  }

  private async generateNumero(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `DE-${year}-`;

    const lastDemande = await this.prisma.demandeEnvoi.findFirst({
      where: { numero: { startsWith: prefix } },
      orderBy: { numero: 'desc' },
    });

    let nextNum = 1;
    if (lastDemande) {
      const lastNum = parseInt(lastDemande.numero.replace(prefix, ''), 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }

    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }
}
