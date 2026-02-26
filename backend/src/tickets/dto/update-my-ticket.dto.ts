import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateMyTicketDto {
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;
}
