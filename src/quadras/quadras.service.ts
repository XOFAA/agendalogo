import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoEsporte } from '@prisma/client';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

@Injectable()
export class QuadrasService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorTenant(tenantId: string, apenasAtivas = false) {
    return this.prisma.quadra.findMany({
      where: { tenantId, ...(apenasAtivas ? { ativa: true } : {}) },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async criar(
    tenantId: string,
    nome: string,
    tipoEsporte: TipoEsporte,
    imagemUrl?: string,
  ) {
    return this.prisma.quadra.create({
      data: { tenantId, nome, imagemUrl, tipoEsporte, ativa: true },
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
    dados: { nome?: string; imagemUrl?: string | null; tipoEsporte?: TipoEsporte; ativa?: boolean },
  ) {
    await this.buscarDoTenant(tenantId, quadraId);
    return this.prisma.quadra.update({ where: { id: quadraId }, data: dados });
  }

  async atualizarImagemDoTenant(tenantId: string, quadraId: string, imagemUrl: string) {
    const quadra = await this.buscarDoTenant(tenantId, quadraId);

    if (quadra.imagemUrl) {
      const caminhoAnterior = join(process.cwd(), quadra.imagemUrl.replace(/^\//, ''));
      await unlink(caminhoAnterior).catch(() => undefined);
    }

    return this.prisma.quadra.update({
      where: { id: quadraId },
      data: { imagemUrl },
    });
  }
}
