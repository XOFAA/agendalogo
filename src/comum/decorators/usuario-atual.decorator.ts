import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UsuarioToken } from '../types/usuario-token.type';

export const UsuarioAtual = createParamDecorator(
  (campo: keyof UsuarioToken | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const usuario = req.user as UsuarioToken;
    if (campo) return usuario?.[campo];
    return usuario;
  },
);
