import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateMaterielInput, UpdateMaterielInput } from '@ogade/shared';

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
  }) {
    const { page, pageSize, etat, site, typeEND, typeMateriel, groupe, search } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {
      deletedAt: null,
      AND: [] as any[],
    };

    if (etat) {
      where.AND.push({ etat });
    }
    if (site) {
      where.AND.push({ site });
    }
    if (typeEND) {
      where.AND.push({ typeEND });
    }
    if (typeMateriel) {
      where.AND.push({ typeMateriel });
    }
    if (groupe) {
      where.AND.push({ groupe });
    }
    if (search) {
      where.AND.push({
        OR: [
          { reference: { contains: search, mode: 'insensitive' } },
          { libelle: { contains: search, mode: 'insensitive' } },
          { modele: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const [data, total] = await Promise.all([
      this.prisma.materiel.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.materiel.count({ where }),
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
    const materiel = await this.prisma.materiel.findFirst({
      where: { id, deletedAt: null },
    });
    if (!materiel) {
      throw new NotFoundException(`Materiel #${id} not found`);
    }
    return materiel;
  }

  async create(data: CreateMaterielInput, userId?: number) {
    return this.prisma.materiel.create({
      data: {
        ...data,
        createdById: userId ?? null,
      },
    });
  }

  async update(id: number, data: UpdateMaterielInput, userId?: number) {
    await this.findOne(id);
    return this.prisma.materiel.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId ?? null,
      },
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
