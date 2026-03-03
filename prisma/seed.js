/* eslint-disable no-console */
const { PrismaClient, PapelUsuario, TipoEsporte, StatusSlot, StatusReserva } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function garantirQuadra(tenantId, nome, tipoEsporte) {
  const existente = await prisma.quadra.findFirst({
    where: { tenantId, nome },
  });

  if (existente) return existente;

  return prisma.quadra.create({
    data: { tenantId, nome, tipoEsporte, ativa: true },
  });
}

function criarIntervalo(base, dias, horaInicio, duracaoMin) {
  const inicio = new Date(base);
  inicio.setUTCDate(inicio.getUTCDate() + dias);
  inicio.setUTCHours(horaInicio, 0, 0, 0);

  const fim = new Date(inicio);
  fim.setUTCMinutes(fim.getUTCMinutes() + duracaoMin);

  return { inicio, fim };
}

async function main() {
  const senhaHash = await bcrypt.hash('Senha@1234', 10);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'arena-evento-pro' },
    update: { nome: 'Arena Evento Pro' },
    create: { nome: 'Arena Evento Pro', slug: 'arena-evento-pro' },
  });

  const dono = await prisma.usuario.upsert({
    where: { email: 'dono@arenaeventopro.com' },
    update: { nome: 'Dono Arena', papel: PapelUsuario.DONO_TENANT, tenantId: tenant.id, senhaHash },
    create: {
      nome: 'Dono Arena',
      email: 'dono@arenaeventopro.com',
      senhaHash,
      papel: PapelUsuario.DONO_TENANT,
      tenantId: tenant.id,
    },
  });

  const usuarioA = await prisma.usuario.upsert({
    where: { email: 'cliente1@email.com' },
    update: { nome: 'Cliente Um', papel: PapelUsuario.USUARIO, tenantId: null, senhaHash },
    create: {
      nome: 'Cliente Um',
      email: 'cliente1@email.com',
      senhaHash,
      papel: PapelUsuario.USUARIO,
      tenantId: null,
    },
  });

  const usuarioB = await prisma.usuario.upsert({
    where: { email: 'cliente2@email.com' },
    update: { nome: 'Cliente Dois', papel: PapelUsuario.USUARIO, tenantId: null, senhaHash },
    create: {
      nome: 'Cliente Dois',
      email: 'cliente2@email.com',
      senhaHash,
      papel: PapelUsuario.USUARIO,
      tenantId: null,
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'admin@plataforma.com' },
    update: { nome: 'Admin Plataforma', papel: PapelUsuario.ADMIN_PLATAFORMA, tenantId: null, senhaHash },
    create: {
      nome: 'Admin Plataforma',
      email: 'admin@plataforma.com',
      senhaHash,
      papel: PapelUsuario.ADMIN_PLATAFORMA,
      tenantId: null,
    },
  });

  const quadraFutebol = await garantirQuadra(tenant.id, 'Campo Futebol Society', TipoEsporte.FUTEBOL);
  const quadraVoleiAreia = await garantirQuadra(tenant.id, 'Arena Areia Volei', TipoEsporte.VOLEI);

  const agora = new Date();
  const slots = [];

  for (let dia = 1; dia <= 7; dia += 1) {
    for (const hora of [18, 19, 20, 21]) {
      const futebol = criarIntervalo(agora, dia, hora, 60);
      slots.push({
        tenantId: tenant.id,
        quadraId: quadraFutebol.id,
        inicioEm: futebol.inicio,
        fimEm: futebol.fim,
        precoCentavos: 18000,
        status: StatusSlot.ABERTO,
      });

      const volei = criarIntervalo(agora, dia, hora, 60);
      slots.push({
        tenantId: tenant.id,
        quadraId: quadraVoleiAreia.id,
        inicioEm: volei.inicio,
        fimEm: volei.fim,
        precoCentavos: 14000,
        status: StatusSlot.ABERTO,
      });
    }
  }

  await prisma.slotDisponibilidade.createMany({
    data: slots,
    skipDuplicates: true,
  });

  const slotParaReserva = await prisma.slotDisponibilidade.findFirst({
    where: {
      tenantId: tenant.id,
      quadraId: quadraFutebol.id,
      status: StatusSlot.ABERTO,
      inicioEm: { gt: new Date() },
    },
    orderBy: { inicioEm: 'asc' },
  });

  if (slotParaReserva) {
    await prisma.reserva.upsert({
      where: { slotId: slotParaReserva.id },
      update: {
        status: StatusReserva.CONFIRMADA,
        valorTotalCentavos: slotParaReserva.precoCentavos,
      },
      create: {
        tenantId: tenant.id,
        quadraId: quadraFutebol.id,
        usuarioId: usuarioA.id,
        slotId: slotParaReserva.id,
        status: StatusReserva.CONFIRMADA,
        valorTotalCentavos: slotParaReserva.precoCentavos,
      },
    });

    await prisma.slotDisponibilidade.update({
      where: { id: slotParaReserva.id },
      data: { status: StatusSlot.RESERVADO },
    });
  }

  const slotVoleiParaReserva = await prisma.slotDisponibilidade.findFirst({
    where: {
      tenantId: tenant.id,
      quadraId: quadraVoleiAreia.id,
      status: StatusSlot.ABERTO,
      inicioEm: { gt: new Date() },
    },
    orderBy: { inicioEm: 'asc' },
  });

  if (slotVoleiParaReserva) {
    await prisma.reserva.upsert({
      where: { slotId: slotVoleiParaReserva.id },
      update: {
        status: StatusReserva.CONFIRMADA,
        valorTotalCentavos: slotVoleiParaReserva.precoCentavos,
      },
      create: {
        tenantId: tenant.id,
        quadraId: quadraVoleiAreia.id,
        usuarioId: usuarioB.id,
        slotId: slotVoleiParaReserva.id,
        status: StatusReserva.CONFIRMADA,
        valorTotalCentavos: slotVoleiParaReserva.precoCentavos,
      },
    });

    await prisma.slotDisponibilidade.update({
      where: { id: slotVoleiParaReserva.id },
      data: { status: StatusSlot.RESERVADO },
    });
  }

  await prisma.avaliacao.upsert({
    where: { tenantId_usuarioId: { tenantId: tenant.id, usuarioId: usuarioA.id } },
    update: { nota: 5, comentario: 'Otima estrutura, iluminacao e atendimento.' },
    create: {
      tenantId: tenant.id,
      usuarioId: usuarioA.id,
      nota: 5,
      comentario: 'Otima estrutura, iluminacao e atendimento.',
    },
  });

  await prisma.avaliacao.upsert({
    where: { tenantId_usuarioId: { tenantId: tenant.id, usuarioId: usuarioB.id } },
    update: { nota: 4, comentario: 'Arena de areia muito boa para volei.' },
    create: {
      tenantId: tenant.id,
      usuarioId: usuarioB.id,
      nota: 4,
      comentario: 'Arena de areia muito boa para volei.',
    },
  });

  console.log('Seed concluido com sucesso.');
  console.log('Tenant:', tenant.slug);
  console.log('Login dono:', dono.email, '/ Senha: Senha@1234');
  console.log('Login usuario:', usuarioA.email, '/ Senha: Senha@1234');
}

main()
  .catch((erro) => {
    console.error('Erro no seed:', erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
