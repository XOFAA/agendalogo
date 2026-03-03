import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TenantsModule } from '../tenants/tenants.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [TenantsModule, UsuariosModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
