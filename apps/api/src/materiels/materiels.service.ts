import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateMaterielInput, UpdateMaterielInput } from '@ogade/shared';

const materielInclude = {
  responsable: { select: { id: true, nom: true, prenom: true } },
};

@Injectable()
export class MaterielsService {
  constructor(private readonly prisma: PrismaService) {}

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
  }) {
    const { page, pageSize, etat, site, typeEND, typeMateriel, groupe, search, completude, enPret } = params;
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
    if (enPret === 'true') where.AND.push({ enPret: true });
    if (enPret === 'false') where.AND.push({ enPret: false });
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
    return this.prisma.materiel.create({
      data: { ...data, createdById: userId ?? null },
      include: materielInclude,
    });
  }

  async update(id: number, data: UpdateMaterielInput, userId?: number) {
    await this.findOne(id);
    return this.prisma.materiel.update({
      where: { id },
      data: { ...data, updatedById: userId ?? null },
      include: materielInclude,
    });
  }

  async softDelete(id: number) {
    await this.findOne(id);
    return this.prisma.materiel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
