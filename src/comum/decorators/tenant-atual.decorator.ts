import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantAtual = createParamDecorator((_: never, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.tenantIdEscopo ?? req.user?.tenantId ?? null;
});
