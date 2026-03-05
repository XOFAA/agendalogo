import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PapelUsuario, Prisma, Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

type CriarUsuarioParams = {
  nome: string;
  email: string;
  senha: string;
  papel?: PapelUsuario;
  tenantId?: string | null;
  tenantIds?: string[];
};

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  private mapOwnedTenantIds(ownedTenants: Array<{ tenantId: string }>): { tenantId: string }[] {
    return ownedTenants.map((item) => ({ tenantId: item.tenantId }));
  }

  async criarUsuario(
    params: CriarUsuarioParams,
  ): Promise<Usuario & { ownedTenants: { tenantId: string }[] }> {
    const papel = params.papel ?? PapelUsuario.USUARIO;
    const tenantIdsNormalizados = Array.from(
      new Set([...(params.tenantIds ?? []), ...(params.tenantId ? [params.tenantId] : [])]),
    );

    if (papel === PapelUsuario.DONO_TENANT && !tenantIdsNormalizados.length) {
      throw new BadRequestException({
        codigo: 'TENANT_OBRIGATORIO',
        mensagem: 'tenantId ou tenantIds e obrigatorio para papel DONO_TENANT.',
      });
    }

    if (papel !== PapelUsuario.DONO_TENANT && (params.tenantId || (params.tenantIds ?? []).length)) {
      throw new BadRequestException({
        codigo: 'TENANT_NAO_PERMITIDO',
        mensagem: 'tenantId/tenantIds so devem ser informados para papel DONO_TENANT.',
      });
    }

    const senhaHash = await bcrypt.hash(params.senha, 10);
    const tenantPrincipalId =
      papel === PapelUsuario.DONO_TENANT ? tenantIdsNormalizados[0] ?? null : null;

    try {
      const usuarioCriado = await this.prisma.usuario.create({
        data: {
          nome: params.nome,
          email: params.email.toLowerCase(),
          senhaHash,
          papel,
          tenantId: tenantPrincipalId,
        },
      });

      if (papel === PapelUsuario.DONO_TENANT && tenantIdsNormalizados.length) {
        await this.prisma.usuarioTenant.createMany({
          data: tenantIdsNormalizados.map((tenantId) => ({
            usuarioId: usuarioCriado.id,
            tenantId,
          })),
          skipDuplicates: true,
        });
      }

      return {
        ...usuarioCriado,
        ownedTenants: tenantIdsNormalizados.map((tenantId) => ({ tenantId })),
      };
    } catch (erro) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
        throw new ConflictException({
          codigo: 'EMAIL_JA_CADASTRADO',
          mensagem: 'Ja existe usuario com este e-mail.',
        });
      }
      throw erro;
    }
  }

  async buscarPorEmail(email: string): Promise<(Usuario & { ownedTenants: { tenantId: string }[] }) | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!usuario) {
      return null;
    }

    const ownedTenants = await this.prisma.usuarioTenant.findMany({
      where: { usuarioId: usuario.id },
      select: { tenantId: true },
    });

    return {
      ...usuario,
      ownedTenants: this.mapOwnedTenantIds(ownedTenants),
    };
  }

  async buscarPorId(id: string): Promise<Usuario> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new NotFoundException({
        codigo: 'USUARIO_NAO_ENCONTRADO',
        mensagem: 'Usuario nao encontrado.',
      });
    }
    return usuario;
  }

  async listar(): Promise<Usuario[]> {
    return this.prisma.usuario.findMany({ orderBy: { criadoEm: 'desc' } });
  }

  async validarSenha(senha: string, senhaHash: string): Promise<boolean> {
    return bcrypt.compare(senha, senhaHash);
  }
}
