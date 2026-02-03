import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from 'class-validator';

export class RecurringItemDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  quantity: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  rate: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  amount: number;
}
