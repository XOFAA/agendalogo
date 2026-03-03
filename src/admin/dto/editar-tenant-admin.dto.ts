import { PartialType } from '@nestjs/swagger';
import { CriarTenantAdminDto } from './criar-tenant-admin.dto';

export class EditarTenantAdminDto extends PartialType(CriarTenantAdminDto) {}
