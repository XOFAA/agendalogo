import { Injectable } from '@nestjs/common';
import { QuadrasService } from '../quadras/quadras.service';
import { ReservasService } from '../reservas/reservas.service';
import { SlotsService } from '../slots/slots.service';
import { TenantsService } from '../tenants/tenants.service';
import { inicioEFimDoDia } from '../comum/utils/tempo';

@Injectable()
export class PublicoService {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly quadrasService: QuadrasService,
    private readonly slotsService: SlotsService,
    private readonly reservasService: ReservasService,
  ) {}

  listarTenants() {
    return this.tenantsService.listar();
  }

  buscarTenant(tenantId: string) {
    return this.tenantsService.buscarPorId(tenantId);
  }

  listarQuadras(tenantId: string) {
    return this.quadrasService.listarPorTenant(tenantId, true);
  }

  listarSlots(tenantId: string, quadraId: string, data: string) {
    const { inicio, fim } = inicioEFimDoDia(data);
    return this.slotsService.listarPublicos(tenantId, quadraId, inicio, fim);
  }

  criarReserva(params: { tenantId: string; quadraId: string; slotId: string; usuarioId: string }) {
    return this.reservasService.criarReservaPublica(params);
  }
}
