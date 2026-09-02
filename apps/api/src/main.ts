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

  // Swagger liste toute l'API et n'est pas protégé par l'auth.
  // On le laisse donc actif en dev et en recette (c'est bien pratique) et on le
  // coupe en prod. ENABLE_SWAGGER=true ou false permet de forcer dans un sens
  // ou dans l'autre si besoin.
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

  // Petit récap au démarrage. Comme ça on voit tout de suite dans quel mode on
  // tourne, et on se fait pas avoir par une variable oubliée.
  logger.log(`OGADE demarre sur le port ${port}`);
  logger.log(`Mode : ${isProduction ? 'production' : 'développement'}`);
  logger.log(`Documentation API : ${swaggerEnabled ? '/api/docs' : 'désactivée'}`);
  if (!webBuildPresent) {
    logger.warn(
      `Interface web introuvable (${webDistPath}), seule l'API va repondre. ` +
        'Il faut lancer "pnpm run build" avant de demarrer.',
    );
  }
}

bootstrap().catch((err: unknown) => {
  // Sans ça, une erreur de config (JWT_SECRET oublié en prod, base injoignable,
  // etc.) sort en "unhandled promise rejection" avec une grosse stack illisible
  // dans les logs. Là au moins on a un message clair.
  const message = err instanceof Error ? err.message : String(err);
  Logger.error(`Démarrage impossible : ${message}`, 'Bootstrap');
  process.exit(1);
});
