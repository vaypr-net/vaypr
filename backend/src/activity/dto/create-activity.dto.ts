import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateActivityDto {
  @IsEnum(['new_subscriber', 'payment', 'invoice_sent', 'domain_verified', 'ticket', 'ticket_resolved', 'affiliate', 'referral', 'upgrade', 'canceled'])
  type: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  relatedEntityId?: string;
}
