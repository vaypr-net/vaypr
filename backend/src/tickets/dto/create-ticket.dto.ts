import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  subject: string;

  @IsString()
  customerId: string;

  @IsString()
  customerName: string;

  @IsEmail()
  customerEmail: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority: string;

  @IsString()
  category: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsEnum(['open', 'pending', 'in_progress', 'resolved', 'closed'])
  status?: string;
}

