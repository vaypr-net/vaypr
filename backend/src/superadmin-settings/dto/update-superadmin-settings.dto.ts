import { PartialType } from '@nestjs/swagger';
import { CreateSuperadminSettingsDto } from './create-superadmin-settings.dto';

export class UpdateSuperadminSettingsDto extends PartialType(CreateSuperadminSettingsDto) {}
