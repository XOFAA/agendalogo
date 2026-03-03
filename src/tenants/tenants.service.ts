import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(nome: string, slug: string) {
    return this.prisma.tenant.create({ data: { nome, slug } });
  }

  async listar() {
    return this.prisma.tenant.findMany({ orderBy: { criadoEm: 'desc' } });
  }

  async buscarPorId(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException({
        codigo: 'TENANT_NAO_ENCONTRADO',
        mensagem: 'Tenant nao encontrado.',
      });
    }
    return tenant;
  }

  async atualizar(tenantId: string, dados: { nome?: string; slug?: string }) {
    await this.buscarPorId(tenantId);
    return this.prisma.tenant.update({ where: { id: tenantId }, data: dados });
  }
}
