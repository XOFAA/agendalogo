import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class ListarDisponibilidadeQueryDto {
  @ApiProperty({ example: '2026-03-10', description: 'Data no formato YYYY-MM-DD' })
  @IsDateString()
  data!: string;
}
