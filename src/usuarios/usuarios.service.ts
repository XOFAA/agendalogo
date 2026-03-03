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
};

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async criarUsuario(params: CriarUsuarioParams): Promise<Usuario> {
    const papel = params.papel ?? PapelUsuario.USUARIO;

    if (papel === PapelUsuario.DONO_TENANT && !params.tenantId) {
      throw new BadRequestException({
        codigo: 'TENANT_OBRIGATORIO',
        mensagem: 'tenantId e obrigatorio para papel DONO_TENANT.',
      });
    }

    const senhaHash = await bcrypt.hash(params.senha, 10);

    try {
      return await this.prisma.usuario.create({
        data: {
          nome: params.nome,
          email: params.email.toLowerCase(),
          senhaHash,
          papel,
          tenantId: params.tenantId ?? null,
        },
      });
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

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
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
