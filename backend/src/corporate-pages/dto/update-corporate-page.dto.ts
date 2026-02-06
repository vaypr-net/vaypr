import { PartialType } from '@nestjs/swagger';
import { CreateCorporatePageDto } from './create-corporate-page.dto';

export class UpdateCorporatePageDto extends PartialType(CreateCorporatePageDto) {}
