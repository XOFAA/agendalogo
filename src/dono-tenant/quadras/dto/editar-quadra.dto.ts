import { PartialType } from '@nestjs/swagger';
import { CriarQuadraDto } from './criar-quadra.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class EditarQuadraDto extends PartialType(CriarQuadraDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}
