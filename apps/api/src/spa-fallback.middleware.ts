import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class SpaFallbackMiddleware implements NestMiddleware {
  private readonly indexPath = join(__dirname, '..', '..', 'web', 'dist', 'index.html');

  use(req: Request, res: Response, next: NextFunction) {
    if (
      req.method === 'GET' &&
      !req.path.startsWith('/api/') &&
      !req.path.includes('.') &&
      existsSync(this.indexPath)
    ) {
      return res.sendFile(this.indexPath);
    }
    next();
  }
}
