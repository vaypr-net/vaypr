import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { FileType } from '../entities/corporate-page.entity';

export class CreateGuideDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(FileType)
  fileType: FileType;

  @IsString()
  fileName: string;

  @IsString()
  fileUrl: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
