import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.site.findMany({
      where: { actif: true },
      orderBy: { label: 'asc' },
    });
  }

  async findOne(id: number) {
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site) throw new NotFoundException(`Site #${id} not found`);
    return site;
  }

  async create(data: {
    code: string;
    label: string;
    adresse?: string;
    codePostal?: string;
    ville?: string;
    pays?: string;
    telephone?: string;
    email?: string;
  }) {
    return this.prisma.site.create({ data });
  }

  async update(id: number, data: Partial<{
    label: string;
    adresse: string;
    codePostal: string;
    ville: string;
    pays: string;
    telephone: string;
    email: string;
    actif: boolean;
  }>) {
    await this.findOne(id);
    return this.prisma.site.update({ where: { id }, data });
  }
}
