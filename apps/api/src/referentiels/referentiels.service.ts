import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferentielsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByType(type: string) {
    return this.prisma.referentiel.findMany({
      where: { type, actif: true },
      orderBy: [{ position: 'asc' }, { label: 'asc' }],
    });
  }

  async findAllTypes() {
    const results = await this.prisma.referentiel.findMany({
      select: { type: true },
      distinct: ['type'],
      orderBy: { type: 'asc' },
    });
    return results.map((r) => r.type);
  }

  async create(data: { type: string; code: string; label: string; position?: number }) {
    return this.prisma.referentiel.create({ data });
  }

  async update(id: number, data: { label?: string; position?: number; actif?: boolean }) {
    return this.prisma.referentiel.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.referentiel.update({
      where: { id },
      data: { actif: false },
    });
  }
}
