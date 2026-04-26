import { Injectable } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

@Injectable()
export class LocalAuthService {
  private get secret() {
    const raw = process.env.JWT_SECRET ?? 'ogade-dev-secret-change-in-production';
    return new TextEncoder().encode(raw);
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
