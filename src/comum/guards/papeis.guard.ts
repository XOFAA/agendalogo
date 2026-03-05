import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { CHAVE_PAPEIS } from '../decorators/papeis.decorator';
import { Papel } from '../enum/papel.enum';
import { UsuarioToken } from '../types/usuario-token.type';

@Injectable()
export class PapeisGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const papeisPermitidos = this.reflector.getAllAndOverride<Papel[]>(CHAVE_PAPEIS, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!papeisPermitidos || papeisPermitidos.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    let usuario = req.user as UsuarioToken | undefined;

    if (!usuario && typeof req.headers?.authorization === 'string') {
      const [tipo, token] = req.headers.authorization.split(' ');
      if (tipo === 'Bearer' && token) {
        try {
          usuario = this.jwtService.verify<UsuarioToken>(token);
          req.user = usuario;
        } catch {
          throw new ForbiddenException({
            codigo: 'TOKEN_INVALIDO',
            mensagem: 'Token JWT invalido ou expirado.',
          });
        }
      }
    }

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
