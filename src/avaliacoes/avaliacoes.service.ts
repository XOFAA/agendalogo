import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { StatusReserva } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AvaliacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async avaliarTenant(usuarioId: string, dto: { tenantId: string; nota: number; comentario?: string }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: dto.tenantId } });
    if (!tenant) {
      throw new NotFoundException({
        codigo: 'TENANT_NAO_ENCONTRADO',
        mensagem: 'Tenant nao encontrado.',
      });
    }

    const possuiReservaNoTenant = await this.prisma.reserva.findFirst({
      where: {
        tenantId: dto.tenantId,
        usuarioId,
        status: {
          in: [StatusReserva.PENDENTE, StatusReserva.CONFIRMADA],
        },
      },
      select: { id: true },
    });

    if (!possuiReservaNoTenant) {
      throw new UnprocessableEntityException({
        codigo: 'AVALIACAO_SEM_RESERVA',
        mensagem: 'Somente usuarios com reserva neste tenant podem avaliar.',
      });
    }

    return this.prisma.avaliacao.upsert({
      where: {
        tenantId_usuarioId: {
          tenantId: dto.tenantId,
          usuarioId,
        },
      },
      update: {
        nota: dto.nota,
        comentario: dto.comentario,
      },
      create: {
        tenantId: dto.tenantId,
        usuarioId,
        nota: dto.nota,
        comentario: dto.comentario,
      },
    });
  }

  async listarPublicasPorTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException({
        codigo: 'TENANT_NAO_ENCONTRADO',
        mensagem: 'Tenant nao encontrado.',
      });
    }

    const [avaliacoes, agregacao] = await Promise.all([
      this.prisma.avaliacao.findMany({
        where: { tenantId },
        include: { usuario: { select: { id: true, nome: true } } },
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.avaliacao.aggregate({
        where: { tenantId },
        _avg: { nota: true },
        _count: { _all: true },
      }),
    ]);

    return {
      tenantId,
      mediaNotas: agregacao._avg.nota ? Number(agregacao._avg.nota.toFixed(2)) : 0,
      totalAvaliacoes: agregacao._count._all,
      avaliacoes,
    };
  }

  listarDoTenant(tenantId: string) {
    return this.prisma.avaliacao.findMany({
      where: { tenantId },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }
}
