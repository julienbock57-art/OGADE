import { Injectable, Logger } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface MicrosoftTokenPayload {
  oid: string;
  preferred_username?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
}

@Injectable()
export class MicrosoftTokenService {
  private readonly logger = new Logger(MicrosoftTokenService.name);
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  private get tenantId(): string {
    return process.env.AZURE_AD_TENANT_ID ?? '';
  }

  private get clientId(): string {
    return process.env.AZURE_AD_CLIENT_ID ?? '';
  }

  get isConfigured(): boolean {
    return !!(this.tenantId && this.clientId);
  }

  private getJwks() {
    if (!this.jwks) {
      const url = new URL(
        `https://login.microsoftonline.com/${this.tenantId}/discovery/v2.0/keys`,
      );
      this.jwks = createRemoteJWKSet(url);
    }
    return this.jwks;
  }

  async verify(token: string): Promise<MicrosoftTokenPayload | null> {
    if (!this.isConfigured) {
      this.logger.warn('Azure AD not configured — skipping token verification');
      return null;
    }

    try {
      const { payload } = await jwtVerify(token, this.getJwks(), {
        issuer: `https://login.microsoftonline.com/${this.tenantId}/v2.0`,
        audience: this.clientId,
      });

      return {
        oid: payload.oid as string,
        preferred_username: payload.preferred_username as string | undefined,
        email: (payload.email as string | undefined) ??
          (payload.preferred_username as string | undefined),
        name: payload.name as string | undefined,
        given_name: payload.given_name as string | undefined,
        family_name: payload.family_name as string | undefined,
      };
    } catch (err: any) {
      this.logger.debug(`Token verification failed: ${err.message}`);
      return null;
    }
  }
}
