import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateMyTicketDto {
  @IsOptional()
  @IsEnum(['open', 'pending', 'in_progress', 'resolved', 'closed'])
  status?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;
}
