import { ApiProperty } from '@nestjs/swagger';

class ErroInternoDto {
  @ApiProperty({ example: 'SEM_PERMISSAO' })
  codigo!: string;

  @ApiProperty({ example: 'Papel sem permissao para acessar este recurso.' })
  mensagem!: string;

  @ApiProperty({ required: false, example: { campo: 'email' } })
  detalhes?: unknown;
}

export class ErroRespostaDto {
  @ApiProperty({ example: false })
  sucesso!: false;

  @ApiProperty({ type: ErroInternoDto })
  erro!: ErroInternoDto;

  @ApiProperty({ example: 'f3a2ce0b-67f9-4e57-b462-2f6a7c5db3d6' })
  traceId!: string;
}
