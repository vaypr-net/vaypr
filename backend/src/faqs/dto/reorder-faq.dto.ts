import { IsMongoId, IsNumber, Min } from 'class-validator';

export class ReorderFaqDto {
  @IsMongoId()
  id: string;

  @IsNumber()
  @Min(0)
  order: number;
}
