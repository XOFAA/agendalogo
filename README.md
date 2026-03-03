# SaaS Multi-tenant de Agendamento de Quadras (NestJS + Prisma)

## Stack
- Node.js + TypeScript
- NestJS
- Prisma + MySQL
- JWT (access token)
- class-validator + class-transformer
- Swagger/OpenAPI (`/docs`)

## Configuracao
Copie `.env.example` para `.env` e preencha:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CANCELAMENTO_HORAS_LIMITE` (padrao `2`)
- `CORS_ORIGIN`
- `RATE_LIMIT_TTL`
- `RATE_LIMIT_LIMIT`

## Como rodar
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run start:dev
```

Swagger: `http://localhost:3000/docs`

## Escopo multi-tenant
- Rotas de DONO_TENANT: `tenantId` vem do JWT, nunca do body.
- Rotas publicas: `tenantId` vem do path `/publico/tenants/:tenantId/...`.
- Acesso cruzado retorna `404` para evitar enumeracao de recursos.

## Politica de cancelamento
- Cancelamento permitido somente com antecedencia minima de `CANCELAMENTO_HORAS_LIMITE` horas (padrao 2h).

## Resposta padrao
### Sucesso
```json
{ "sucesso": true, "dados": {} }
```

### Erro
```json
{
  "sucesso": false,
  "erro": {
    "codigo": "CODIGO_ESTAVEL",
    "mensagem": "Mensagem em portugues",
    "detalhes": {}
  },
  "traceId": "uuid"
}
```

## Endpoints principais
### Autenticacao
- `POST /autenticacao/registrar`
- `POST /autenticacao/entrar`
- `GET /autenticacao/eu`

### Admin
- `POST /admin/tenants`
- `GET /admin/tenants`
- `PATCH /admin/tenants/:tenantId`
- `POST /admin/usuarios`
- `GET /admin/usuarios`

### Publico
- `GET /publico/tenants`
- `GET /publico/tenants/:tenantId`
- `GET /publico/tenants/:tenantId/quadras`
- `GET /publico/tenants/:tenantId/quadras/:quadraId/slots?data=YYYY-MM-DD`
- `POST /publico/tenants/:tenantId/quadras/:quadraId/reservas`

### Dono do Tenant
- `GET /tenant/quadras`
- `POST /tenant/quadras`
- `PATCH /tenant/quadras/:quadraId`
- `DELETE /tenant/quadras/:quadraId`
- `POST /tenant/quadras/:quadraId/slots`
- `POST /tenant/quadras/:quadraId/slots/bloquear`
- `DELETE /tenant/slots/:slotId`
- `GET /tenant/reservas`
- `PATCH /tenant/reservas/:reservaId/cancelar`
- `PATCH /tenant/reservas/:reservaId/confirmar`

### Usuario final
- `GET /usuario/minhas-reservas`
- `PATCH /usuario/minhas-reservas/:reservaId/cancelar`
- `POST /usuario/avaliacoes`

### Avaliacoes
- `GET /publico/tenants/:tenantId/avaliacoes`
- `GET /tenant/avaliacoes`

## Seed de dados
O seed cria um cenario pronto com:
- Tenant: `Arena Evento Pro`
- Quadras: `Campo Futebol Society` e `Arena Areia Volei`
- Slots futuros (7 dias, 18h-21h) com precos:
  - Futebol: `R$ 180,00` (`18000` centavos)
  - Volei de areia: `R$ 140,00` (`14000` centavos)
- Reservas confirmadas e avaliacoes iniciais
- Usuarios de exemplo (senha para todos: `Senha@1234`):
  - `admin@plataforma.com` (ADMIN_PLATAFORMA)
  - `dono@arenaeventopro.com` (DONO_TENANT)
  - `cliente1@email.com` (USUARIO)
  - `cliente2@email.com` (USUARIO)
