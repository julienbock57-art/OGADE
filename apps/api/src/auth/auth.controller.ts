import { Controller, Get, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { MicrosoftTokenService } from './microsoft-token.service';
import { CurrentUser, RequestUser } from './auth.guard';
import { Public } from './public.decorator';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly msToken: MicrosoftTokenService,
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
    return agent;
  }

  @Public()
  @Get('config')
  async config() {
    return {
      microsoftAuth: this.msToken.isConfigured,
      tenantId: process.env.AZURE_AD_TENANT_ID ?? null,
      clientId: process.env.AZURE_AD_CLIENT_ID ?? null,
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

    // Update Azure AD OID if not set
    if (payload.oid && !agent.azureAdOid) {
      await this.prisma.agent.update({
        where: { id: agent.id },
        data: { azureAdOid: payload.oid },
      });
    }

    // Update name from Azure AD if available
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
