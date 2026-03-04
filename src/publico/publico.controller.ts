import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AvaliacoesService } from '../avaliacoes/avaliacoes.service';
import { UsuarioAtual } from '../comum/decorators/usuario-atual.decorator';
import { Papeis } from '../comum/decorators/papeis.decorator';
import { ErroRespostaDto } from '../comum/dto/erro-resposta.dto';
import { Papel } from '../comum/enum/papel.enum';
import { JwtAuthGuard } from '../comum/guards/jwt-auth.guard';
import { CriarReservaPublicaDto } from './dto/criar-reserva-publica.dto';
import { CriarReservasPublicasLoteDto } from './dto/criar-reservas-publicas-lote.dto';
import { ListarSlotsPublicoQueryDto } from './dto/listar-slots-publico-query.dto';
import { PublicoService } from './publico.service';

@ApiTags('Publico')
@Controller('publico')
export class PublicoController {
  constructor(
    private readonly publicoService: PublicoService,
    private readonly avaliacoesService: AvaliacoesService,
  ) {}

  @Get('tenants')
  @ApiOperation({ summary: 'Listar tenants publicos.' })
  listarTenants() {
    return this.publicoService.listarTenants();
  }

  @Get('tenants/:tenantId')
  @ApiOperation({ summary: 'Buscar tenant publico por id.' })
  buscarTenant(@Param('tenantId') tenantId: string) {
    return this.publicoService.buscarTenant(tenantId);
  }

  @Get('tenants/:tenantId/quadras')
  @ApiOperation({ summary: 'Listar quadras ativas do tenant.' })
  listarQuadras(@Param('tenantId') tenantId: string) {
    return this.publicoService.listarQuadras(tenantId);
  }

  @Get('tenants/:tenantId/quadras/:quadraId/slots')
  @ApiOperation({ summary: 'Listar slots ABERTOS e futuros por data.' })
  @ApiQuery({ name: 'data', example: '2026-03-10' })
  @ApiParam({ name: 'tenantId' })
  @ApiParam({ name: 'quadraId' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, type: ErroRespostaDto })
  listarSlots(
    @Param('tenantId') tenantId: string,
    @Param('quadraId') quadraId: string,
    @Query() query: ListarSlotsPublicoQueryDto,
  ) {
    return this.publicoService.listarSlots(tenantId, quadraId, query.data);
  }

  @Post('tenants/:tenantId/quadras/:quadraId/reservas')
  @UseGuards(JwtAuthGuard)
  @Papeis(Papel.USUARIO)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Criar reserva PENDENTE para usuario autenticado e marcar slot como RESERVADO (transacional).',
  })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, type: ErroRespostaDto })
  @ApiResponse({ status: 422, type: ErroRespostaDto })
  criarReserva(
    @Param('tenantId') tenantId: string,
    @Param('quadraId') quadraId: string,
    @Body() dto: CriarReservaPublicaDto,
    @UsuarioAtual('sub') usuarioId: string,
  ) {
    return this.publicoService.criarReserva({ tenantId, quadraId, slotId: dto.slotId, usuarioId });
  }

  @Post('tenants/:tenantId/quadras/:quadraId/reservas/lote')
  @UseGuards(JwtAuthGuard)
  @Papeis(Papel.USUARIO)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Criar multiplas reservas PENDENTES para um mesmo usuario e marcar slots como RESERVADO (transacional).',
  })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, type: ErroRespostaDto })
  @ApiResponse({ status: 422, type: ErroRespostaDto })
  criarReservasLote(
    @Param('tenantId') tenantId: string,
    @Param('quadraId') quadraId: string,
    @Body() dto: CriarReservasPublicasLoteDto,
    @UsuarioAtual('sub') usuarioId: string,
  ) {
    return this.publicoService.criarReservasLote({
      tenantId,
      quadraId,
      slotIds: dto.slotIds,
      usuarioId,
    });
  }

  @Get('tenants/:tenantId/avaliacoes')
  @ApiOperation({ summary: 'Listar avaliacoes publicas do tenant com media de notas.' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, type: ErroRespostaDto })
  listarAvaliacoes(@Param('tenantId') tenantId: string) {
    return this.avaliacoesService.listarPublicasPorTenant(tenantId);
  }

  @Get('tenants/:tenantId/campeonatos')
  @ApiOperation({ summary: 'Listar campeonatos abertos do tenant.' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, type: ErroRespostaDto })
  listarCampeonatos(@Param('tenantId') tenantId: string) {
    return this.publicoService.listarCampeonatos(tenantId);
  }

  @Get('campeonatos/:campeonatoId')
  @ApiOperation({ summary: 'Buscar detalhes publicos de um campeonato.' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, type: ErroRespostaDto })
  buscarCampeonato(@Param('campeonatoId') campeonatoId: string) {
    return this.publicoService.buscarCampeonato(campeonatoId);
  }

  @Post('campeonatos/:campeonatoId/inscricoes')
  @UseGuards(JwtAuthGuard)
  @Papeis(Papel.USUARIO)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inscrever usuario autenticado em campeonato aberto.' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 404, type: ErroRespostaDto })
  @ApiResponse({ status: 409, type: ErroRespostaDto })
  @ApiResponse({ status: 422, type: ErroRespostaDto })
  inscreverCampeonato(
    @Param('campeonatoId') campeonatoId: string,
    @UsuarioAtual('sub') usuarioId: string,
  ) {
    return this.publicoService.inscreverEmCampeonato(campeonatoId, usuarioId);
  }
}
