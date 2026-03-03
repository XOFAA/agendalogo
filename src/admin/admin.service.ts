import { BadRequestException, Injectable } from '@nestjs/common';
import { PapelUsuario } from '@prisma/client';
import { TenantsService } from '../tenants/tenants.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CriarTenantAdminDto } from './dto/criar-tenant-admin.dto';
import { CriarUsuarioAdminDto } from './dto/criar-usuario-admin.dto';
import { EditarTenantAdminDto } from './dto/editar-tenant-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly usuariosService: UsuariosService,
  ) {}

  criarTenant(dto: CriarTenantAdminDto) {
    return this.tenantsService.criar(dto.nome, dto.slug);
  }

  listarTenants() {
    return this.tenantsService.listar();
  }

  editarTenant(tenantId: string, dto: EditarTenantAdminDto) {
    return this.tenantsService.atualizar(tenantId, dto);
  }

  async criarUsuario(dto: CriarUsuarioAdminDto) {
    if (dto.papel === PapelUsuario.DONO_TENANT && !dto.tenantId) {
      throw new BadRequestException({
        codigo: 'TENANT_OBRIGATORIO',
        mensagem: 'Para DONO_TENANT, tenantId e obrigatorio.',
      });
    }

    if (dto.papel !== PapelUsuario.DONO_TENANT && dto.tenantId) {
      throw new BadRequestException({
        codigo: 'TENANT_NAO_PERMITIDO',
        mensagem: 'tenantId so deve ser informado para papel DONO_TENANT.',
      });
    }

    return this.usuariosService.criarUsuario({
      nome: dto.nome,
      email: dto.email,
      senha: dto.senha,
      papel: dto.papel,
      tenantId: dto.tenantId ?? null,
    });
  }

  listarUsuarios() {
    return this.usuariosService.listar();
  }
}
