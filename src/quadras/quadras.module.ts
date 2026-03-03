import { Module } from '@nestjs/common';
import { QuadrasService } from './quadras.service';

@Module({
  providers: [QuadrasService],
  exports: [QuadrasService],
})
export class QuadrasModule {}
