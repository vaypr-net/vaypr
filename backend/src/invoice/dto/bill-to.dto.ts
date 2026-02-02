import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BillToDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  area?: string;

  @IsString()
  @IsOptional()
  block?: string;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  house?: string;

  @IsString()
  @IsOptional()
  other?: string;
}
