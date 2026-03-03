import { Body, Controller, Get, Patch, Post, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Papeis } from '../comum/decorators/papeis.decorator';
import { ErroRespostaDto } from '../comum/dto/erro-resposta.dto';
import { Papel } from '../comum/enum/papel.enum';
import { JwtAuthGuard } from '../comum/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { CriarTenantAdminDto } from './dto/criar-tenant-admin.dto';
import { CriarUsuarioAdminDto } from './dto/criar-usuario-admin.dto';
import { EditarTenantAdminDto } from './dto/editar-tenant-admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Papeis(Papel.ADMIN_PLATAFORMA)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('tenants')
  @ApiOperation({ summary: 'Criar tenant (somente ADMIN_PLATAFORMA).' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 403, type: ErroRespostaDto })
  criarTenant(@Body() dto: CriarTenantAdminDto) {
    return this.adminService.criarTenant(dto);
  }

  @Get('tenants')
  @ApiOperation({ summary: 'Listar tenants (somente ADMIN_PLATAFORMA).' })
  listarTenants() {
    return this.adminService.listarTenants();
  }

  @Patch('tenants/:tenantId')
  @ApiOperation({ summary: 'Editar tenant (somente ADMIN_PLATAFORMA).' })
  editarTenant(@Param('tenantId') tenantId: string, @Body() dto: EditarTenantAdminDto) {
    return this.adminService.editarTenant(tenantId, dto);
  }

  @Post('usuarios')
  @ApiOperation({ summary: 'Criar usuario com papel definido (somente ADMIN_PLATAFORMA).' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400, type: ErroRespostaDto })
  criarUsuario(@Body() dto: CriarUsuarioAdminDto) {
    return this.adminService.criarUsuario(dto);
  }

  @Get('usuarios')
  @ApiOperation({ summary: 'Listar usuarios (somente ADMIN_PLATAFORMA).' })
  listarUsuarios() {
    return this.adminService.listarUsuarios();
  }
}
