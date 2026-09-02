import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Response } from 'express';
import { MAX_UPLOAD_MB } from './upload-limits';

// Remplace le message d'erreur quand le fichier envoyé est trop gros.
//
// NestJS transforme déjà l'erreur de Multer en PayloadTooLargeException, sauf
// qu'il met "File too large" : c'est en anglais et ça ne dit pas la limite.
// Le front réaffiche ce message tel quel (voir apps/web/src/lib/api.ts, la
// méthode upload), donc autant qu'il soit clair.
//
// On n'attrape que ce cas là, tout le reste passe normalement.
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
