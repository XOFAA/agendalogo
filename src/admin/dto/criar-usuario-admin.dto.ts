import { ApiProperty } from '@nestjs/swagger';
import { PapelUsuario } from '@prisma/client';
import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CriarUsuarioAdminDto {
  @ApiProperty({ example: 'Maria Gestora' })
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({ example: 'maria@arena.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Senha@1234' })
  @IsString()
  @MinLength(8)
  senha!: string;

  @ApiProperty({ enum: PapelUsuario, example: PapelUsuario.DONO_TENANT })
  @IsEnum(PapelUsuario)
  papel!: PapelUsuario;

  @ApiProperty({ required: false, example: 'clxTenant123' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({ required: false, type: [String], example: ['clxTenant123', 'clxTenant456'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tenantIds?: string[];
}
