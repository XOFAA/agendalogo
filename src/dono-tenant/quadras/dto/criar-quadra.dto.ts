import { ApiProperty } from '@nestjs/swagger';
import { TipoEsporte } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CriarQuadraDto {
  @ApiProperty({ example: 'Quadra Principal' })
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({ enum: TipoEsporte, example: TipoEsporte.FUTEBOL })
  @IsEnum(TipoEsporte)
  tipoEsporte!: TipoEsporte;

  @ApiProperty({ required: false, example: '/uploads/quadras/minha-quadra.jpg' })
  @IsOptional()
  @IsString()
  imagemUrl?: string;
}
