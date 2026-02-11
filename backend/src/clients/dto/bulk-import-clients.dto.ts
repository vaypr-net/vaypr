import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ClientType } from '../enums/client-type.enum';

export class BulkImportClientItemDto {
  @IsEnum(ClientType)
  clientType: ClientType;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  rowNumber?: number;
}

export class BulkImportClientsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportClientItemDto)
  clients: BulkImportClientItemDto[];
}

