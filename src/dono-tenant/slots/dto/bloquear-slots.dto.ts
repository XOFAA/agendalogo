import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

export class BloquearSlotsDto {
  @ApiPropertyOptional({ type: [String], example: ['clxSlot1', 'clxSlot2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  slotIds?: string[];

  @ApiPropertyOptional({ example: '2026-03-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  inicioIntervalo?: string;

  @ApiPropertyOptional({ example: '2026-03-15T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  fimIntervalo?: string;
}
