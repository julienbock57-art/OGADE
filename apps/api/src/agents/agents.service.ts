import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateAgentInput, UpdateAgentInput } from '@ogade/shared';

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
      data,
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
    return agent;
  }

  async create(data: CreateAgentInput) {
    return this.prisma.agent.create({
      data,
      include: { roles: { include: { role: true } } },
    });
  }

  async update(id: number, data: UpdateAgentInput) {
    await this.findOne(id);
    return this.prisma.agent.update({
      where: { id },
      data,
      include: { roles: { include: { role: true } } },
    });
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
}
