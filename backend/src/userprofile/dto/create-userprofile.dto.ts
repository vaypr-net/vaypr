import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

// Helper: explicitly cast incoming value to boolean so that `false` is never
// coerced away by class-transformer's implicit conversion.
const ToBoolean = () =>
  Transform(({ value }) => {
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
    return value;
  });

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
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  invoiceDueSoon?: boolean;

  @ApiProperty({ required: false, default: true })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  invoiceOverdue?: boolean;

  @ApiProperty({ required: false, default: true })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  quoteViewed?: boolean;

  @ApiProperty({ required: false, default: true })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  quoteAccepted?: boolean;

  @ApiProperty({ required: false, default: true })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  quoteRejected?: boolean;

  @ApiProperty({ required: false, default: true })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  quoteModificationRequested?: boolean;

  @ApiProperty({ required: false, default: true })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  quoteExpired?: boolean;

  @ApiProperty({ required: false, default: true })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  upcomingRenewal?: boolean;

  @ApiProperty({ required: false, default: true })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  renewalSuccessful?: boolean;

  @ApiProperty({ required: false, default: true })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  renewalPaymentFailed?: boolean;

  @ApiProperty({ required: false, default: true })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  subscriptionChanged?: boolean;

  @ApiProperty({ required: false, default: true })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  supportAgentReplied?: boolean;

  @ApiProperty({ required: false, default: true })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  ticketResolved?: boolean;

  @ApiProperty({ required: false, default: true })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  pushNotifications?: boolean;
}
