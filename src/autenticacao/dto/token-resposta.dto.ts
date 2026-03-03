import { ApiProperty } from '@nestjs/swagger';

class UsuarioTokenRespostaDto {
  @ApiProperty({ example: 'clx123' })
  id!: string;

  @ApiProperty({ example: 'Joao Silva' })
  nome!: string;

  @ApiProperty({ example: 'joao@email.com' })
  email!: string;

  @ApiProperty({ example: 'USUARIO' })
  papel!: string;

  @ApiProperty({ nullable: true, example: null })
  tenantId!: string | null;
}

export class TokenRespostaDto {
  @ApiProperty({ example: true })
  sucesso!: boolean;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ type: UsuarioTokenRespostaDto })
  usuario!: UsuarioTokenRespostaDto;
}
