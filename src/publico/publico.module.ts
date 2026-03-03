import { Module } from '@nestjs/common';
import { AvaliacoesModule } from '../avaliacoes/avaliacoes.module';
import { PublicoController } from './publico.controller';
import { PublicoService } from './publico.service';
import { TenantsModule } from '../tenants/tenants.module';
import { QuadrasModule } from '../quadras/quadras.module';
import { SlotsModule } from '../slots/slots.module';
import { ReservasModule } from '../reservas/reservas.module';

@Module({
  imports: [TenantsModule, QuadrasModule, SlotsModule, ReservasModule, AvaliacoesModule],
  controllers: [PublicoController],
  providers: [PublicoService],
})
export class PublicoModule {}
