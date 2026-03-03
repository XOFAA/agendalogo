import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoEsporte } from '@prisma/client';

@Injectable()
export class QuadrasService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorTenant(tenantId: string, apenasAtivas = false) {
    return this.prisma.quadra.findMany({
      where: { tenantId, ...(apenasAtivas ? { ativa: true } : {}) },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async criar(tenantId: string, nome: string, tipoEsporte: TipoEsporte) {
    return this.prisma.quadra.create({
      data: { tenantId, nome, tipoEsporte, ativa: true },
    });
  }

  async buscarDoTenant(tenantId: string, quadraId: string) {
    const quadra = await this.prisma.quadra.findFirst({
      where: { id: quadraId, tenantId },
    });

    if (!quadra) {
      throw new NotFoundException({
        codigo: 'QUADRA_NAO_ENCONTRADA',
        mensagem: 'Quadra nao encontrada.',
      });
    }
    return quadra;
  }

  async atualizarDoTenant(
    tenantId: string,
    quadraId: string,
    dados: { nome?: string; tipoEsporte?: TipoEsporte; ativa?: boolean },
  ) {
    await this.buscarDoTenant(tenantId, quadraId);
    return this.prisma.quadra.update({ where: { id: quadraId }, data: dados });
  }
}
