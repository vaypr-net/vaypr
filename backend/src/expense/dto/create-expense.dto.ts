import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({
    description: 'Expense category (can be default or custom)',
    example: 'office_supplies',
  })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Description of the expense',
    example: 'Office supplies for team',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Expense amount',
    example: 150.500,
  })
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0.001, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'KWD',
    default: 'KWD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Date of expense',
    example: '2024-01-15',
  })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Vendor/company name',
    example: 'Office Depot',
  })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Monthly supplies purchase',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
