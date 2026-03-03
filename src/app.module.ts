import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { TraceIdMiddleware } from './comum/middleware/trace-id.middleware';
import { PapeisGuard } from './comum/guards/papeis.guard';
import { AutenticacaoModule } from './autenticacao/autenticacao.module';
import { AdminModule } from './admin/admin.module';
import { PublicoModule } from './publico/publico.module';
import { DonoTenantModule } from './dono-tenant/dono-tenant.module';
import { UsuarioModule } from './usuario/usuario.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('RATE_LIMIT_TTL', 60) * 1000,
          limit: config.get<number>('RATE_LIMIT_LIMIT', 120),
        },
      ],
    }),
    PrismaModule,
    AutenticacaoModule,
    AdminModule,
    PublicoModule,
    DonoTenantModule,
    UsuarioModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: PapeisGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }
}
