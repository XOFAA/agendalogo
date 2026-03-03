import { Module } from '@nestjs/common';
import { SlotsService } from './slots.service';

@Module({
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
