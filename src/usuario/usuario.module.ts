import { Module } from '@nestjs/common';
import { AvaliacoesModule } from '../avaliacoes/avaliacoes.module';
import { UsuarioController } from './usuario.controller';
import { ReservasModule } from '../reservas/reservas.module';

@Module({
  imports: [ReservasModule, AvaliacoesModule],
  controllers: [UsuarioController],
})
export class UsuarioModule {}
