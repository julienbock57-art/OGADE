import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDemandeEnvoiInput, UpdateDemandeEnvoiInput } from '@ogade/shared';

const AGENT_SELECT = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
} as const;

const MATERIEL_SELECT = {
  id: true,
  reference: true,
  libelle: true,
  responsableId: true,
  responsable: { select: AGENT_SELECT },
  site: true,
  typeMateriel: true,
} as const;

const MAQUETTE_SELECT = {
  id: true,
  reference: true,
  libelle: true,
  referentId: true,
  referent: { select: AGENT_SELECT },
  site: true,
  typeMaquette: true,
} as const;

const LIGNE_INCLUDE = {
  materiel: { select: MATERIEL_SELECT },
  maquette: { select: MAQUETTE_SELECT },
  validateur: { select: AGENT_SELECT },
} as const;

const DEMANDE_DETAIL_INCLUDE = {
  demandeur: { select: AGENT_SELECT },
  magasinierEnvoi: { select: AGENT_SELECT },
  magasinierReception: { select: AGENT_SELECT },
  magasinierRetour: { select: AGENT_SELECT },
  lignes: { include: LIGNE_INCLUDE },
} as const;

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
          demandeur: { select: AGENT_SELECT },
          _count: { select: { lignes: true } },
          lignes: {
            select: { id: true, statut: true },
          },
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
      include: DEMANDE_DETAIL_INCLUDE,
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
        statut: 'BROUILLON',
        lignes: {
          create: lignes.map((ligne) => ({
            materielId: ligne.materielId ?? null,
            maquetteId: ligne.maquetteId ?? null,
            quantite: ligne.quantite,
            statut: 'EN_ATTENTE',
          })),
        },
      },
      include: DEMANDE_DETAIL_INCLUDE,
    });
  }

  async update(id: number, data: UpdateDemandeEnvoiInput) {
    await this.findOne(id);
    return this.prisma.demandeEnvoi.update({
      where: { id },
      data,
      include: DEMANDE_DETAIL_INCLUDE,
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
        statut: 'EN_ATTENTE',
      },
      include: LIGNE_INCLUDE,
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
