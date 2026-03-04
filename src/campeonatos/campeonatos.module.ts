import { Module } from '@nestjs/common';
import { CampeonatosService } from './campeonatos.service';

@Module({
  providers: [CampeonatosService],
  exports: [CampeonatosService],
})
export class CampeonatosModule {}
