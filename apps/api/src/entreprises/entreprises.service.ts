import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntreprisesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(type?: string) {
    return this.prisma.entreprise.findMany({
      where: { actif: true, ...(type ? { type } : {}) },
      orderBy: { label: 'asc' },
    });
  }

  async findOne(id: number) {
    const ent = await this.prisma.entreprise.findUnique({ where: { id } });
    if (!ent) throw new NotFoundException(`Entreprise #${id} not found`);
    return ent;
  }

  async create(data: {
    code: string;
    label: string;
    type?: string;
    adresse?: string;
    codePostal?: string;
    ville?: string;
    pays?: string;
    telephone?: string;
    email?: string;
    siret?: string;
  }) {
    return this.prisma.entreprise.create({ data });
  }

  async update(id: number, data: Partial<{
    label: string;
    type: string;
    adresse: string;
    codePostal: string;
    ville: string;
    pays: string;
    telephone: string;
    email: string;
    siret: string;
    actif: boolean;
  }>) {
    await this.findOne(id);
    return this.prisma.entreprise.update({ where: { id }, data });
  }
}
