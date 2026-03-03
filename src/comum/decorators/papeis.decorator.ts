import { SetMetadata } from '@nestjs/common';
import { Papel } from '../enum/papel.enum';

export const CHAVE_PAPEIS = 'papeis';
export const Papeis = (...papeis: Papel[]) => SetMetadata(CHAVE_PAPEIS, papeis);
