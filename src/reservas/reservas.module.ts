import { Module } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [UsuariosModule],
  providers: [ReservasService],
  exports: [ReservasService],
})
export class ReservasModule {}
