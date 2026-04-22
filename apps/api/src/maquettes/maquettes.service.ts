import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateMaquetteInput, UpdateMaquetteInput } from '@ogade/shared';

@Injectable()
export class MaquettesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    page: number;
    pageSize: number;
    etat?: string;
    site?: string;
    typeMaquette?: string;
    search?: string;
  }) {
    const { page, pageSize, etat, site, typeMaquette, search } = params;
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
    if (typeMaquette) {
      where.AND.push({ typeMaquette });
    }
    if (search) {
      where.AND.push({
        OR: [
          { reference: { contains: search, mode: 'insensitive' } },
          { libelle: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const [data, total] = await Promise.all([
      this.prisma.maquette.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.maquette.count({ where }),
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
    const maquette = await this.prisma.maquette.findFirst({
      where: { id, deletedAt: null },
    });
    if (!maquette) {
      throw new NotFoundException(`Maquette #${id} not found`);
    }
    return maquette;
  }

  async create(data: CreateMaquetteInput, userId?: number) {
    return this.prisma.maquette.create({
      data: {
        ...data,
        createdById: userId ?? null,
      },
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
    });
  }
}
