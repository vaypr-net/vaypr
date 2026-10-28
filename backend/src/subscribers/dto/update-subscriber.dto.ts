import { IsString, IsEmail, IsOptional, IsIn } from 'class-validator';

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
  @IsIn(['monthly', 'yearly'])
  subscriptionType?: 'monthly' | 'yearly';

  @IsOptional()
  @IsIn(['active', 'inactive', 'free', 'canceled'])
  status?: 'active' | 'inactive' | 'free' | 'canceled';

  @IsOptional()
  @IsString()
  internalNotes?: string;
}
