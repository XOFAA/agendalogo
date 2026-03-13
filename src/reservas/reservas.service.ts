import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PapelUsuario, Prisma, StatusReserva, StatusSlot } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsuariosService } from '../usuarios/usuarios.service';

const TAXA_RESERVA_CENTAVOS = 200;

@Injectable()
export class ReservasService {
  private readonly horasLimiteCancelamento: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {
    this.horasLimiteCancelamento = this.config.get<number>('CANCELAMENTO_HORAS_LIMITE', 2);
  }

  private async validarSlotDisponivel(
    tx: Prisma.TransactionClient,
    params: { tenantId: string; quadraId: string; slotId: string },
  ) {
    const agora = new Date();
    const slot = await tx.slotDisponibilidade.findFirst({
      where: {
        id: params.slotId,
        tenantId: params.tenantId,
        quadraId: params.quadraId,
      },
    });

    if (!slot) {
      throw new NotFoundException({
        codigo: 'SLOT_NAO_ENCONTRADO',
        mensagem: 'Slot nao encontrado.',
      });
    }

    if (slot.status !== StatusSlot.ABERTO) {
      throw new ConflictException({
        codigo: 'SLOT_INDISPONIVEL',
        mensagem: 'Slot nao esta disponivel para reserva.',
      });
    }

    if (slot.inicioEm <= agora) {
      throw new UnprocessableEntityException({
        codigo: 'SLOT_NO_PASSADO',
        mensagem: 'Nao e permitido reservar slot no passado.',
      });
    }

    return slot;
  }

  private async criarReservaInterna(
    tx: Prisma.TransactionClient,
    params: {
      tenantId: string;
      quadraId: string;
      slotId: string;
      usuarioId: string;
      status: StatusReserva;
    },
  ) {
    const slot = await this.validarSlotDisponivel(tx, params);

    const reserva = await tx.reserva.create({
      data: {
        tenantId: params.tenantId,
        quadraId: params.quadraId,
        usuarioId: params.usuarioId,
        slotId: params.slotId,
        status: params.status,
        valorTotalCentavos: slot.precoCentavos + TAXA_RESERVA_CENTAVOS,
      },
      include: {
        slot: true,
        quadra: true,
        usuario: true,
      },
    });

    await tx.slotDisponibilidade.update({
      where: { id: slot.id },
      data: { status: StatusSlot.RESERVADO },
    });

    return reserva;
  }

  private async obterOuCriarClientePresencial(params: {
    nome: string;
    email?: string;
  }) {
    const emailInformado = params.email?.trim().toLowerCase();

    if (emailInformado) {
      const usuarioExistente = await this.usuariosService.buscarPorEmail(emailInformado);
      if (usuarioExistente) {
        return usuarioExistente;
      }
    }

    const emailGerado =
      emailInformado ??
      `presencial+${Date.now()}-${Math.round(Math.random() * 1_000_000)}@agendalogo.local`;

    return this.usuariosService.criarUsuario({
      nome: params.nome,
      email: emailGerado,
      senha: `presencial-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`,
      papel: PapelUsuario.USUARIO,
    });
  }

  async criarReservaPublica(params: {
    tenantId: string;
    quadraId: string;
    slotId: string;
    usuarioId: string;
  }) {
    return this.prisma.$transaction((tx) =>
      this.criarReservaInterna(tx, {
        ...params,
        status: StatusReserva.CONFIRMADA,
      }),
    );
  }

  async criarReservasPublicasLote(params: {
    tenantId: string;
    quadraId: string;
    slotIds: string[];
    usuarioId: string;
  }) {
    const slotIdsUnicos = Array.from(new Set(params.slotIds));

    return this.prisma.$transaction(async (tx) => {
      const slots = await tx.slotDisponibilidade.findMany({
        where: {
          id: { in: slotIdsUnicos },
          tenantId: params.tenantId,
          quadraId: params.quadraId,
        },
        orderBy: { inicioEm: 'asc' },
      });

      if (slots.length !== slotIdsUnicos.length) {
        throw new NotFoundException({
          codigo: 'SLOT_NAO_ENCONTRADO',
          mensagem: 'Um ou mais slots nao foram encontrados para esta quadra.',
        });
      }

      for (const slot of slots) {
        await this.validarSlotDisponivel(tx, {
          tenantId: params.tenantId,
          quadraId: params.quadraId,
          slotId: slot.id,
        });
      }

      const reservas = [];
      let valorTotalCentavos = 0;

      for (const slot of slots) {
        const reserva = await this.criarReservaInterna(tx, {
          tenantId: params.tenantId,
          quadraId: params.quadraId,
          usuarioId: params.usuarioId,
          slotId: slot.id,
          status: StatusReserva.CONFIRMADA,
        });
        reservas.push(reserva);
        valorTotalCentavos += reserva.valorTotalCentavos;
      }

      return {
        totalReservas: reservas.length,
        valorTotalCentavos,
        reservas,
      };
    });
  }

