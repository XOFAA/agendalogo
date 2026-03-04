import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CriarReservasPublicasLoteDto {
  @ApiProperty({ type: [String], example: ['clxSlot123', 'clxSlot124'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  slotIds!: string[];
}
