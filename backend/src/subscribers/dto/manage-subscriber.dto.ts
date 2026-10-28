import {
  IsIn,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { SubscriberAction } from '../../common/services/subscriber-lifecycle.service';

export class ManageSubscriberDto {
  @IsDateString()
  expectedUpdatedAt: string;

  @IsIn(['archive', 'restore', 'end_paid_access', 'undo_scheduled_end'])
  action: SubscriberAction;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;

  @IsOptional()
  @IsIn(['immediately', 'period_end'])
  mode?: 'immediately' | 'period_end';
}
