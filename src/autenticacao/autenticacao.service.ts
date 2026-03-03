import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PapelUsuario } from '@prisma/client';
import { UsuariosService } from '../usuarios/usuarios.service';
import { EntrarDto } from './dto/entrar.dto';
import { RegistrarDto } from './dto/registrar.dto';

@Injectable()
export class AutenticacaoService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async registrar(dto: RegistrarDto) {
    const usuario = await this.usuariosService.criarUsuario({
      nome: dto.nome,
      email: dto.email,
      senha: dto.senha,
      papel: PapelUsuario.USUARIO,
      tenantId: null,
    });

    return this.gerarToken(usuario);
  }

  async entrar(dto: EntrarDto) {
    const usuario = await this.usuariosService.buscarPorEmail(dto.email);
    if (!usuario) {
      throw new UnauthorizedException({
        codigo: 'CREDENCIAIS_INVALIDAS',
        mensagem: 'E-mail ou senha invalidos.',
      });
    }

    const senhaValida = await this.usuariosService.validarSenha(dto.senha, usuario.senhaHash);
    if (!senhaValida) {
      throw new UnauthorizedException({
        codigo: 'CREDENCIAIS_INVALIDAS',
        mensagem: 'E-mail ou senha invalidos.',
      });
    }

    return this.gerarToken(usuario);
  }

  private gerarToken(usuario: {
    id: string;
    email: string;
    nome: string;
    papel: PapelUsuario;
    tenantId: string | null;
  }) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      papel: usuario.papel,
      tenantId: usuario.tenantId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      sucesso: true,
      accessToken,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        tenantId: usuario.tenantId,
      },
    };
  }
}
