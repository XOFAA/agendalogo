import { Papel } from '../enum/papel.enum';

export type UsuarioToken = {
  sub: string;
  email: string;
  nome: string;
  papel: Papel;
  tenantId: string | null;
};
