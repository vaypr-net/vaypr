import { IsString, IsEmail, IsOptional } from 'class-validator';

export class UpdateSubscriberDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  subscriptionType?: 'monthly' | 'yearly';

  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive' | 'free' | 'canceled';

  @IsOptional()
  @IsString()
  internalNotes?: string;
}
