import { PickType } from '@nestjs/swagger';
import { CriarCampeonatoDto } from '../../../campeonatos/dto/criar-campeonato.dto';

export class CriarCampeonatoTenantDto extends PickType(CriarCampeonatoDto, [
  'nome',
  'descricao',
  'tipoEsporte',
  'dataInicio',
  'dataFim',
  'valorInscricaoCentavos',
  'maxParticipantes',
] as const) {}
