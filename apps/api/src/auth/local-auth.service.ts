import { Injectable, Logger } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Secret de repli pour le développement local. Sa valeur est publique
 * (elle figure dans le dépôt) : l'utiliser en production reviendrait à
 * permettre à quiconque de forger un jeton pour n'importe quel compte.
 */
const DEV_SECRET = 'ogade-dev-secret-change-in-production';

/** Longueur minimale exigée en production (cf. `openssl rand -base64 48`). */
const MIN_SECRET_LENGTH = 32;

@Injectable()
export class LocalAuthService {
  private readonly logger = new Logger(LocalAuthService.name);
  private readonly secret: Uint8Array;

  constructor() {
    this.secret = new TextEncoder().encode(LocalAuthService.resolveSecret(this.logger));
  }

  /**
   * Détermine le secret de signature. En production, une configuration
   * absente ou faible interrompt le démarrage plutôt que de laisser
   * l'application tourner avec des jetons forgeables.
   */
  private static resolveSecret(logger: Logger): string {
    const raw = process.env.JWT_SECRET?.trim();

    if (process.env.NODE_ENV !== 'production') {
      if (!raw) {
        logger.warn(
          'JWT_SECRET non défini — utilisation du secret de développement. ' +
            'Cette valeur est publique et doit impérativement être remplacée ' +
            'en production.',
        );
        return DEV_SECRET;
      }
      return raw;
    }

    if (!raw) {
      throw new Error(
        'JWT_SECRET est obligatoire en production. ' +
          'Générez-en un avec : openssl rand -base64 48',
      );
    }
    if (raw === DEV_SECRET) {
      throw new Error(
        'JWT_SECRET utilise le secret de développement, dont la valeur est ' +
          'publique. Générez-en un avec : openssl rand -base64 48',
      );
    }
    if (raw.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `JWT_SECRET est trop court (${raw.length} caractères, ` +
          `${MIN_SECRET_LENGTH} minimum). Générez-en un avec : openssl rand -base64 48`,
      );
    }

    return raw;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async signToken(payload: { agentId: number; email: string }): Promise<string> {
    return new SignJWT({ sub: String(payload.agentId), email: payload.email, type: 'local' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(this.secret);
  }

  async verifyToken(token: string): Promise<{ agentId: number; email: string } | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret);
      if (payload.type !== 'local' || !payload.sub || !payload.email) return null;
      return { agentId: Number(payload.sub), email: payload.email as string };
    } catch {
      return null;
    }
  }
}
