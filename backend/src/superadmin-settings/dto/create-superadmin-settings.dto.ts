import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateSuperadminSettingsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ required: false, default: 'support@vaypr.net' })
  @IsEmail()
  @IsOptional()
  supportEmail?: string;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  notifyNewSubscribers?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  notifyPaymentAlerts?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  notifySupportTickets?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  twoFactorEnabled?: boolean;

  @ApiProperty({ required: false, default: '' })
  @IsString()
  @IsOptional()
  openaiApiKey?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  systemPrompt?: string;
}
