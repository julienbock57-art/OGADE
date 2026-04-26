import { Controller, Get, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { MicrosoftTokenService } from './microsoft-token.service';
import { LocalAuthService } from './local-auth.service';
import { CurrentUser, RequestUser } from './auth.guard';
import { Public } from './public.decorator';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly msToken: MicrosoftTokenService,
    private readonly localAuth: LocalAuthService,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: RequestUser | null) {
    if (!user) {
      throw new UnauthorizedException();
    }
    const agent = await this.prisma.agent.findUnique({
      where: { id: user.agentId },
      include: { roles: { include: { role: true } } },
    });
    if (!agent) throw new UnauthorizedException();
    const { passwordHash: _, ...safe } = agent;
    return safe;
  }

  @Public()
  @Get('config')
  async config() {
    return {
      microsoftAuth: this.msToken.isConfigured,
      localAuth: true,
      tenantId: process.env.AZURE_AD_TENANT_ID ?? null,
      clientId: process.env.AZURE_AD_CLIENT_ID ?? null,
    };
  }

  @Public()
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    if (!body.email || !body.password) {
      throw new UnauthorizedException('Email et mot de passe requis');
    }

    const agent = await this.prisma.agent.findUnique({
      where: { email: body.email.toLowerCase() },
      include: { roles: { include: { role: true } } },
    });

    if (!agent || !agent.actif) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!agent.passwordHash) {
      throw new UnauthorizedException('Ce compte n\'a pas de mot de passe. Utilisez la connexion Microsoft.');
    }

    const valid = await this.localAuth.verifyPassword(body.password, agent.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const token = await this.localAuth.signToken({ agentId: agent.id, email: agent.email });

    return {
      token,
      agent: {
        id: agent.id,
        email: agent.email,
        nom: agent.nom,
        prenom: agent.prenom,
        roles: agent.roles.map((ar) => ar.role.code),
      },
    };
  }

  @Public()
  @Post('validate')
  async validate(@Body() body: { token: string }) {
    if (!this.msToken.isConfigured) {
      return { valid: false, reason: 'Azure AD not configured' };
    }

    const payload = await this.msToken.verify(body.token);
    if (!payload?.email) {
      throw new UnauthorizedException('Token invalide');
    }

    const agent = await this.prisma.agent.findUnique({
      where: { email: payload.email.toLowerCase() },
      include: { roles: { include: { role: true } } },
    });

    if (!agent || !agent.actif) {
      throw new UnauthorizedException(
        'Accès refusé — votre compte n\'est pas autorisé.',
      );
    }

    if (payload.oid && !agent.azureAdOid) {
      await this.prisma.agent.update({
        where: { id: agent.id },
        data: { azureAdOid: payload.oid },
      });
    }

    if (payload.given_name && payload.family_name) {
      await this.prisma.agent.update({
        where: { id: agent.id },
        data: {
          prenom: payload.given_name,
          nom: payload.family_name,
        },
      });
    }

    return agent;
  }
}
