import { PartialType } from '@nestjs/swagger';
import { CreateSupportPageDto } from './create-support-page.dto';

export class UpdateSupportPageDto extends PartialType(CreateSupportPageDto) {}
