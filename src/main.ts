import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { FiltroExcecaoGlobal } from './comum/filtros/filtro-excecao-global';
import { RespostaPadraoInterceptor } from './comum/interceptores/resposta.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', '*'),
    credentials: true,
  });

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

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(3000);
}

bootstrap();
