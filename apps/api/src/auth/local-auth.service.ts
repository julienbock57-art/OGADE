import { Injectable, Logger } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

// Secret de secours pour bosser en local. Il est en clair dans le dépôt, donc
// si on s'en sert en prod n'importe qui peut se fabriquer un token valide pour
// le compte qu'il veut.
const DEV_SECRET = 'ogade-dev-secret-change-in-production';

// Taille mini du secret en prod. Pour en générer un : openssl rand -base64 48
const MIN_SECRET_LENGTH = 32;

@Injectable()
export class LocalAuthService {
  private readonly logger = new Logger(LocalAuthService.name);
  private readonly secret: Uint8Array;

  constructor() {
    this.secret = new TextEncoder().encode(LocalAuthService.resolveSecret(this.logger));
  }

  // Récupère le secret qui sert à signer les tokens.
  // En prod, si le secret manque ou s'il est trop faible on préfère planter au
  // démarrage plutôt que de tourner avec des tokens que tout le monde peut refaire.
  private static resolveSecret(logger: Logger): string {
    const raw = process.env.JWT_SECRET?.trim();

    if (process.env.NODE_ENV !== 'production') {
      if (!raw) {
        logger.warn(
          'JWT_SECRET non defini, on utilise le secret de dev. Cette valeur est ' +
            'publique, il faut absolument la remplacer en prod.',
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
