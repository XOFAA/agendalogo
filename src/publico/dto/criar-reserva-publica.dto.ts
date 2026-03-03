import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CriarReservaPublicaDto {
  @ApiProperty({ example: 'clxSlot123' })
  @IsString()
  @IsNotEmpty()
  slotId!: string;
}
