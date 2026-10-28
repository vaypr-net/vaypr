import {
  Equals,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class DeleteSubscriberDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  previewToken: string;

  @IsEmail()
  @MaxLength(320)
  confirmEmail: string;

  @Equals('DELETE')
  confirmation: string;

  @Equals(true)
  @Transform(({ obj, key }) => obj[key])
  acknowledgeIrreversible: boolean;

  @Equals(true)
  @Transform(({ obj, key }) => obj[key])
  acknowledgeRetention: boolean;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;
}
