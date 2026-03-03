import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CriarTenantAdminDto {
  @ApiProperty({ example: 'Arena Centro' })
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({ example: 'arena-centro' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  @MaxLength(80)
  slug!: string;
}
