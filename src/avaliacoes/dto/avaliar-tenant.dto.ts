import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class AvaliarTenantDto {
  @ApiProperty({ example: 'clxTenant123' })
  @IsString()
  tenantId!: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  nota!: number;

  @ApiPropertyOptional({ example: 'Excelente atendimento e estrutura.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentario?: string;
}
