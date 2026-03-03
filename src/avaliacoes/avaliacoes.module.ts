import { Module } from '@nestjs/common';
import { AvaliacoesService } from './avaliacoes.service';

@Module({
  providers: [AvaliacoesService],
  exports: [AvaliacoesService],
})
export class AvaliacoesModule {}
