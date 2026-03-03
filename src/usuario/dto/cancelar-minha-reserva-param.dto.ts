import { ApiProperty } from '@nestjs/swagger';

export class CancelarMinhaReservaParamDto {
  @ApiProperty({ example: 'clxReserva123' })
  reservaId!: string;
}
