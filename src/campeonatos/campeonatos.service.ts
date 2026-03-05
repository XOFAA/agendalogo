import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PapelUsuario, StatusCampeonato, StatusReserva } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CriarCampeonatoDto } from './dto/criar-campeonato.dto';

@Injectable()
export class CampeonatosService {
  constructor(private readonly prisma: PrismaService) {}

  async criarNoTenant(tenantId: string, dto: CriarCampeonatoDto) {
    const inicio = new Date(dto.dataInicio);
    const fim = new Date(dto.dataFim);

    if (fim <= inicio) {
      throw new UnprocessableEntityException({
        codigo: 'CAMPEONATO_PERIODO_INVALIDO',
        mensagem: 'dataFim deve ser maior que dataInicio.',
      });
    }

    return this.prisma.campeonato.create({
      data: {
        tenantId,
        nome: dto.nome,
        descricao: dto.descricao,
        tipoEsporte: dto.tipoEsporte,
        dataInicio: inicio,
        dataFim: fim,
        valorInscricaoCentavos: dto.valorInscricaoCentavos,
        maxParticipantes: dto.maxParticipantes,
      },
    });
  }

  listarDoTenant(tenantId: string) {
    return this.prisma.campeonato.findMany({
      where: { tenantId },
      include: {
        _count: { select: { inscricoes: true } },
      },
      orderBy: [{ status: 'asc' }, { dataInicio: 'asc' }],
    });
  }

  async listarPublicosPorTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException({
        codigo: 'TENANT_NAO_ENCONTRADO',
        mensagem: 'Tenant nao encontrado.',
      });
    }

    const campeonatos = await this.prisma.campeonato.findMany({
      where: {
        tenantId,
        status: StatusCampeonato.ABERTO,
      },
      include: {
        tenant: {
          select: {
            id: true,
            nome: true,
            imagemUrl: true,
            logoUrl: true,
          },
        },
        _count: { select: { inscricoes: true } },
      },
      orderBy: { dataInicio: 'asc' },
    });

    const ownerMembership = await this.prisma.usuarioTenant.findFirst({
      where: { tenantId },
      select: { usuarioId: true },
    });

    const owner = ownerMembership
      ? await this.prisma.usuario.findFirst({
          where: { id: ownerMembership.usuarioId, papel: PapelUsuario.DONO_TENANT },
          select: { id: true, nome: true, email: true },
        })
      : await this.prisma.usuario.findFirst({
          where: { tenantId, papel: PapelUsuario.DONO_TENANT },
          select: { id: true, nome: true, email: true },
        });

    return campeonatos.map((camp) => ({
      ...camp,
      organizador: owner,
    }));
  }

  async buscarPublicoPorId(campeonatoId: string) {
    const campeonato = await this.prisma.campeonato.findUnique({
      where: { id: campeonatoId },
      include: {
        tenant: {
          select: {
            id: true,
            nome: true,
            imagemUrl: true,
            logoUrl: true,
          },
        },
        _count: { select: { inscricoes: true } },
      },
    });

    if (!campeonato) {
      throw new NotFoundException({
        codigo: 'CAMPEONATO_NAO_ENCONTRADO',
        mensagem: 'Campeonato nao encontrado.',
      });
    }

    const ownerMembership = await this.prisma.usuarioTenant.findFirst({
      where: { tenantId: campeonato.tenantId },
      select: { usuarioId: true },
    });

    const owner = ownerMembership
      ? await this.prisma.usuario.findFirst({
          where: { id: ownerMembership.usuarioId, papel: PapelUsuario.DONO_TENANT },
          select: { id: true, nome: true, email: true },
        })
      : await this.prisma.usuario.findFirst({
          where: { tenantId: campeonato.tenantId, papel: PapelUsuario.DONO_TENANT },
          select: { id: true, nome: true, email: true },
        });

    return {
      ...campeonato,
      organizador: owner,
    };
  }

  async encerrarDoTenant(tenantId: string, campeonatoId: string) {
    const campeonato = await this.prisma.campeonato.findFirst({
      where: { id: campeonatoId, tenantId },
    });

    if (!campeonato) {
      throw new NotFoundException({
        codigo: 'CAMPEONATO_NAO_ENCONTRADO',
        mensagem: 'Campeonato nao encontrado.',
      });
    }

    return this.prisma.campeonato.update({
      where: { id: campeonatoId },
      data: { status: StatusCampeonato.ENCERRADO },
    });
  }

  async inscreverUsuario(campeonatoId: string, usuarioId: string) {
    return this.prisma.$transaction(async (tx) => {
      const campeonato = await tx.campeonato.findUnique({
        where: { id: campeonatoId },
        include: { _count: { select: { inscricoes: true } } },
      });

      if (!campeonato) {
        throw new NotFoundException({
          codigo: 'CAMPEONATO_NAO_ENCONTRADO',
          mensagem: 'Campeonato nao encontrado.',
        });
      }

      if (campeonato.status !== StatusCampeonato.ABERTO) {
        throw new UnprocessableEntityException({
          codigo: 'CAMPEONATO_FECHADO',
          mensagem: 'Campeonato nao esta aberto para inscricao.',
        });
      }

      if (campeonato._count.inscricoes >= campeonato.maxParticipantes) {
        throw new ConflictException({
          codigo: 'CAMPEONATO_LOTADO',
          mensagem: 'Campeonato lotado.',
        });
      }

      const jaInscrito = await tx.campeonatoInscricao.findUnique({
        where: {
          campeonatoId_usuarioId: { campeonatoId, usuarioId },
        },
      });

      if (jaInscrito) {
        throw new ConflictException({
          codigo: 'USUARIO_JA_INSCRITO',
          mensagem: 'Usuario ja inscrito neste campeonato.',
        });
      }

      const possuiReservaValida = await tx.reserva.findFirst({
        where: {
          tenantId: campeonato.tenantId,
          usuarioId,
          status: {
            in: [StatusReserva.PENDENTE, StatusReserva.CONFIRMADA],
          },
        },
        select: { id: true },
      });

      if (!possuiReservaValida) {
        throw new UnprocessableEntityException({
          codigo: 'INSCRICAO_SEM_RESERVA',
          mensagem: 'A inscricao exige ao menos uma reserva valida nesta arena.',
        });
      }

      const inscricao = await tx.campeonatoInscricao.create({
        data: {
          campeonatoId,
          usuarioId,
        },
      });

      return {
        inscricao,
        campeonatoId,
      };
    });
  }
}
