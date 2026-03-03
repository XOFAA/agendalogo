import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class ListarSlotsPublicoQueryDto {
  @ApiProperty({ example: '2026-03-10', description: 'Data no formato YYYY-MM-DD' })
  @IsDateString()
  data!: string;
}
