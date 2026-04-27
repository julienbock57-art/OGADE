import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateAgentInput, UpdateAgentInput } from '@ogade/shared';

function stripPassword(agent: Record<string, unknown>) {
  const { passwordHash, ...rest } = agent;
  return { ...rest, hasPassword: !!passwordHash };
}

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { page: number; pageSize: number }) {
    const { page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.agent.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { roles: { include: { role: true } } },
      }),
      this.prisma.agent.count(),
    ]);

    return {
      data: data.map(stripPassword),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    if (!agent) {
      throw new NotFoundException(`Agent #${id} not found`);
    }
    return stripPassword(agent);
  }

  async create(data: CreateAgentInput) {
    const agent = await this.prisma.agent.create({
      data,
      include: { roles: { include: { role: true } } },
    });
    return stripPassword(agent);
  }

  async update(id: number, data: UpdateAgentInput & { passwordHash?: string | null }) {
    await this.findOne(id);
    const agent = await this.prisma.agent.update({
      where: { id },
      data,
      include: { roles: { include: { role: true } } },
    });
    return stripPassword(agent);
  }

  async assignRole(agentId: number, roleCode: string, grantedBy?: number) {
    await this.findOne(agentId);
    const role = await this.prisma.role.findUnique({
      where: { code: roleCode },
    });
    if (!role) {
      throw new NotFoundException(`Role "${roleCode}" not found`);
    }

    await this.prisma.agentRole.upsert({
      where: {
        agentId_roleId: { agentId, roleId: role.id },
      },
      create: {
        agentId,
        roleId: role.id,
        grantedBy: grantedBy ?? null,
      },
      update: {},
    });

    return this.findOne(agentId);
  }

  async removeRole(agentId: number, roleCode: string) {
    await this.findOne(agentId);
    const role = await this.prisma.role.findUnique({
      where: { code: roleCode },
    });
    if (!role) {
      throw new NotFoundException(`Role "${roleCode}" not found`);
    }

    await this.prisma.agentRole.deleteMany({
      where: { agentId, roleId: role.id },
    });

    return this.findOne(agentId);
  }

  async remove(id: number) {
    await this.findOne(id);

    const demandeCount = await this.prisma.demandeEnvoi.count({
      where: { demandeurId: id },
    });
    if (demandeCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer cet agent : il est demandeur de ${demandeCount} demande(s) d'envoi.`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.maquette.updateMany({ where: { createdById: id }, data: { createdById: null } }),
      this.prisma.maquette.updateMany({ where: { updatedById: id }, data: { updatedById: null } }),
      this.prisma.maquette.updateMany({ where: { proprietaireId: id }, data: { proprietaireId: null } }),
      this.prisma.maquette.updateMany({ where: { emprunteurId: id }, data: { emprunteurId: null } }),
      this.prisma.materiel.updateMany({ where: { createdById: id }, data: { createdById: null } }),
      this.prisma.materiel.updateMany({ where: { updatedById: id }, data: { updatedById: null } }),
      this.prisma.materiel.updateMany({ where: { responsableId: id }, data: { responsableId: null } }),
      this.prisma.defaut.updateMany({ where: { detecteParId: id }, data: { detecteParId: null } }),
      this.prisma.evenement.updateMany({ where: { acteurId: id }, data: { acteurId: null } }),
      this.prisma.fichier.updateMany({ where: { uploadedById: id }, data: { uploadedById: null } }),
      this.prisma.agentRole.updateMany({ where: { grantedBy: id }, data: { grantedBy: null } }),
      this.prisma.agent.delete({ where: { id } }),
    ]);
  }
}
