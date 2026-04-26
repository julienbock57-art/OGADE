import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { MicrosoftTokenService } from './microsoft-token.service';
import { LocalAuthService } from './local-auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';

export interface RequestUser {
  agentId: number;
  email: string;
  nom: string;
  prenom: string;
  roles: string[];
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly msToken: MicrosoftTokenService,
    private readonly localAuth: LocalAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] as string | undefined;
    const emailHeader = request.headers['x-user-email'] as string | undefined;

    let email: string | undefined;
    let agentIdFromToken: number | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);

      // Try local JWT first (fast, no network call)
      const localPayload = await this.localAuth.verifyToken(token);
      if (localPayload) {
        email = localPayload.email.toLowerCase();
        agentIdFromToken = localPayload.agentId;
      } else {
        // Try Microsoft token
        const msPayload = await this.msToken.verify(token);
        if (msPayload?.email) {
          email = msPayload.email.toLowerCase();
        } else if (this.msToken.isConfigured) {
          throw new UnauthorizedException('Token invalide ou expiré');
        }
      }
    }

    // Fallback to x-user-email header if no auth configured (dev mode)
    if (!email && !this.msToken.isConfigured && emailHeader) {
      email = emailHeader.toLowerCase();
    }

    if (!email) {
      throw new UnauthorizedException('Authentification requise');
    }

    try {
      const agent = await this.prisma.agent.findUnique({
        where: agentIdFromToken ? { id: agentIdFromToken } : { email },
        include: { roles: { include: { role: true } } },
      });

      if (!agent || !agent.actif) {
        throw new UnauthorizedException(
          'Accès refusé — votre compte n\'est pas autorisé. Contactez un administrateur.',
        );
      }

      request.user = {
        agentId: agent.id,
        email: agent.email,
        nom: agent.nom,
        prenom: agent.prenom,
        roles: agent.roles.map((ar: { role: { code: string } }) => ar.role.code),
      } satisfies RequestUser;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      request.user = null;
      return true;
    }

    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user ?? null;
  },
);
