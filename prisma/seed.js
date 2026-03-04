/* eslint-disable no-console */
const { PrismaClient, PapelUsuario, TipoEsporte, StatusSlot, StatusReserva, StatusCampeonato } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

function createInterval(baseDate, daysAhead, startHour, durationMinutes) {
  const start = new Date(baseDate);
  start.setUTCDate(start.getUTCDate() + daysAhead);
  start.setUTCHours(startHour, 0, 0, 0);

  const end = new Date(start);
  end.setUTCMinutes(end.getUTCMinutes() + durationMinutes);

  return { start, end };
}

async function ensureCourt(tenantId, name, sport) {
  const existing = await prisma.quadra.findFirst({ where: { tenantId, nome: name } });
  if (existing) {
    return existing;
  }

  return prisma.quadra.create({
    data: {
      tenantId,
      nome: name,
      tipoEsporte: sport,
      ativa: true,
    },
  });
}

async function ensureTenantWithOwner(config, passwordHash) {
  const tenant = await prisma.tenant.upsert({
    where: { slug: config.slug },
    update: { nome: config.name, imagemUrl: config.imageUrl, logoUrl: config.logoUrl },
    create: { nome: config.name, slug: config.slug, imagemUrl: config.imageUrl, logoUrl: config.logoUrl },
  });

  await prisma.usuario.upsert({
    where: { email: config.ownerEmail },
    update: {
      nome: config.ownerName,
      papel: PapelUsuario.DONO_TENANT,
      tenantId: tenant.id,
      senhaHash: passwordHash,
    },
    create: {
      nome: config.ownerName,
      email: config.ownerEmail,
      senhaHash: passwordHash,
      papel: PapelUsuario.DONO_TENANT,
      tenantId: tenant.id,
    },
  });

  const courts = [];
  for (const court of config.courts) {
    const createdCourt = await ensureCourt(tenant.id, court.name, court.sport);
    courts.push({ ...court, id: createdCourt.id });
  }

  return { tenant, courts };
}

async function seedSlotsForCourt(tenantId, courtId, priceCents) {
  const now = new Date();
  const slots = [];
  const businessHours = Array.from({ length: 14 }, (_, index) => index + 8);

  for (let day = 1; day <= 10; day += 1) {
    for (const hour of businessHours) {
      const period = createInterval(now, day, hour, 60);
      slots.push({
        tenantId,
        quadraId: courtId,
        inicioEm: period.start,
        fimEm: period.end,
        precoCentavos: priceCents,
        status: StatusSlot.ABERTO,
      });
    }
  }

  await prisma.slotDisponibilidade.createMany({
    data: slots,
    skipDuplicates: true,
  });
}

async function ensureReservationAndReview({ tenantId, courtId, userId, rating, comment }) {
  const slot = await prisma.slotDisponibilidade.findFirst({
    where: {
      tenantId,
      quadraId: courtId,
      inicioEm: { gt: new Date() },
    },
    orderBy: { inicioEm: 'asc' },
  });

  if (!slot) {
    return;
  }

  await prisma.reserva.upsert({
    where: { slotId: slot.id },
    update: {
      status: StatusReserva.CONFIRMADA,
      valorTotalCentavos: slot.precoCentavos,
      usuarioId: userId,
      tenantId,
      quadraId: courtId,
    },
    create: {
      tenantId,
      quadraId: courtId,
      usuarioId: userId,
      slotId: slot.id,
      status: StatusReserva.CONFIRMADA,
      valorTotalCentavos: slot.precoCentavos,
    },
  });

  await prisma.slotDisponibilidade.update({
    where: { id: slot.id },
    data: { status: StatusSlot.RESERVADO },
  });

  await prisma.avaliacao.upsert({
    where: {
      tenantId_usuarioId: { tenantId, usuarioId: userId },
    },
    update: {
      nota: rating,
      comentario: comment,
    },
    create: {
      tenantId,
      usuarioId: userId,
      nota: rating,
      comentario: comment,
    },
  });
}

