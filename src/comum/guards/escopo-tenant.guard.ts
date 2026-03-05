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

    if (usuario.papel === Papel.DONO_TENANT) {
      const tenantIds = (usuario.tenantIds ?? []).length
        ? usuario.tenantIds
        : usuario.tenantId
          ? [usuario.tenantId]
          : [];

      if (!tenantIds.length) {
        throw new ForbiddenException({
          codigo: 'TENANT_AUSENTE_TOKEN',
          mensagem: 'Usuario DONO_TENANT sem tenant vinculado no token.',
        });
      }

      const tenantIdHeader = req.headers['x-tenant-id'];
      const tenantIdSolicitado = Array.isArray(tenantIdHeader) ? tenantIdHeader[0] : tenantIdHeader;

      if (tenantIdSolicitado && !tenantIds.includes(tenantIdSolicitado)) {
        throw new ForbiddenException({
          codigo: 'TENANT_FORA_ESCOPO',
          mensagem: 'Tenant informado nao pertence ao dono autenticado.',
        });
      }

      const tenantIdEscopo = tenantIdSolicitado ?? usuario.tenantId ?? tenantIds[0];
      req.tenantIdEscopo = tenantIdEscopo;
      req.user = {
        ...usuario,
        tenantId: tenantIdEscopo,
        tenantIds,
      };
    }

    return true;
  }
}
