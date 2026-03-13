import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import helmet from 'helmet';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { FiltroExcecaoGlobal } from './comum/filtros/filtro-excecao-global';
import { RespostaPadraoInterceptor } from './comum/interceptores/resposta.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const httpServer = app.getHttpAdapter().getInstance();
  if (typeof httpServer?.set === 'function') {
    httpServer.set('trust proxy', true);
  }
  app.use(
    helmet({
      // Swagger UI usa scripts inline; com CSP default do Helmet ele pode quebrar em proxy/reverse-proxy.
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', '*'),
    credentials: true,
  });
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (erros) =>
        new BadRequestException({
          codigo: 'VALIDACAO_INVALIDA',
          mensagem: 'Falha de validacao dos dados enviados.',
          detalhes: erros.map((erro) => ({
            campo: erro.property,
            restricoes: erro.constraints,
          })),
        }),
    }),
  );
  app.useGlobalFilters(new FiltroExcecaoGlobal());
  app.useGlobalInterceptors(new RespostaPadraoInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API SaaS de Agendamento de Quadras')
    .setDescription(
      'API multi-tenant com isolamento por tenant e papeis: ADMIN_PLATAFORMA, DONO_TENANT e USUARIO.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const swaggerPath = config.get<string>('SWAGGER_PATH', 'docs');
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = Number(config.get<string>('PORT', '3000'));
  const host = config.get<string>('HOST', '0.0.0.0');
  await app.listen(port, host);
}

bootstrap();
