import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async submit(id: number, userId: number) {
    const demande = await this.findOne(id);
    if (demande.statut !== 'BROUILLON') {
      throw new BadRequestException(
        `Impossible de soumettre une demande au statut ${demande.statut}`,
      );
    }
    if (demande.demandeurId !== userId) {
      throw new ForbiddenException("Seul le demandeur peut soumettre cette demande");
    }
    if (demande.lignes.length === 0) {
      throw new BadRequestException('La demande doit contenir au moins une ligne');
    }
    return this.prisma.demandeEnvoi.update({
      where: { id },
      data: {
        statut: 'SOUMISE',
        dateSoumission: new Date(),
      },
      include: DEMANDE_DETAIL_INCLUDE,
    });
  }

  async validateLigne(
    demandeId: number,
    ligneId: number,
    user: { agentId: number; roles: string[] },
  ) {
    const ligne = await this.assertReferentCanAct(demandeId, ligneId, user);
    if (ligne.statut !== 'EN_ATTENTE') {
      throw new BadRequestException(
        `Ligne déjà ${ligne.statut.toLowerCase()}`,
      );
    }
    await this.prisma.demandeEnvoiLigne.update({
      where: { id: ligneId },
      data: {
        statut: 'VALIDEE',
        validateurId: user.agentId,
        valideeLe: new Date(),
        motifRefus: null,
      },
    });
    await this.recomputeDemandeStatut(demandeId);
    return this.findOne(demandeId);
  }

  async refuseLigne(
    demandeId: number,
    ligneId: number,
    motif: string,
    user: { agentId: number; roles: string[] },
  ) {
    const ligne = await this.assertReferentCanAct(demandeId, ligneId, user);
    if (ligne.statut !== 'EN_ATTENTE') {
      throw new BadRequestException(
        `Ligne déjà ${ligne.statut.toLowerCase()}`,
      );
    }
    await this.prisma.demandeEnvoiLigne.update({
      where: { id: ligneId },
      data: {
        statut: 'REFUSEE',
        validateurId: user.agentId,
        valideeLe: new Date(),
        motifRefus: motif,
      },
    });
    await this.recomputeDemandeStatut(demandeId);
    return this.findOne(demandeId);
  }

  async findInbox(userId: number, params: { page: number; pageSize: number }) {
    const { page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const where = {
      statut: 'EN_ATTENTE',
      demande: { statut: { in: ['SOUMISE', 'VALIDEE_PARTIELLEMENT'] } },
      OR: [
        { materiel: { responsableId: userId } },
        { maquette: { referentId: userId } },
      ],
    };

    const [data, total] = await Promise.all([
      this.prisma.demandeEnvoiLigne.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: {
          ...LIGNE_INCLUDE,
          demande: {
            select: {
              id: true,
              numero: true,
              type: true,
              typeEnvoi: true,
              destinataire: true,
              motif: true,
              urgence: true,
              dateSouhaitee: true,
              demandeur: { select: AGENT_SELECT },
            },
          },
        },
      }),
      this.prisma.demandeEnvoiLigne.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private async assertReferentCanAct(
    demandeId: number,
    ligneId: number,
    user: { agentId: number; roles: string[] },
  ) {
    const ligne = await this.prisma.demandeEnvoiLigne.findFirst({
      where: { id: ligneId, demandeId },
      include: {
        materiel: { select: { responsableId: true } },
        maquette: { select: { referentId: true } },
        demande: { select: { statut: true } },
      },
    });
    if (!ligne) {
      throw new NotFoundException(`Ligne #${ligneId} not found in demande #${demandeId}`);
    }
    const demandeStatut = ligne.demande.statut;
    if (demandeStatut !== 'SOUMISE' && demandeStatut !== 'VALIDEE_PARTIELLEMENT') {
      throw new BadRequestException(
        `La demande doit être soumise pour être validée (statut actuel : ${demandeStatut})`,
      );
    }
    if (user.roles.includes('ADMIN')) return ligne;

    const responsableId =
      ligne.materiel?.responsableId ?? ligne.maquette?.referentId ?? null;
    if (responsableId !== user.agentId) {
      throw new ForbiddenException(
        "Vous n'êtes pas le référent désigné pour cet item",
      );
    }
    return ligne;
  }

  private async recomputeDemandeStatut(demandeId: number) {
    const lignes = await this.prisma.demandeEnvoiLigne.findMany({
      where: { demandeId },
      select: { statut: true },
    });
    if (lignes.length === 0) return;

    const enAttente = lignes.some((l) => l.statut === 'EN_ATTENTE');
    const validees = lignes.filter((l) => l.statut === 'VALIDEE').length;
    const refusees = lignes.filter((l) => l.statut === 'REFUSEE').length;
    const total = lignes.length;

    let nextStatut: string | null = null;
    if (enAttente) {
      nextStatut = validees > 0 || refusees > 0 ? 'VALIDEE_PARTIELLEMENT' : 'SOUMISE';
    } else if (refusees === total) {
      nextStatut = 'REFUSEE';
    } else {
      nextStatut = 'VALIDEE';
    }

    const data: { statut: string; dateValidation?: Date } = { statut: nextStatut };
    if (nextStatut === 'VALIDEE' || nextStatut === 'REFUSEE') {
      data.dateValidation = new Date();
    }
    await this.prisma.demandeEnvoi.update({ where: { id: demandeId }, data });
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
