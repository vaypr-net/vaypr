import { PartialType } from '@nestjs/swagger';
import { CreateCommissionPlanDto } from './create-commission-plan.dto';

export class UpdateCommissionPlanDto extends PartialType(CreateCommissionPlanDto) {}