async function ensureChampionships(tenantId, courts) {
  const now = new Date();
  const uniqueSports = Array.from(new Set(courts.map((court) => court.sport)));
  const openChampionships = [];

  for (const [index, sport] of uniqueSports.slice(0, 2).entries()) {
    const championship = await prisma.campeonato.upsert({
      where: { id: index === 0 ? `seed-camp-open-${tenantId}` : `seed-camp-open-${tenantId}-${sport}` },
      update: {
        nome: `Copa ${sport} Arena`,
        descricao: `Campeonato de ${sport.toLowerCase()} com fase de grupos e eliminatorias.`,
        tipoEsporte: sport,
        dataInicio: new Date(now.getTime() + (7 + index * 3) * 24 * 60 * 60 * 1000),
        dataFim: new Date(now.getTime() + (14 + index * 3) * 24 * 60 * 60 * 1000),
        valorInscricaoCentavos: 12000 + index * 3000,
        maxParticipantes: 12 + index * 4,
        status: StatusCampeonato.ABERTO,
        tenantId,
      },
      create: {
        id: index === 0 ? `seed-camp-open-${tenantId}` : `seed-camp-open-${tenantId}-${sport}`,
        tenantId,
        nome: `Copa ${sport} Arena`,
        descricao: `Campeonato de ${sport.toLowerCase()} com fase de grupos e eliminatorias.`,
        tipoEsporte: sport,
        dataInicio: new Date(now.getTime() + (7 + index * 3) * 24 * 60 * 60 * 1000),
        dataFim: new Date(now.getTime() + (14 + index * 3) * 24 * 60 * 60 * 1000),
        valorInscricaoCentavos: 12000 + index * 3000,
        maxParticipantes: 12 + index * 4,
        status: StatusCampeonato.ABERTO,
      },
    });
    openChampionships.push(championship);
  }

  const targetSport = uniqueSports[0] || TipoEsporte.FUTEBOL;

  await prisma.campeonato.upsert({
    where: { id: `seed-camp-closed-${tenantId}` },
    update: {
      nome: 'Liga de Inverno',
      descricao: 'Edicao encerrada.',
      tipoEsporte: targetSport,
      dataInicio: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      dataFim: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      valorInscricaoCentavos: 12000,
      maxParticipantes: 8,
      status: StatusCampeonato.ENCERRADO,
      tenantId,
    },
    create: {
      id: `seed-camp-closed-${tenantId}`,
      tenantId,
      nome: 'Liga de Inverno',
      descricao: 'Edicao encerrada.',
      tipoEsporte: targetSport,
      dataInicio: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      dataFim: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      valorInscricaoCentavos: 12000,
      maxParticipantes: 8,
      status: StatusCampeonato.ENCERRADO,
    },
  });

  return openChampionships;
}

