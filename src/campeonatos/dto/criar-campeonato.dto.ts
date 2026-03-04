import { TipoEsporte } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CriarCampeonatoDto {
  @ApiProperty({ example: 'Copa Noturna ArenaBook' })
  @IsString()
  @MaxLength(120)
  nome!: string;

  @ApiProperty({ example: 'Campeonato para times amadores da cidade.', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao?: string;

  @ApiProperty({ enum: TipoEsporte, example: TipoEsporte.FUTEBOL })
  @IsEnum(TipoEsporte)
  tipoEsporte!: TipoEsporte;

  @ApiProperty({ example: '2026-04-01T14:00:00.000Z' })
  @IsDateString()
  dataInicio!: string;

  @ApiProperty({ example: '2026-04-07T22:00:00.000Z' })
  @IsDateString()
  dataFim!: string;

  @ApiProperty({ example: 15000, description: 'Valor da inscricao em centavos.' })
  @IsInt()
  @Min(0)
  valorInscricaoCentavos!: number;

  @ApiProperty({ example: 16, description: 'Quantidade maxima de participantes.' })
  @IsInt()
  @Min(2)
  maxParticipantes!: number;
}
