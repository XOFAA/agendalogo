import { Module } from '@nestjs/common';
import { AvaliacoesModule } from '../avaliacoes/avaliacoes.module';
import { DonoTenantController } from './dono-tenant.controller';
import { QuadrasModule } from '../quadras/quadras.module';
import { SlotsModule } from '../slots/slots.module';
import { ReservasModule } from '../reservas/reservas.module';
import { CampeonatosModule } from '../campeonatos/campeonatos.module';

@Module({
  imports: [QuadrasModule, SlotsModule, ReservasModule, AvaliacoesModule, CampeonatosModule],
  controllers: [DonoTenantController],
})
export class DonoTenantModule {}
