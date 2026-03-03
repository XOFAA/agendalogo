import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsuarioAtual } from '../comum/decorators/usuario-atual.decorator';
import { ErroRespostaDto } from '../comum/dto/erro-resposta.dto';
import { JwtAuthGuard } from '../comum/guards/jwt-auth.guard';
import { UsuarioToken } from '../comum/types/usuario-token.type';
import { AutenticacaoService } from './autenticacao.service';
import { EntrarDto } from './dto/entrar.dto';
import { RegistrarDto } from './dto/registrar.dto';
import { TokenRespostaDto } from './dto/token-resposta.dto';

@ApiTags('Autenticacao')
@Controller('autenticacao')
export class AutenticacaoController {
  constructor(private readonly autenticacaoService: AutenticacaoService) {}

  @Post('registrar')
  @ApiOperation({ summary: 'Registrar novo usuario final (papel USUARIO).' })
  @ApiBody({ type: RegistrarDto })
  @ApiResponse({ status: 201, type: TokenRespostaDto })
  @ApiResponse({ status: 409, type: ErroRespostaDto })
  registrar(@Body() dto: RegistrarDto) {
    return this.autenticacaoService.registrar(dto);
  }

  @Post('entrar')
  @ApiOperation({ summary: 'Autenticar usuario e gerar access token JWT.' })
  @ApiBody({ type: EntrarDto })
  @ApiResponse({ status: 201, type: TokenRespostaDto })
  @ApiResponse({ status: 401, type: ErroRespostaDto })
  entrar(@Body() dto: EntrarDto) {
    return this.autenticacaoService.entrar(dto);
  }

  @Get('eu')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retornar dados do usuario autenticado.' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, type: ErroRespostaDto })
  eu(@UsuarioAtual() usuario: UsuarioToken) {
    return usuario;
  }
}
