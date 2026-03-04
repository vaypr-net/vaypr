import { IsEmail, IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import type { SenderProvider } from '../entities/user-sender.entity';

export class CreateSenderDto {
  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(100)
  displayName: string;

  @IsEnum(['brevo', 'gmail'])
  provider: SenderProvider;

  @IsOptional()
  @IsEmail()
  replyToEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  replyToName?: string;
}

export class UpdateSenderDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsEmail()
  replyToEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  replyToName?: string;
}

export class SenderResponseDto {
  id: string;
  email: string;
  displayName: string;
  provider: SenderProvider;
  replyToEmail?: string;
  replyToName?: string;
  verified: boolean;
  status: 'active' | 'inactive';
  priority: 1 | 2 | null;
  createdAt: Date;
  isPrimary?: boolean;
  isSecondary?: boolean;
}
