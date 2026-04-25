import { ExceptionFilter, Catch, NotFoundException, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

@Catch(NotFoundException)
export class SpaFallbackFilter implements ExceptionFilter {
  private readonly indexPath = join(__dirname, '..', '..', 'web', 'dist', 'index.html');

  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    if (request.path.startsWith('/api/') || !existsSync(this.indexPath)) {
      response.status(404).json({
        statusCode: 404,
        message: exception.message,
      });
      return;
    }

    response.sendFile(this.indexPath);
  }
}
