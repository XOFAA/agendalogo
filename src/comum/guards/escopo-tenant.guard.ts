import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Papel } from '../enum/papel.enum';
import { UsuarioToken } from '../types/usuario-token.type';

@Injectable()
export class EscopoTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const usuario = req.user as UsuarioToken | undefined;

    if (!usuario) {
      return true;
    }

    if (usuario.papel === Papel.DONO_TENANT && !usuario.tenantId) {
      throw new ForbiddenException({
        codigo: 'TENANT_AUSENTE_TOKEN',
        mensagem: 'Usuario DONO_TENANT sem tenant vinculado no token.',
      });
    }

    return true;
  }
}
