import { PartialType } from '@nestjs/swagger';
import { CriarQuadraDto } from './criar-quadra.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class EditarQuadraDto extends PartialType(CriarQuadraDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  ativa?: boolean;

  @ApiPropertyOptional({ example: '/uploads/quadras/minha-quadra.jpg', nullable: true })
  @IsOptional()
  @IsString()
  imagemUrl?: string;
}
