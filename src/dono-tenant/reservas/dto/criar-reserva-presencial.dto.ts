import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CriarReservaPresencialDto {
  @ApiProperty({ example: 'cm123slot' })
  @IsString()
  @IsNotEmpty()
  slotId!: string;

  @ApiProperty({ example: 'cm123quadra' })
  @IsString()
  @IsNotEmpty()
  quadraId!: string;

  @ApiProperty({ example: 'Cliente Balcao' })
  @IsString()
  @IsNotEmpty()
  clienteNome!: string;

  @ApiPropertyOptional({ example: 'cliente@local.com' })
  @IsOptional()
  @IsEmail()
  clienteEmail?: string;
}
