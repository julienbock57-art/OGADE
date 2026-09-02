import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Response } from 'express';
import { MAX_UPLOAD_MB } from './upload-limits';

/**
 * Remplace le message de dépassement de taille par un libellé explicite.
 *
 * @nestjs/platform-express convertit déjà l'erreur Multer en
 * PayloadTooLargeException, mais avec le message figé « File too large » :
 * ni traduit, ni porteur de la limite applicable. Le client affiche ce
 * message tel quel (cf. apps/web/src/lib/api.ts, méthode `upload`).
 *
 * Seul ce type d'exception est intercepté ; les autres suivent leur
 * traitement habituel.
 */
@Catch(PayloadTooLargeException)
export class UploadExceptionFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      error: 'Payload Too Large',
      message: `Fichier trop volumineux : la taille maximale autorisée est de ${MAX_UPLOAD_MB} Mo.`,
    });
  }
}
