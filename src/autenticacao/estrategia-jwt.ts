import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuarioToken } from '../comum/types/usuario-token.type';

@Injectable()
export class EstrategiaJwt extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'segredo-dev'),
    });
  }

  validate(payload: UsuarioToken): UsuarioToken {
    if (!payload?.sub) {
      throw new UnauthorizedException({
        codigo: 'TOKEN_INVALIDO',
        mensagem: 'Token JWT invalido.',
      });
    }
    return payload;
  }
}
