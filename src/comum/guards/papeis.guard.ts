import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CHAVE_PAPEIS } from '../decorators/papeis.decorator';
import { Papel } from '../enum/papel.enum';
import { UsuarioToken } from '../types/usuario-token.type';

@Injectable()
export class PapeisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const papeisPermitidos = this.reflector.getAllAndOverride<Papel[]>(CHAVE_PAPEIS, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!papeisPermitidos || papeisPermitidos.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const usuario = req.user as UsuarioToken | undefined;

    if (!usuario) {
      throw new ForbiddenException({
        codigo: 'SEM_PERMISSAO',
        mensagem: 'Usuario sem permissao para acessar este recurso.',
      });
    }

    if (!papeisPermitidos.includes(usuario.papel)) {
      throw new ForbiddenException({
        codigo: 'SEM_PERMISSAO',
        mensagem: 'Papel sem permissao para acessar este recurso.',
      });
    }

    return true;
  }
}
