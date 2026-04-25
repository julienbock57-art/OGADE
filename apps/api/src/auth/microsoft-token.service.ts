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

// Microsoft personal accounts always use this tenant ID in tokens
const MS_CONSUMERS_TENANT = '9188040d-6c67-4c5b-b112-36a304b66dad';

@Injectable()
export class MicrosoftTokenService {
  private readonly logger = new Logger(MicrosoftTokenService.name);
  private jwksMap = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

  private get tenantId(): string {
    return process.env.AZURE_AD_TENANT_ID ?? '';
  }

  private get clientId(): string {
    return process.env.AZURE_AD_CLIENT_ID ?? '';
  }

  get isConfigured(): boolean {
    return !!(this.tenantId && this.clientId);
  }

  private getJwks(tenant: string) {
    if (!this.jwksMap.has(tenant)) {
      const url = new URL(
        `https://login.microsoftonline.com/${tenant}/discovery/v2.0/keys`,
      );
      this.jwksMap.set(tenant, createRemoteJWKSet(url));
    }
    return this.jwksMap.get(tenant)!;
  }

  private get allowedIssuers(): string[] {
    const issuers = [
      `https://login.microsoftonline.com/${this.tenantId}/v2.0`,
    ];
    // Also accept the personal accounts issuer
    if (this.tenantId === 'consumers' || this.tenantId !== MS_CONSUMERS_TENANT) {
      issuers.push(
        `https://login.microsoftonline.com/${MS_CONSUMERS_TENANT}/v2.0`,
      );
    }
    return issuers;
  }

  private get jwksTenants(): string[] {
    const tenants = [this.tenantId];
    if (this.tenantId === 'consumers') {
      tenants.push(MS_CONSUMERS_TENANT);
    }
    return tenants;
  }

  async verify(token: string): Promise<MicrosoftTokenPayload | null> {
    if (!this.isConfigured) {
      this.logger.warn('Azure AD not configured — skipping token verification');
      return null;
    }

    // Try verification against each possible JWKS endpoint
    for (const tenant of this.jwksTenants) {
      try {
        const { payload } = await jwtVerify(token, this.getJwks(tenant), {
          issuer: this.allowedIssuers,
          audience: this.clientId,
        });

        return {
          oid: (payload.oid ?? payload.sub) as string,
          preferred_username: payload.preferred_username as string | undefined,
          email: (payload.email as string | undefined) ??
            (payload.preferred_username as string | undefined),
          name: payload.name as string | undefined,
          given_name: payload.given_name as string | undefined,
          family_name: payload.family_name as string | undefined,
        };
      } catch {
        // try next tenant
      }
    }

    this.logger.debug('Token verification failed against all JWKS endpoints');
    return null;
  }
}
