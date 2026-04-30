import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateMaquetteInput, UpdateMaquetteInput } from '@ogade/shared';

const AGENT_SELECT = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
} as const;

const DEFAUT_SELECT = {
  id: true,
  typeDefaut: true,
  position: true,
  dimension: true,
  description: true,
  severite: true,
  longueur: true,
  largeur: true,
  profondeur: true,
  diametre: true,
  cote: true,
  certifie: true,
  posX: true,
  posY: true,
  couleur: true,
  detecteLe: true,
} as const;

const MAQUETTE_LIST_INCLUDE = {
  proprietaire: { select: AGENT_SELECT },
  emprunteur: { select: AGENT_SELECT },
  defauts: { select: DEFAUT_SELECT, orderBy: { id: 'asc' as const } },
  _count: { select: { defauts: true } },
};

const MAQUETTE_DETAIL_INCLUDE = {
  ...MAQUETTE_LIST_INCLUDE,
  createdBy: { select: AGENT_SELECT },
  updatedBy: { select: AGENT_SELECT },
};

@Injectable()
export class MaquettesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    page: number;
    pageSize: number;
    etat?: string;
    site?: string;
    typeMaquette?: string;
    categorie?: string;
    forme?: string;
    matiere?: string;
    referenceASN?: boolean;
    horsPatrimoine?: boolean;
    enTransit?: boolean;
    search?: string;
  }) {
    const {
      page,
      pageSize,
      etat,
      site,
      typeMaquette,
      categorie,
      forme,
      matiere,
      referenceASN,
      horsPatrimoine,
      enTransit,
      search,
    } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {
      deletedAt: null,
      AND: [] as any[],
    };

    if (etat) where.AND.push({ etat });
    if (site) where.AND.push({ site });
    if (typeMaquette) where.AND.push({ typeMaquette });
    if (categorie) where.AND.push({ categorie });
    if (forme) where.AND.push({ forme });
    if (matiere) where.AND.push({ matiere });
    if (referenceASN !== undefined) where.AND.push({ referenceASN });
    if (horsPatrimoine !== undefined) where.AND.push({ horsPatrimoine });
    if (enTransit !== undefined) where.AND.push({ enTransit });
    if (search) {
      where.AND.push({
        OR: [
          { reference: { contains: search, mode: 'insensitive' } },
          { libelle: { contains: search, mode: 'insensitive' } },
          { composant: { contains: search, mode: 'insensitive' } },
          { matiere: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (where.AND.length === 0) delete where.AND;

    const [data, total] = await Promise.all([
      this.prisma.maquette.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: MAQUETTE_LIST_INCLUDE,
      }),
      this.prisma.maquette.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async stats() {
    const where = { deletedAt: null };
    const [total, stock, empruntees, transit, asn, hs, enReparation] =
      await Promise.all([
        this.prisma.maquette.count({ where }),
        this.prisma.maquette.count({ where: { ...where, etat: 'STOCK' } }),
        this.prisma.maquette.count({ where: { ...where, etat: 'EMPRUNTEE' } }),
        this.prisma.maquette.count({ where: { ...where, enTransit: true } }),
        this.prisma.maquette.count({ where: { ...where, referenceASN: true } }),
        this.prisma.maquette.count({ where: { ...where, etat: 'REBUT' } }),
        this.prisma.maquette.count({ where: { ...where, etat: 'EN_REPARATION' } }),
      ]);
    return {
      total,
      stock,
      empruntees,
      transit,
      empruntesOuTransit: empruntees + transit,
      asn,
      hs,
      enReparation,
      requalifier: enReparation,
    };
  }

  async findOne(id: number) {
    const maquette = await this.prisma.maquette.findFirst({
      where: { id, deletedAt: null },
      include: MAQUETTE_DETAIL_INCLUDE,
    });
    if (!maquette) {
      throw new NotFoundException(`Maquette #${id} not found`);
    }
    return maquette;
  }

  async create(data: CreateMaquetteInput, userId?: number) {
    const created = await this.prisma.maquette.create({
      data: {
        ...data,
        createdById: userId ?? null,
      },
    });
    return this.prisma.maquette.findUnique({
      where: { id: created.id },
      include: MAQUETTE_DETAIL_INCLUDE,
    });
  }

  async update(id: number, data: UpdateMaquetteInput, userId?: number) {
    await this.findOne(id);
    return this.prisma.maquette.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId ?? null,
      },
      include: MAQUETTE_DETAIL_INCLUDE,
    });
  }

  async softDelete(id: number) {
    await this.findOne(id);
    return this.prisma.maquette.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async emprunter(id: number, emprunteurId: number) {
    const maquette = await this.findOne(id);
    if (maquette.etat !== 'STOCK') {
      throw new BadRequestException(
        `Maquette #${id} is not in STOCK state (current: ${maquette.etat})`,
      );
    }
    return this.prisma.maquette.update({
      where: { id },
      data: {
        etat: 'EMPRUNTEE',
        emprunteurId,
        dateEmprunt: new Date(),
      },
      include: MAQUETTE_DETAIL_INCLUDE,
    });
  }

  async retourner(id: number) {
    const maquette = await this.findOne(id);
    if (maquette.etat !== 'EMPRUNTEE') {
      throw new BadRequestException(
        `Maquette #${id} is not EMPRUNTEE (current: ${maquette.etat})`,
      );
    }
    return this.prisma.maquette.update({
      where: { id },
      data: {
        etat: 'STOCK',
        emprunteurId: null,
        dateRetour: new Date(),
      },
      include: MAQUETTE_DETAIL_INCLUDE,
    });
  }
}
