import {
  CanActivate,
  ExecutionContext,
  Injectable,
  createParamDecorator,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RequestUser {
  agentId: number;
  email: string;
  roles: string[];
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const email = request.headers['x-user-email'] as string | undefined;

    if (!email) {
      request.user = null;
      return true;
    }

    const agent = await this.prisma.agent.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });

    if (!agent) {
      request.user = null;
      return true;
    }

    request.user = {
      agentId: agent.id,
      email: agent.email,
      roles: agent.roles.map((ar: { role: { code: string } }) => ar.role.code),
    } satisfies RequestUser;

    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user ?? null;
  },
);
