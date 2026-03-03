import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatusReserva } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class ListarReservasTenantQueryDto {
  @ApiPropertyOptional({ enum: StatusReserva })
  @IsOptional()
  @IsEnum(StatusReserva)
  status?: StatusReserva;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiPropertyOptional({ example: '2026-03-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  dataFim?: string;
}
