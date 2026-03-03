import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsNotEmpty, Min, ValidateNested } from 'class-validator';

class SlotItemDto {
  @ApiProperty({ example: '2026-03-15T19:00:00.000Z' })
  @IsDateString()
  inicioEm!: string;

  @ApiProperty({ example: '2026-03-15T20:00:00.000Z' })
  @IsDateString()
  fimEm!: string;

  @ApiProperty({ example: 12000, description: 'Preco em centavos' })
  @IsInt()
  @Min(0)
  precoCentavos!: number;
}

export class CriarSlotsDto {
  @ApiProperty({ type: [SlotItemDto] })
  @IsArray()
  @IsNotEmpty({ each: true })
  @ValidateNested({ each: true })
  @Type(() => SlotItemDto)
  slots!: SlotItemDto[];
}
