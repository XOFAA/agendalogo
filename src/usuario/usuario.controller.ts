import { Body, Controller, Get, Patch, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AvaliacoesService } from '../avaliacoes/avaliacoes.service';
import { AvaliarTenantDto } from '../avaliacoes/dto/avaliar-tenant.dto';
import { UsuarioAtual } from '../comum/decorators/usuario-atual.decorator';
import { Papeis } from '../comum/decorators/papeis.decorator';
import { ErroRespostaDto } from '../comum/dto/erro-resposta.dto';
import { Papel } from '../comum/enum/papel.enum';
import { JwtAuthGuard } from '../comum/guards/jwt-auth.guard';
import { ReservasService } from '../reservas/reservas.service';

@ApiTags('Usuario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Papeis(Papel.USUARIO)
@Controller('usuario')
export class UsuarioController {
  constructor(
    private readonly reservasService: ReservasService,
    private readonly avaliacoesService: AvaliacoesService,
  ) {}

  @Get('minhas-reservas')
  @ApiOperation({ summary: 'Listar reservas do usuario autenticado.' })
  minhasReservas(@UsuarioAtual('sub') usuarioId: string) {
    return this.reservasService.listarMinhasReservas(usuarioId);
  }

  @Patch('minhas-reservas/:reservaId/cancelar')
  @ApiOperation({ summary: 'Cancelar reserva do usuario (respeitando janela de cancelamento).' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 422, type: ErroRespostaDto })
  cancelarMinhaReserva(@Param('reservaId') reservaId: string, @UsuarioAtual('sub') usuarioId: string) {
    return this.reservasService.cancelarPorUsuario(usuarioId, reservaId);
  }

  @Post('avaliacoes')
  @ApiOperation({ summary: 'Criar ou atualizar avaliacao de um tenant.' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 422, type: ErroRespostaDto })
  avaliarTenant(@UsuarioAtual('sub') usuarioId: string, @Body() dto: AvaliarTenantDto) {
    return this.avaliacoesService.avaliarTenant(usuarioId, dto);
  }
}
