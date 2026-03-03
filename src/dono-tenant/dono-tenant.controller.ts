import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AvaliacoesService } from '../avaliacoes/avaliacoes.service';
import { UsuarioAtual } from '../comum/decorators/usuario-atual.decorator';
import { Papeis } from '../comum/decorators/papeis.decorator';
import { ErroRespostaDto } from '../comum/dto/erro-resposta.dto';
import { Papel } from '../comum/enum/papel.enum';
import { EscopoTenantGuard } from '../comum/guards/escopo-tenant.guard';
import { JwtAuthGuard } from '../comum/guards/jwt-auth.guard';
import { QuadrasService } from '../quadras/quadras.service';
import { ReservasService } from '../reservas/reservas.service';
import { SlotsService } from '../slots/slots.service';
import { CriarQuadraDto } from './quadras/dto/criar-quadra.dto';
import { EditarQuadraDto } from './quadras/dto/editar-quadra.dto';
import { ListarReservasTenantQueryDto } from './reservas/dto/listar-reservas-tenant-query.dto';
import { BloquearSlotsDto } from './slots/dto/bloquear-slots.dto';
import { CriarSlotsDto } from './slots/dto/criar-slots.dto';

@ApiTags('Dono Tenant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EscopoTenantGuard)
@Papeis(Papel.DONO_TENANT)
@Controller('tenant')
export class DonoTenantController {
  constructor(
    private readonly quadrasService: QuadrasService,
    private readonly slotsService: SlotsService,
    private readonly reservasService: ReservasService,
    private readonly avaliacoesService: AvaliacoesService,
  ) {}

  @Get('quadras')
  @ApiOperation({ summary: 'Listar quadras do tenant autenticado.' })
  listarQuadras(@UsuarioAtual('tenantId') tenantId: string) {
    return this.quadrasService.listarPorTenant(tenantId, false);
  }

  @Post('quadras')
  @ApiOperation({ summary: 'Criar quadra no tenant autenticado.' })
  criarQuadra(@UsuarioAtual('tenantId') tenantId: string, @Body() dto: CriarQuadraDto) {
    return this.quadrasService.criar(tenantId, dto.nome, dto.tipoEsporte);
  }

  @Patch('quadras/:quadraId')
  @ApiOperation({ summary: 'Editar quadra do proprio tenant.' })
  editarQuadra(
    @UsuarioAtual('tenantId') tenantId: string,
    @Param('quadraId') quadraId: string,
    @Body() dto: EditarQuadraDto,
  ) {
    return this.quadrasService.atualizarDoTenant(tenantId, quadraId, dto);
  }

  @Delete('quadras/:quadraId')
  @ApiOperation({ summary: 'Desativar quadra (soft delete -> ativa=false).' })
  desativarQuadra(@UsuarioAtual('tenantId') tenantId: string, @Param('quadraId') quadraId: string) {
    return this.quadrasService.atualizarDoTenant(tenantId, quadraId, { ativa: false });
  }

  @Post('quadras/:quadraId/slots')
  @ApiOperation({ summary: 'Criar slots em lote para quadra do tenant.' })
  @ApiResponse({ status: 409, type: ErroRespostaDto })
  criarSlots(
    @UsuarioAtual('tenantId') tenantId: string,
    @Param('quadraId') quadraId: string,
    @Body() dto: CriarSlotsDto,
  ) {
    return this.slotsService.criarLote(
      tenantId,
      quadraId,
      dto.slots.map((slot) => ({
        inicioEm: new Date(slot.inicioEm),
        fimEm: new Date(slot.fimEm),
        precoCentavos: slot.precoCentavos,
      })),
    );
  }

  @Post('quadras/:quadraId/slots/bloquear')
  @ApiOperation({ summary: 'Bloquear slots por ids ou por intervalo.' })
  bloquearSlots(
    @UsuarioAtual('tenantId') tenantId: string,
    @Param('quadraId') quadraId: string,
    @Body() dto: BloquearSlotsDto,
  ) {
    return this.slotsService.bloquear(tenantId, quadraId, {
      slotIds: dto.slotIds,
      inicioIntervalo: dto.inicioIntervalo ? new Date(dto.inicioIntervalo) : undefined,
      fimIntervalo: dto.fimIntervalo ? new Date(dto.fimIntervalo) : undefined,
    });
  }

  @Delete('slots/:slotId')
  @ApiOperation({ summary: 'Remover slot do tenant (exceto se RESERVADO).' })
  removerSlot(@UsuarioAtual('tenantId') tenantId: string, @Param('slotId') slotId: string) {
    return this.slotsService.removerDoTenant(tenantId, slotId);
  }

  @Get('reservas')
  @ApiOperation({ summary: 'Listar reservas do tenant com filtros opcionais.' })
  listarReservas(
    @UsuarioAtual('tenantId') tenantId: string,
    @Query() query: ListarReservasTenantQueryDto,
  ) {
    return this.reservasService.listarReservasTenant({
      tenantId,
      status: query.status,
      dataInicio: query.dataInicio ? new Date(query.dataInicio) : undefined,
      dataFim: query.dataFim ? new Date(query.dataFim) : undefined,
    });
  }

  @Patch('reservas/:reservaId/cancelar')
  @ApiOperation({ summary: 'Cancelar reserva do tenant.' })
  @ApiResponse({ status: 422, type: ErroRespostaDto })
  cancelarReserva(@UsuarioAtual('tenantId') tenantId: string, @Param('reservaId') reservaId: string) {
    return this.reservasService.cancelarPorTenant(tenantId, reservaId);
  }

  @Patch('reservas/:reservaId/confirmar')
  @ApiOperation({ summary: 'Confirmar reserva PENDENTE do tenant.' })
  @ApiResponse({ status: 422, type: ErroRespostaDto })
  confirmarReserva(@UsuarioAtual('tenantId') tenantId: string, @Param('reservaId') reservaId: string) {
    return this.reservasService.confirmarPorTenant(tenantId, reservaId);
  }

  @Get('avaliacoes')
  @ApiOperation({ summary: 'Listar avaliacoes recebidas pelo tenant autenticado.' })
  listarAvaliacoesTenant(@UsuarioAtual('tenantId') tenantId: string) {
    return this.avaliacoesService.listarDoTenant(tenantId);
  }
}