  async criarReservaPresencial(params: {
    tenantId: string;
    quadraId: string;
    slotId: string;
    clienteNome: string;
    clienteEmail?: string;
  }) {
    const cliente = await this.obterOuCriarClientePresencial({
      nome: params.clienteNome,
      email: params.clienteEmail,
    });

    return this.prisma.$transaction((tx) =>
      this.criarReservaInterna(tx, {
        tenantId: params.tenantId,
        quadraId: params.quadraId,
        slotId: params.slotId,
        usuarioId: cliente.id,
        status: StatusReserva.CONFIRMADA,
      }),
    );
  }

  async listarMinhasReservas(usuarioId: string) {
    return this.prisma.reserva.findMany({
      where: { usuarioId },
      include: { slot: true, quadra: true, tenant: true },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async listarReservasTenant(params: {
    tenantId: string;
    status?: StatusReserva;
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    return this.prisma.reserva.findMany({
      where: {
        tenantId: params.tenantId,
        ...(params.status ? { status: params.status } : {}),
        ...(params.dataInicio || params.dataFim
          ? {
              criadoEm: {
                ...(params.dataInicio ? { gte: params.dataInicio } : {}),
                ...(params.dataFim ? { lte: params.dataFim } : {}),
              },
            }
          : {}),
      },
      include: { slot: true, quadra: true, usuario: true },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async cancelarPorUsuario(usuarioId: string, reservaId: string) {
    return this.cancelarInterno({ reservaId, usuarioId });
  }

  async cancelarPorTenant(tenantId: string, reservaId: string) {
    return this.cancelarInterno({ reservaId, tenantId });
  }

  private async cancelarInterno(filtro: { reservaId: string; usuarioId?: string; tenantId?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const reserva = await tx.reserva.findFirst({
        where: {
          id: filtro.reservaId,
          ...(filtro.usuarioId ? { usuarioId: filtro.usuarioId } : {}),
          ...(filtro.tenantId ? { tenantId: filtro.tenantId } : {}),
        },
        include: { slot: true },
      });

      if (!reserva) {
        throw new NotFoundException({
          codigo: 'RESERVA_NAO_ENCONTRADA',
          mensagem: 'Reserva nao encontrada.',
        });
      }

      if (reserva.status !== StatusReserva.PENDENTE && reserva.status !== StatusReserva.CONFIRMADA) {
        throw new UnprocessableEntityException({
          codigo: 'RESERVA_SEM_CANCELAMENTO',
          mensagem: 'Somente reservas pendentes ou confirmadas podem ser canceladas.',
        });
      }

      const limite = new Date(Date.now() + this.horasLimiteCancelamento * 60 * 60 * 1000);
      if (reserva.slot.inicioEm <= limite) {
        throw new UnprocessableEntityException({
          codigo: 'FORA_JANELA_CANCELAMENTO',
          mensagem: `Cancelamento permitido somente com ${this.horasLimiteCancelamento}h de antecedencia.`,
        });
      }

      const reservaAtualizada = await tx.reserva.update({
        where: { id: reserva.id },
        data: { status: StatusReserva.CANCELADA },
      });

      await tx.slotDisponibilidade.update({
        where: { id: reserva.slotId },
        data: { status: StatusSlot.ABERTO },
      });

      return reservaAtualizada;
    });
  }

  async confirmarPorTenant(tenantId: string, reservaId: string) {
    const reserva = await this.prisma.reserva.findFirst({
      where: { id: reservaId, tenantId },
    });

    if (!reserva) {
      throw new NotFoundException({
        codigo: 'RESERVA_NAO_ENCONTRADA',
        mensagem: 'Reserva nao encontrada.',
      });
    }

    if (reserva.status !== StatusReserva.PENDENTE) {
      throw new UnprocessableEntityException({
        codigo: 'STATUS_INVALIDO_CONFIRMACAO',
        mensagem: 'Somente reserva PENDENTE pode ser confirmada.',
      });
    }

    return this.prisma.reserva.update({
      where: { id: reservaId },
      data: { status: StatusReserva.CONFIRMADA },
    });
  }
}
