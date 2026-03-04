import { IsString, IsEnum, IsOptional, IsEmail } from 'class-validator';

export class CreateMyTicketDto {
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

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
