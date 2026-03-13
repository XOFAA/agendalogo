import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AvaliacoesService } from '../avaliacoes/avaliacoes.service';
import { TenantAtual } from '../comum/decorators/tenant-atual.decorator';
import { Papeis } from '../comum/decorators/papeis.decorator';
import { ErroRespostaDto } from '../comum/dto/erro-resposta.dto';
import { Papel } from '../comum/enum/papel.enum';
import { EscopoTenantGuard } from '../comum/guards/escopo-tenant.guard';
import { JwtAuthGuard } from '../comum/guards/jwt-auth.guard';
import { QuadrasService } from '../quadras/quadras.service';
import { ReservasService } from '../reservas/reservas.service';
import { SlotsService } from '../slots/slots.service';
import { CampeonatosService } from '../campeonatos/campeonatos.service';
import { CriarCampeonatoTenantDto } from './campeonatos/dto/criar-campeonato-tenant.dto';
import { CriarQuadraDto } from './quadras/dto/criar-quadra.dto';
import { EditarQuadraDto } from './quadras/dto/editar-quadra.dto';
import { CriarReservaPresencialDto } from './reservas/dto/criar-reserva-presencial.dto';
import { ListarReservasTenantQueryDto } from './reservas/dto/listar-reservas-tenant-query.dto';
import { BloquearSlotsDto } from './slots/dto/bloquear-slots.dto';
import { CriarSlotsDto } from './slots/dto/criar-slots.dto';
import { ListarDisponibilidadeQueryDto } from './slots/dto/listar-disponibilidade-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { Request } from 'express';
import { inicioEFimDoDia } from '../comum/utils/tempo';

const uploadDir = join(process.cwd(), 'uploads', 'quadras');
mkdirSync(uploadDir, { recursive: true });

function sanitizeFilename(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

const quadraImageInterceptor = FileInterceptor('imagem', {
  storage: diskStorage({
    destination: uploadDir,
    filename: (_req: Request, file: Express.Multer.File, callback) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const extension = extname(file.originalname || '') || '.jpg';
      callback(null, `${sanitizeFilename(file.fieldname)}-${uniqueSuffix}${extension}`);
    },
  }),
  fileFilter: (_req: Request, file: Express.Multer.File, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new Error('Arquivo enviado nao e uma imagem.'), false);
      return;
    }
    callback(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

@ApiTags('Dono Tenant')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-tenant-id',
  required: false,
  description: 'Tenant alvo do dono autenticado. Obrigatorio quando o dono possui mais de um tenant.',
})
@UseGuards(JwtAuthGuard, EscopoTenantGuard)
@Papeis(Papel.DONO_TENANT)
@Controller('tenant')
export class DonoTenantController {
  constructor(
    private readonly quadrasService: QuadrasService,
    private readonly slotsService: SlotsService,
    private readonly reservasService: ReservasService,
    private readonly avaliacoesService: AvaliacoesService,
    private readonly campeonatosService: CampeonatosService,
  ) {}

  @Get('quadras')
  @ApiOperation({ summary: 'Listar quadras do tenant autenticado.' })
  listarQuadras(@TenantAtual() tenantId: string) {
    return this.quadrasService.listarPorTenant(tenantId, false);
  }

  @Post('quadras')
  @ApiOperation({ summary: 'Criar quadra no tenant autenticado.' })
  criarQuadra(@TenantAtual() tenantId: string, @Body() dto: CriarQuadraDto) {
    return this.quadrasService.criar(tenantId, dto.nome, dto.tipoEsporte, dto.imagemUrl);
  }

  @Patch('quadras/:quadraId')
  @ApiOperation({ summary: 'Editar quadra do proprio tenant.' })
  editarQuadra(
    @TenantAtual() tenantId: string,
    @Param('quadraId') quadraId: string,
    @Body() dto: EditarQuadraDto,
  ) {
    return this.quadrasService.atualizarDoTenant(tenantId, quadraId, dto);
  }

  @Post('quadras/:quadraId/imagem')
  @UseInterceptors(quadraImageInterceptor)
  @ApiOperation({ summary: 'Enviar foto da quadra do tenant autenticado.' })
  async enviarImagemQuadra(
    @TenantAtual() tenantId: string,
    @Param('quadraId') quadraId: string,
    @UploadedFile() file?: { filename: string },
  ) {
    if (!file?.filename) {
      return {
        upload: false,
        mensagem: 'Nenhuma imagem enviada.',
      };
    }

    const imagemUrl = `/uploads/quadras/${file.filename}`;
    const quadra = await this.quadrasService.atualizarImagemDoTenant(tenantId, quadraId, imagemUrl);

    return {
      upload: true,
      imagemUrl,
      quadra,
    };
  }

