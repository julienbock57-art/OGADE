import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ServiceUnavailableException,
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
  private readonly logger = new Logger(AuthGuard.name);

  /**
   * Repli sur l'en-tête `x-user-email`, destiné au développement local afin de
   * lancer l'application sans fournisseur d'authentification.
   *
   * Il accorde un accès complet sur simple présentation d'une adresse e-mail :
   * il ne doit jamais être actif en production. Le déploiement doit donc
   * impérativement définir NODE_ENV=production.
   */
  private readonly devHeaderAuthEnabled = process.env.NODE_ENV !== 'production';

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly msToken: MicrosoftTokenService,
    private readonly localAuth: LocalAuthService,
  ) {
    if (this.devHeaderAuthEnabled && !this.msToken.isConfigured) {
      this.logger.warn(
        "MODE DÉVELOPPEMENT — l'en-tête « x-user-email » est accepté comme " +
          'authentification, sans mot de passe. Définissez NODE_ENV=production ' +
          'pour désactiver ce repli.',
      );
    }
  }

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

    // Repli développement uniquement — jamais actif en production.
    // Cf. devHeaderAuthEnabled.
    if (
      !email &&
      this.devHeaderAuthEnabled &&
      !this.msToken.isConfigured &&
      emailHeader
    ) {
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
      // Toute autre erreur (base indisponible, timeout…) ne doit pas laisser
      // passer la requête : on refuse explicitement plutôt que d'ouvrir
      // l'accès aux routes dépourvues de @Roles().
      this.logger.error(
        `Échec de la vérification d'identité pour « ${email} » : ${err}`,
      );
      throw new ServiceUnavailableException(
        'Service temporairement indisponible. Réessayez dans quelques instants.',
      );
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
