import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateUserprofileDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  businessAddress?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  timeZone: string;

  // Notification Preferences
  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  invoiceDueSoon?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  invoiceOverdue?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  quoteViewed?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  quoteAccepted?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  quoteRejected?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  quoteExpired?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  upcomingRenewal?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  renewalSuccessful?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  renewalPaymentFailed?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  subscriptionChanged?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  supportAgentReplied?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  ticketResolved?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  pushNotifications?: boolean;
}
