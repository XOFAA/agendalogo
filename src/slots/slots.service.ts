import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, StatusSlot } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SlotsService {
  constructor(private readonly prisma: PrismaService) {}

  async criarLote(
    tenantId: string,
    quadraId: string,
    slots: Array<{ inicioEm: Date; fimEm: Date; precoCentavos: number }>,
  ) {
    if (slots.length === 0) {
      throw new BadRequestException({
        codigo: 'LISTA_SLOTS_VAZIA',
        mensagem: 'Lista de slots nao pode estar vazia.',
      });
    }

    const agora = new Date();
    for (const slot of slots) {
      if (slot.inicioEm >= slot.fimEm) {
        throw new UnprocessableEntityException({
          codigo: 'INTERVALO_SLOT_INVALIDO',
          mensagem: 'inicioEm deve ser menor que fimEm.',
        });
      }
      if (slot.inicioEm <= agora) {
        throw new UnprocessableEntityException({
          codigo: 'SLOT_NO_PASSADO',
          mensagem: 'Nao e permitido criar slot com inicio no passado.',
        });
      }
    }

    try {
      await this.prisma.slotDisponibilidade.createMany({
        data: slots.map((slot) => ({
          tenantId,
          quadraId,
          inicioEm: slot.inicioEm,
          fimEm: slot.fimEm,
          precoCentavos: slot.precoCentavos,
          status: StatusSlot.ABERTO,
        })),
      });
    } catch (erro) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
        throw new ConflictException({
          codigo: 'SLOT_DUPLICADO',
          mensagem: 'Ja existe slot com este intervalo para a quadra.',
        });
      }
      throw erro;
    }

    return this.prisma.slotDisponibilidade.findMany({
      where: { tenantId, quadraId },
      orderBy: { inicioEm: 'asc' },
      take: slots.length,
    });
  }

  async bloquear(
    tenantId: string,
    quadraId: string,
    payload: {
      slotIds?: string[];
      inicioIntervalo?: Date;
      fimIntervalo?: Date;
    },
  ) {
    const filtroBase = { tenantId, quadraId, status: { not: StatusSlot.RESERVADO } };
    let where: Prisma.SlotDisponibilidadeWhereInput = { ...filtroBase };

    if (payload.slotIds && payload.slotIds.length > 0) {
      where = { ...where, id: { in: payload.slotIds } };
    } else if (payload.inicioIntervalo && payload.fimIntervalo) {
      where = {
        ...where,
        inicioEm: { gte: payload.inicioIntervalo },
        fimEm: { lte: payload.fimIntervalo },
      };
    } else {
      throw new BadRequestException({
        codigo: 'FILTRO_BLOQUEIO_INVALIDO',
        mensagem: 'Informe slotIds ou intervalo para bloqueio.',
      });
    }

    const resultado = await this.prisma.slotDisponibilidade.updateMany({
      where,
      data: { status: StatusSlot.BLOQUEADO },
    });

    return { totalAtualizado: resultado.count };
  }

  async removerDoTenant(tenantId: string, slotId: string) {
    const slot = await this.prisma.slotDisponibilidade.findFirst({
      where: { id: slotId, tenantId },
    });

    if (!slot) {
      throw new NotFoundException({
        codigo: 'SLOT_NAO_ENCONTRADO',
        mensagem: 'Slot nao encontrado.',
      });
    }

    if (slot.status === StatusSlot.RESERVADO) {
      throw new ConflictException({
        codigo: 'SLOT_RESERVADO',
        mensagem: 'Nao e permitido remover slot reservado.',
      });
    }

    await this.prisma.slotDisponibilidade.delete({ where: { id: slotId } });
    return { removido: true };
  }

  async listarPublicos(tenantId: string, quadraId: string, inicio: Date, fim: Date) {
    const agora = new Date();
    return this.prisma.slotDisponibilidade.findMany({
      where: {
        tenantId,
        quadraId,
        status: StatusSlot.ABERTO,
        inicioEm: {
          gte: inicio > agora ? inicio : agora,
          lte: fim,
        },
      },
      orderBy: { inicioEm: 'asc' },
    });
  }

  async listarDisponibilidadeDoTenant(tenantId: string, inicio: Date, fim: Date) {
    return this.prisma.slotDisponibilidade.findMany({
      where: {
        tenantId,
        inicioEm: {
          gte: inicio,
          lte: fim,
        },
      },
      include: {
        quadra: true,
        reserva: {
          include: {
            usuario: true,
          },
        },
      },
      orderBy: [{ quadra: { nome: 'asc' } }, { inicioEm: 'asc' }],
    });
  }
}