  @Delete('quadras/:quadraId')
  @ApiOperation({ summary: 'Desativar quadra (soft delete -> ativa=false).' })
  desativarQuadra(@TenantAtual() tenantId: string, @Param('quadraId') quadraId: string) {
    return this.quadrasService.atualizarDoTenant(tenantId, quadraId, { ativa: false });
  }

  @Post('quadras/:quadraId/slots')
  @ApiOperation({ summary: 'Criar slots em lote para quadra do tenant.' })
  @ApiResponse({ status: 409, type: ErroRespostaDto })
  criarSlots(
    @TenantAtual() tenantId: string,
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
    @TenantAtual() tenantId: string,
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
  removerSlot(@TenantAtual() tenantId: string, @Param('slotId') slotId: string) {
    return this.slotsService.removerDoTenant(tenantId, slotId);
  }

  @Get('slots/disponibilidade')
  @ApiOperation({ summary: 'Listar slots do tenant por dia, incluindo disponiveis, reservados e bloqueados.' })
  listarDisponibilidadeDia(
    @TenantAtual() tenantId: string,
    @Query() query: ListarDisponibilidadeQueryDto,
  ) {
    const { inicio, fim } = inicioEFimDoDia(query.data);
    return this.slotsService.listarDisponibilidadeDoTenant(tenantId, inicio, fim);
  }

  @Get('reservas')
  @ApiOperation({ summary: 'Listar reservas do tenant com filtros opcionais.' })
  listarReservas(
    @TenantAtual() tenantId: string,
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
  cancelarReserva(@TenantAtual() tenantId: string, @Param('reservaId') reservaId: string) {
    return this.reservasService.cancelarPorTenant(tenantId, reservaId);
  }

  @Patch('reservas/:reservaId/confirmar')
  @ApiOperation({ summary: 'Confirmar reserva PENDENTE do tenant.' })
  @ApiResponse({ status: 422, type: ErroRespostaDto })
  confirmarReserva(@TenantAtual() tenantId: string, @Param('reservaId') reservaId: string) {
    return this.reservasService.confirmarPorTenant(tenantId, reservaId);
  }

  @Post('reservas/presencial')
  @ApiOperation({ summary: 'Criar reserva presencial do tenant, ja confirmada, com taxa fixa aplicada.' })
  criarReservaPresencial(
    @TenantAtual() tenantId: string,
    @Body() dto: CriarReservaPresencialDto,
  ) {
    return this.reservasService.criarReservaPresencial({
      tenantId,
      quadraId: dto.quadraId,
      slotId: dto.slotId,
      clienteNome: dto.clienteNome,
      clienteEmail: dto.clienteEmail,
    });
  }

  @Get('avaliacoes')
  @ApiOperation({ summary: 'Listar avaliacoes recebidas pelo tenant autenticado.' })
  listarAvaliacoesTenant(@TenantAtual() tenantId: string) {
    return this.avaliacoesService.listarDoTenant(tenantId);
  }

  @Get('campeonatos')
  @ApiOperation({ summary: 'Listar campeonatos do tenant autenticado.' })
  listarCampeonatosTenant(@TenantAtual() tenantId: string) {
    return this.campeonatosService.listarDoTenant(tenantId);
  }

  @Post('campeonatos')
  @ApiOperation({ summary: 'Criar campeonato no tenant autenticado.' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 422, type: ErroRespostaDto })
  criarCampeonatoTenant(
    @TenantAtual() tenantId: string,
    @Body() dto: CriarCampeonatoTenantDto,
  ) {
    return this.campeonatosService.criarNoTenant(tenantId, dto);
  }

  @Patch('campeonatos/:campeonatoId/encerrar')
  @ApiOperation({ summary: 'Encerrar campeonato do tenant autenticado.' })
  encerrarCampeonatoTenant(
    @TenantAtual() tenantId: string,
    @Param('campeonatoId') campeonatoId: string,
  ) {
    return this.campeonatosService.encerrarDoTenant(tenantId, campeonatoId);
  }
}
