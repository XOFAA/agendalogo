import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegistrarDto {
  @ApiProperty({ example: 'Joao Silva' })
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Senha@1234', minLength: 8 })
  @IsString()
  @MinLength(8)
  senha!: string;
}