async function main() {
  const passwordHash = await bcrypt.hash('Senha@1234', 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@plataforma.com' },
    update: {
      nome: 'Admin Plataforma',
      papel: PapelUsuario.ADMIN_PLATAFORMA,
      tenantId: null,
      senhaHash: passwordHash,
    },
    create: {
      nome: 'Admin Plataforma',
      email: 'admin@plataforma.com',
      senhaHash: passwordHash,
      papel: PapelUsuario.ADMIN_PLATAFORMA,
      tenantId: null,
    },
  });

  const userA = await prisma.usuario.upsert({
    where: { email: 'cliente1@email.com' },
    update: {
      nome: 'Cliente Um',
      papel: PapelUsuario.USUARIO,
      tenantId: null,
      senhaHash: passwordHash,
    },
    create: {
      nome: 'Cliente Um',
      email: 'cliente1@email.com',
      senhaHash: passwordHash,
      papel: PapelUsuario.USUARIO,
      tenantId: null,
    },
  });

  const userB = await prisma.usuario.upsert({
    where: { email: 'cliente2@email.com' },
    update: {
      nome: 'Cliente Dois',
      papel: PapelUsuario.USUARIO,
      tenantId: null,
      senhaHash: passwordHash,
    },
    create: {
      nome: 'Cliente Dois',
      email: 'cliente2@email.com',
      senhaHash: passwordHash,
      papel: PapelUsuario.USUARIO,
      tenantId: null,
    },
  });
  const userC = await prisma.usuario.upsert({
    where: { email: 'cliente3@email.com' },
    update: {
      nome: 'Cliente Tres',
      papel: PapelUsuario.USUARIO,
      tenantId: null,
      senhaHash: passwordHash,
    },
    create: {
      nome: 'Cliente Tres',
      email: 'cliente3@email.com',
      senhaHash: passwordHash,
      papel: PapelUsuario.USUARIO,
      tenantId: null,
    },
  });
  const userD = await prisma.usuario.upsert({
    where: { email: 'cliente4@email.com' },
    update: {
      nome: 'Cliente Quatro',
      papel: PapelUsuario.USUARIO,
      tenantId: null,
      senhaHash: passwordHash,
    },
    create: {
      nome: 'Cliente Quatro',
      email: 'cliente4@email.com',
      senhaHash: passwordHash,
      papel: PapelUsuario.USUARIO,
      tenantId: null,
    },
  });

  const tenantConfigs = [
    {
      name: 'Arena Gol de Placa',
      slug: 'arena-gol-de-placa',
      imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=200&q=80',
      ownerName: 'Dono Gol de Placa',
      ownerEmail: 'dono@goldeplaca.com',
      courts: [
        { name: 'Campo Futebol Society', sport: TipoEsporte.FUTEBOL, priceCents: 15000 },
        { name: 'Quadra Basquete Pro', sport: TipoEsporte.BASQUETE, priceCents: 9000 },
      ],
    },
    {
      name: 'Beach Arena Copacabana',
      slug: 'beach-arena-copacabana',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=200&q=80',
      ownerName: 'Dona Beach Arena',
      ownerEmail: 'dona@beacharena.com',
      courts: [
        { name: 'Beach Tennis Premium', sport: TipoEsporte.TENIS, priceCents: 12000 },
        { name: 'Arena Areia Volei', sport: TipoEsporte.VOLEI, priceCents: 11000 },
      ],
    },
    {
      name: 'Tennis Club Premium',
      slug: 'tennis-club-premium',
      imageUrl: 'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1541534401786-2077eed87a72?auto=format&fit=crop&w=200&q=80',
      ownerName: 'Dono Tennis Club',
      ownerEmail: 'dono@tennisclub.com',
      courts: [
        { name: 'Quadra Tenis Coberta', sport: TipoEsporte.TENIS, priceCents: 20000 },
        { name: 'Quadra Tenis Rapida', sport: TipoEsporte.TENIS, priceCents: 18000 },
      ],
    },
    {
      name: 'Ping Pong Center',
      slug: 'ping-pong-center',
      imageUrl: 'https://images.unsplash.com/photo-1611251135345-18c56206b863?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=200&q=80',
      ownerName: 'Dono Ping Pong',
      ownerEmail: 'dono@pingpongcenter.com',
      courts: [
        { name: 'Mesa Oficial 1', sport: TipoEsporte.OUTROS, priceCents: 6000 },
        { name: 'Mesa Oficial 2', sport: TipoEsporte.OUTROS, priceCents: 6000 },
      ],
    },
  ];

  for (const config of tenantConfigs) {
    const seeded = await ensureTenantWithOwner(config, passwordHash);

    for (const court of seeded.courts) {
      await seedSlotsForCourt(seeded.tenant.id, court.id, court.priceCents);
    }

    const reviewPlan = [
      { userId: userA.id, rating: 5, comment: `Excelente experiencia na ${seeded.tenant.nome}.` },
      { userId: userB.id, rating: 4, comment: `Estrutura muito boa na ${seeded.tenant.nome}.` },
      { userId: userC.id, rating: 5, comment: `Atendimento top e quadra impecavel em ${seeded.tenant.nome}.` },
      { userId: userD.id, rating: 4, comment: `Voltarei para jogar novamente em ${seeded.tenant.nome}.` },
    ];

    for (const [index, review] of reviewPlan.entries()) {
      const court = seeded.courts[index % seeded.courts.length];
      await ensureReservationAndReview({
        tenantId: seeded.tenant.id,
        courtId: court.id,
        userId: review.userId,
        rating: review.rating,
        comment: review.comment,
      });
    }

    const campeonatosAbertos = await ensureChampionships(seeded.tenant.id, seeded.courts);

    for (const campeonatoAberto of campeonatosAbertos) {
      await prisma.campeonatoInscricao.upsert({
        where: {
          campeonatoId_usuarioId: {
            campeonatoId: campeonatoAberto.id,
            usuarioId: userA.id,
          },
        },
        update: {},
        create: {
          campeonatoId: campeonatoAberto.id,
          usuarioId: userA.id,
        },
      });
    }
  }

  const [tenantCount, courtCount, slotCount, bookingCount, ratingCount, championshipCount] = await Promise.all([
    prisma.tenant.count(),
    prisma.quadra.count(),
    prisma.slotDisponibilidade.count(),
    prisma.reserva.count(),
    prisma.avaliacao.count(),
    prisma.campeonato.count(),
  ]);

  console.log('Seed concluido com sucesso.');
  console.log(`Tenants: ${tenantCount}`);
  console.log(`Quadras: ${courtCount}`);
  console.log(`Slots: ${slotCount}`);
  console.log(`Reservas: ${bookingCount}`);
  console.log(`Avaliacoes: ${ratingCount}`);
  console.log(`Campeonatos: ${championshipCount}`);
  console.log('Login admin: admin@plataforma.com / Senha: Senha@1234');
  console.log('Login usuario: cliente1@email.com / Senha: Senha@1234');
  console.log(`API URL esperada no front: ${process.env.CORS_ORIGIN || '*'} (CORS)`);
  console.log(`Admin id: ${admin.id}`);
}

main()
  .catch((error) => {
    console.error('Erro no seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
