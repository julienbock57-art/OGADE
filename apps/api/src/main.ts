import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import { existsSync } from 'fs';
import { AppModule } from './app.module';
import { SpaFallbackFilter } from './spa-fallback.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // La documentation Swagger décrit toute la surface de l'API sans
  // authentification. Elle reste donc active hors production — utile en
  // développement comme en recette — et se désactive en production.
  // ENABLE_SWAGGER (« true » / « false ») force explicitement l'un ou
  // l'autre comportement.
  const swaggerEnabled = process.env.ENABLE_SWAGGER
    ? process.env.ENABLE_SWAGGER === 'true'
    : !isProduction;

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('OGADE API')
      .setDescription('API de gestion des actifs END')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const webDistPath = join(__dirname, '..', '..', 'web', 'dist');
  const webBuildPresent = existsSync(webDistPath);
  if (webBuildPresent) {
    app.useStaticAssets(webDistPath);
  }

  app.useGlobalFilters(new SpaFallbackFilter());

  const port = process.env.PORT || process.env.API_PORT || 3000;
  await app.listen(port, '0.0.0.0');

  // Récapitulatif de configuration : rend visible, dès le démarrage, le
  // mode réellement appliqué et les écarts susceptibles de passer
  // inaperçus.
  logger.log(`OGADE démarré — port ${port}`);
  logger.log(`Mode : ${isProduction ? 'production' : 'développement'}`);
  logger.log(`Documentation API : ${swaggerEnabled ? '/api/docs' : 'désactivée'}`);
  if (!webBuildPresent) {
    logger.warn(
      `Interface web introuvable (${webDistPath}) — seule l'API répondra. ` +
        'Lancez « pnpm run build » avant de démarrer.',
    );
  }
}

bootstrap().catch((err: unknown) => {
  // Sans ce filet, une erreur de configuration (JWT_SECRET manquant en
  // production, base injoignable…) ne remonte que sous forme de rejet de
  // promesse non traité, difficile à lire dans les journaux du service.
  const message = err instanceof Error ? err.message : String(err);
  Logger.error(`Démarrage impossible : ${message}`, 'Bootstrap');
  process.exit(1);
});
