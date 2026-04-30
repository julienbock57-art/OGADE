import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EvenementsService } from '../evenements/evenements.service';
import type { CreateMaterielInput, UpdateMaterielInput } from '@ogade/shared';

const materielInclude = {
  responsable: { select: { id: true, nom: true, prenom: true } },
};

const TRACKED_FIELDS = [
  'reference', 'libelle', 'etat', 'typeMateriel', 'numeroSerie',
  'localisation', 'site', 'description', 'dateEtalonnage',
  'dateProchainEtalonnage', 'modele', 'typeTraducteur', 'typeEND',
  'groupe', 'fournisseur', 'validiteEtalonnage', 'soumisVerification',
  'enPret', 'motifPret', 'dateRetourPret', 'completude',
  'informationVerifiee', 'produitsChimiques', 'commentaires',
  'entreprise', 'responsableId', 'commentaireEtat',
  'commentairesCompletude', 'numeroFIEC', 'enTransit', 'lotChaine',
  'complementsLocalisation', 'proprietaire',
];

function normalize(v: any): string | number | boolean | null {
  if (v === undefined || v === null) return null;
  if (v instanceof Date) return v.toISOString();
  return v;
}

@Injectable()
export class MaterielsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evenements: EvenementsService,
  ) {}

  async findAll(params: {
    page: number;
    pageSize: number;
    etat?: string;
    site?: string;
    typeEND?: string;
    typeMateriel?: string;
    groupe?: string;
    search?: string;
    completude?: string;
    enPret?: string;
    etalonnageEchu?: string;
    echeance30j?: string;
    hsIncomplet?: string;
    responsableId?: number;
  }) {
    const { page, pageSize, etat, site, typeEND, typeMateriel, groupe, search, completude, enPret, etalonnageEchu, echeance30j, hsIncomplet, responsableId } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {
      deletedAt: null,
      AND: [] as any[],
    };

    if (etat) where.AND.push({ etat });
    if (site) where.AND.push({ site });
    if (typeEND) where.AND.push({ typeEND });
    if (typeMateriel) where.AND.push({ typeMateriel });
    if (groupe) where.AND.push({ groupe });
    if (completude) where.AND.push({ completude });
    if (responsableId) where.AND.push({ responsableId });
    if (enPret === 'true') where.AND.push({ enPret: true });
    if (enPret === 'false') where.AND.push({ enPret: false });

    if (etalonnageEchu === 'true') {
      where.AND.push({
        soumisVerification: true,
        dateProchainEtalonnage: { lt: new Date() },
      });
    }

    if (echeance30j === 'true') {
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 86400000);
      where.AND.push({
        soumisVerification: true,
        dateProchainEtalonnage: { gte: now, lte: in30Days },
      });
    }

    if (hsIncomplet === 'true') {
      where.AND.push({
        OR: [
          { etat: { in: ['HS', 'PERDU'] } },
          { completude: 'INCOMPLET' },
        ],
      });
    }

    if (search) {
      where.AND.push({
        OR: [
          { reference: { contains: search, mode: 'insensitive' } },
          { libelle: { contains: search, mode: 'insensitive' } },
          { modele: { contains: search, mode: 'insensitive' } },
          { numeroFIEC: { contains: search, mode: 'insensitive' } },
          { fournisseur: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (where.AND.length === 0) delete where.AND;

    const [data, total] = await Promise.all([
      this.prisma.materiel.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: materielInclude,
      }),
      this.prisma.materiel.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async stats() {
    const where = { deletedAt: null };
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 86400000);

    const [total, echus, prochains, enPret, hs, incomplets] = await Promise.all([
      this.prisma.materiel.count({ where }),
      this.prisma.materiel.count({
        where: {
          ...where,
          soumisVerification: true,
          dateProchainEtalonnage: { lt: now },
        },
      }),
      this.prisma.materiel.count({
        where: {
          ...where,
          soumisVerification: true,
          dateProchainEtalonnage: { gte: now, lte: in30Days },
        },
      }),
      this.prisma.materiel.count({ where: { ...where, enPret: true } }),
      this.prisma.materiel.count({
        where: { ...where, etat: { in: ['HS', 'PERDU'] } },
      }),
      this.prisma.materiel.count({
        where: { ...where, completude: 'INCOMPLET' },
      }),
    ]);

    return { total, echus, prochains, enPret, hs, incomplets };
  }

  async findOne(id: number) {
    const materiel = await this.prisma.materiel.findFirst({
      where: { id, deletedAt: null },
      include: materielInclude,
    });
    if (!materiel) {
      throw new NotFoundException(`Materiel #${id} not found`);
    }
    return materiel;
  }

  async create(data: CreateMaterielInput, userId?: number) {
    const materiel = await this.prisma.materiel.create({
      data: { ...data, createdById: userId ?? null },
      include: materielInclude,
    });

    const changedFields: Record<string, { old: any; new: any }> = {};
    for (const field of TRACKED_FIELDS) {
      const val = normalize((materiel as any)[field]);
      if (val !== null) {
        changedFields[field] = { old: null, new: val };
      }
    }

    await this.evenements.create({
      entityType: 'MATERIEL',
      entityId: materiel.id,
      eventType: 'CREATED',
      payload: { changedFields, summary: 'Création de la fiche' },
      acteurId: userId,
    });

    return materiel;
  }

  async update(id: number, data: UpdateMaterielInput, userId?: number) {
    const before = await this.findOne(id);

    const materiel = await this.prisma.materiel.update({
      where: { id },
      data: { ...data, updatedById: userId ?? null },
      include: materielInclude,
    });

    const changedFields: Record<string, { old: any; new: any }> = {};
    for (const field of TRACKED_FIELDS) {
      if (!(field in data)) continue;
      const oldVal = normalize((before as any)[field]);
      const newVal = normalize((materiel as any)[field]);
      if (oldVal !== newVal) {
        changedFields[field] = { old: oldVal, new: newVal };
      }
    }

    if (Object.keys(changedFields).length > 0) {
      const count = Object.keys(changedFields).length;
      await this.evenements.create({
        entityType: 'MATERIEL',
        entityId: materiel.id,
        eventType: 'UPDATED',
        payload: {
          changedFields,
          summary: `${count} champ${count > 1 ? 's' : ''} modifié${count > 1 ? 's' : ''}`,
        },
        acteurId: userId,
      });
    }

    return materiel;
  }

  async softDelete(id: number, userId?: number) {
    await this.findOne(id);
    const materiel = await this.prisma.materiel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.evenements.create({
      entityType: 'MATERIEL',
      entityId: id,
      eventType: 'DELETED',
      payload: { summary: 'Suppression de la fiche' },
      acteurId: userId,
    });

    return materiel;
  }

  async findHistorique(materielId: number) {
    await this.findOne(materielId);
    return this.evenements.findByEntity('MATERIEL', materielId);
  }
}
